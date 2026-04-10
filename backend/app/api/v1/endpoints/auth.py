"""
Authentication endpoints using Supabase Auth.
Handles signup, login, OTP verification, and token refresh.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.core.supabase import get_supabase
from app.core.deps import get_current_user
from app.schemas.auth import (
    SignUpRequest, SignUpResponse,
    VerifyOTPRequest, VerifyOTPResponse,
    LoginRequest, LoginResponse,
    RefreshTokenRequest, ResendOTPRequest,
    ForgotPasswordRequest, UpdatePasswordRequest,
)
from app.schemas.common import MessageResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/signup", response_model=SignUpResponse, status_code=201)
async def sign_up(
    body: SignUpRequest,
    supabase: Client = Depends(get_supabase)
):
    """
    Register new user with email verification.
    Sends OTP code to email.
    """
    try:
        # Sign up with Supabase Auth
        meta = {"full_name": body.full_name}
        if body.phone_number:
            meta["phone_number"] = body.phone_number
        if body.gender:
            meta["gender"] = body.gender

        response = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {"data": meta}
        })
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user. Email may already exist."
            )

        # Upsert profile so gender + full_name are always saved
        try:
            from app.core.supabase import get_supabase_admin as _get_admin
            _admin = _get_admin()
            profile_data: dict = {"id": str(response.user.id), "full_name": body.full_name}
            if body.gender:
                profile_data["gender"] = body.gender
            _admin.table("profiles").upsert(profile_data).execute()
        except Exception:
            pass
        
        # When "Confirm email" is OFF, Supabase returns a session immediately
        if response.session:
            return SignUpResponse(
                message="Account created successfully!",
                email=body.email,
                user_id=str(response.user.id),
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
                user=response.user.model_dump() if response.user else {}
            )

        return SignUpResponse(
            message="Verification code sent to your email. Check your inbox!",
            email=body.email,
            user_id=str(response.user.id)
        )
        
    except Exception as e:
        logger.error("Signup error: %s | type: %s", str(e), type(e).__name__, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_otp(
    body: VerifyOTPRequest,
    supabase: Client = Depends(get_supabase)
):
    """
    Verify email using OTP code.
    Returns JWT tokens on success.
    """
    try:
        response = supabase.auth.verify_otp({
            "email": body.email,
            "token": body.token,
            "type": "signup"
        })
        
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code"
            )
        
        return VerifyOTPResponse(
            message="Email verified successfully! You can now login.",
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user=response.user.model_dump() if response.user else {}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(
    body: ResendOTPRequest,
    supabase: Client = Depends(get_supabase)
):
    """
    Resend verification code to email.
    """
    try:
        supabase.auth.resend({
            "type": "signup",
            "email": body.email
        })
        
        return MessageResponse(
            message="Verification code resent successfully",
            success=True
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    supabase: Client = Depends(get_supabase)
):
    """
    Login with email and password.
    Returns JWT access and refresh tokens.
    """
    try:
        response = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
        
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        return LoginResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            token_type="bearer",
            user=response.user.model_dump() if response.user else {}
        )
        
    except Exception as e:
        # Check if email not verified
        if "Email not confirmed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email first"
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(
    body: RefreshTokenRequest,
    supabase: Client = Depends(get_supabase)
):
    """
    Refresh access token using refresh token.
    """
    try:
        response = supabase.auth.refresh_session(body.refresh_token)
        
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        return LoginResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            token_type="bearer",
            user=response.user.model_dump() if response.user else {}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh token"
        )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Logout current user - revokes all active sessions server-side.
    """
    try:
        from app.core.supabase import get_supabase_admin
        admin = get_supabase_admin()
        admin.auth.admin.sign_out(current_user['id'])
        return MessageResponse(
            message="Logged out successfully",
            success=True
        )
    except Exception:
        # Even if revocation fails, client should clear tokens
        return MessageResponse(message="Logged out successfully", success=True)


@router.get("/me", response_model=dict)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current authenticated user info.
    """
    return current_user


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    supabase: Client = Depends(get_supabase)
):
    """
    Send password reset email. Always returns success to avoid user enumeration.
    Supabase redirects to redirect_to/reset-password with #access_token in URL fragment.
    """
    from app.core.config import settings
    default_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password" if settings.FRONTEND_URL else "https://jejakmasjid.vercel.app/reset-password"
    # Use the redirect URL sent by the frontend (based on window.location.origin)
    # so it works for both localhost and production.
    redirect_url = body.redirect_to or default_url
    try:
        supabase.auth.reset_password_for_email(body.email, {"redirect_to": redirect_url})
    except Exception:
        pass  # Don't reveal whether email exists
    return MessageResponse(message="Emel tetapan semula telah dihantar jika akaun wujud", success=True)


@router.post("/update-password", response_model=MessageResponse)
async def update_password(
    body: UpdatePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update password. Requires valid recovery token in Authorization header.
    """
    try:
        from app.core.supabase import get_supabase_admin
        admin = get_supabase_admin()
        admin.auth.admin.update_user_by_id(current_user["id"], {"password": body.new_password})
        return MessageResponse(message="Kata laluan berjaya dikemaskini", success=True)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/account", response_model=MessageResponse)
async def delete_account(
    current_user: dict = Depends(get_current_user),
):
    """
    Permanently delete the authenticated user's account and all associated data.
    """
    try:
        from app.core.supabase import get_supabase_admin
        admin = get_supabase_admin()
        admin.auth.admin.delete_user(current_user["id"])
        return MessageResponse(message="Akaun anda telah dipadam. Selamat tinggal!", success=True)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

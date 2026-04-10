"""
Authentication schemas for signup, login, and OTP verification.
"""
from pydantic import EmailStr, Field
from app.schemas.base import CamelModel


# ── Sign Up ──────────────────────────────────────────────────────────
class SignUpRequest(CamelModel):
    """User registration with email verification."""
    email: EmailStr
    password: str = Field(min_length=8, description="Min 8 characters")
    full_name: str = Field(min_length=2, max_length=100)
    phone_number: str | None = None
    gender: str | None = None  # 'Lelaki' or 'Perempuan'


class SignUpResponse(CamelModel):
    """Response after signup. May include session if email confirmation is disabled."""
    message: str = "Verification code sent to your email"
    email: str
    user_id: str
    access_token: str | None = None
    refresh_token: str | None = None
    user: dict | None = None


# ── OTP Verification ────────────────────────────────────────────────
class VerifyOTPRequest(CamelModel):
    """OTP code verification."""
    email: EmailStr
    token: str = Field(min_length=4, max_length=10, description="OTP code")


class VerifyOTPResponse(CamelModel):
    """Response after successful verification."""
    message: str = "Email verified successfully"
    access_token: str
    refresh_token: str
    user: dict


# ── Login ───────────────────────────────────────────────────────────
class LoginRequest(CamelModel):
    """Email and password login."""
    email: EmailStr
    password: str


class LoginResponse(CamelModel):
    """JWT tokens returned after successful login."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


# ── Refresh Token ───────────────────────────────────────────────────
class RefreshTokenRequest(CamelModel):
    """Request new access token using refresh token."""
    refresh_token: str


# ── Resend OTP ──────────────────────────────────────────────────────
class ResendOTPRequest(CamelModel):
    """Resend verification code to email."""
    email: EmailStr


# ── Forgot / Reset Password ──────────────────────────────────────────
class ForgotPasswordRequest(CamelModel):
    """Send password reset email."""
    email: EmailStr
    redirect_to: str | None = None  # Frontend passes its own origin


class UpdatePasswordRequest(CamelModel):
    """Update password using recovery token already set in session."""
    new_password: str = Field(min_length=8)

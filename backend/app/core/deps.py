"""
Authentication dependencies for FastAPI endpoints.
Validates JWT tokens from Supabase and provides current user context.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.core.supabase import get_supabase
from supabase import Client

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase)
) -> dict:
    """
    Verify JWT token and return current user data.
    Raises 401 if token is invalid or expired.
    """
    token = credentials.credentials
    
    try:
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        
        user = user_response.user
        return {
            'id': str(user.id),
            'email': user.email,
            'user_metadata': user.user_metadata or {},
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    supabase: Client = Depends(get_supabase)
) -> Optional[dict]:
    """
    Optional authentication - returns user if authenticated, None if not.
    Used for endpoints that have different behavior for authenticated users.
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            return None
        user = user_response.user
        return {
            'id': str(user.id),
            'email': user.email,
            'user_metadata': user.user_metadata or {},
        }
    except Exception:
        return None

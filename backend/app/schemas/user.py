"""
User profile schemas matching Supabase profiles table.
"""
import uuid
from datetime import datetime
from pydantic import EmailStr, Field
from app.schemas.base import CamelModel


# ── Response Bodies ──────────────────────────────────────────────────

class UserProfile(CamelModel):
    """Public user profile."""
    id: uuid.UUID
    full_name: str
    phone_number: str | None
    reputation_points: int
    streak_count: int
    longest_streak: int
    created_at: datetime


class UserProfileComplete(UserProfile):
    """Complete profile with email (for own profile only)."""
    email: EmailStr
    last_checkin_at: datetime | None


# ── Update Profile ──────────────────────────────────────────────────

class UserProfileUpdate(CamelModel):
    """Update user profile info."""
    full_name: str | None = Field(None, min_length=2, max_length=100)
    phone_number: str | None = None


# ── Auth responses ───────────────────────────────────────────────────────────

class TokenPair(CamelModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(CamelModel):
    refresh_token: str

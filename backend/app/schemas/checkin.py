"""
Check-in/Visit schemas for tracking user masjid visits and streaks.
"""
from typing import Literal
from pydantic import Field
from uuid import UUID
from datetime import date, datetime
from app.schemas.base import CamelModel


# ── Visit Types ──────────────────────────────────────────────────────
VisitType = Literal["subuh", "zohor", "asar", "maghrib", "isyak", "jumaat", "terawih", "iftar", "kuliah", "general"]


# ── Request ─────────────────────────────────────────────────────────

class CheckInRequest(CamelModel):
    """Check-in at a masjid (with geofencing validation)."""
    masjid_id: UUID
    visit_type: VisitType
    latitude: float = Field(ge=-90, le=90, description="User's current latitude")
    longitude: float = Field(ge=-180, le=180, description="User's current longitude")


# ── Response ────────────────────────────────────────────────────────

class CheckInResponse(CamelModel):
    """Response after successful check-in."""
    message: str
    visit_id: UUID
    streak_count: int
    points_earned: int
    badges_unlocked: list[str] = []  # List of badge codes earned
    distance_meters: float  # How far user was from masjid


class VisitResponse(CamelModel):
    """Single visit record."""
    id: UUID
    user_id: UUID
    masjid_id: UUID
    visit_type: VisitType
    visit_date: date
    distance_meters: float | None
    created_at: datetime
    
    # Optional: include masjid name for display
    masjid_name: str | None = None


class VisitHistoryResponse(CamelModel):
    """User's visit history with stats."""
    visits: list[VisitResponse]
    total_visits: int
    current_streak: int
    longest_streak: int
    unique_masjids: int
    favorite_masjid: str | None  # Name of most visited masjid


# ── Streak Calculation ──────────────────────────────────────────────

class StreakInfo(CamelModel):
    """Current streak information."""
    current_streak: int
    longest_streak: int
    last_checkin_at: datetime | None
    streak_active: bool  # False if last check-in was >24h ago

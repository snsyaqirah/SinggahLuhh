"""
Gamification schemas - badges, achievements, reputation points.
"""
from typing import Literal
from pydantic import Field
from uuid import UUID
from datetime import datetime
from app.schemas.base import CamelModel


# ── Badge Types ──────────────────────────────────────────────────────
BadgeRequirementType = Literal["streak", "visit_count", "contribution"]


# ── Badge Schemas ────────────────────────────────────────────────────

class BadgeResponse(CamelModel):
    """Badge definition."""
    id: UUID
    code: str
    name: str
    description: str
    icon: str
    requirement_type: BadgeRequirementType
    requirement_value: int
    created_at: datetime


class UserBadgeResponse(CamelModel):
    """Badge earned by user with timestamp."""
    id: UUID
    user_id: UUID
    badge: BadgeResponse
    earned_at: datetime
    progress: float = Field(description="Progress towards next level (0-1)")


# ── Leaderboard ─────────────────────────────────────────────────────

class LeaderboardEntry(CamelModel):
    """Single entry in leaderboard."""
    rank: int
    user_id: UUID
    full_name: str
    reputation_points: int
    streak_count: int
    total_visits: int
    badges_earned: int


class LeaderboardResponse(CamelModel):
    """Leaderboard with pagination."""
    entries: list[LeaderboardEntry]
    user_rank: int | None  # Current user's rank (if authenticated)
    total_users: int


# ── User Stats ─────────────────────────────────────────────────────

class UserStatsResponse(CamelModel):
    """Comprehensive user statistics for dashboard."""
    reputation_points: int
    streak_count: int
    longest_streak: int
    total_visits: int
    unique_masjids_visited: int
    badges_earned: int
    total_badges: int
    badges: list[UserBadgeResponse]
    
    # Breakdown by visit type
    visit_breakdown: dict[str, int]  # {"subuh": 10, "terawih": 15, ...}
    
    # Ramadan-specific stats (if during Ramadan)
    ramadan_stats: dict | None = None  # {"terawih_count": 20, "iftar_count": 15}


# ── Reputation Events ───────────────────────────────────────────────

class ReputationEvent(CamelModel):
    """Track what earned reputation points."""
    event_type: Literal["check_in", "masjid_created", "masjid_verified", "iftar_update", "kucing_update"]
    points_earned: int
    description: str
    timestamp: datetime

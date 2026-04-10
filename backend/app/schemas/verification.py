"""
Peer review/verification system for masjid data accuracy.
"""
from typing import Literal
from pydantic import Field
from uuid import UUID
from datetime import datetime
from app.schemas.base import CamelModel


# ── Vote Types ──────────────────────────────────────────

VoteType = Literal["upvote", "downvote"]


# ── Request ─────────────────────────────────────────────

class VerificationVote(CamelModel):
    """Upvote or downvote a masjid."""
    masjid_id: UUID
    vote_type: VoteType
    reason: str | None = Field(None, max_length=500, description="Required for downvotes")


# ── Response ────────────────────────────────────────────

class VerificationResponse(CamelModel):
    """Result of verification vote."""
    message: str
    masjid_id: UUID
    new_verification_count: int
    new_status: Literal["pending", "verified", "flagged"]
    auto_verified: bool = False  # True if this vote triggered auto-verification


class MasjidVerificationStatus(CamelModel):
    """Current verification status of a masjid."""
    masjid_id: UUID
    status: Literal["pending", "verified", "flagged", "rejected"]
    verification_count: int
    needed_for_verification: int  # How many more upvotes needed
    user_has_voted: bool = False
    user_vote_type: VoteType | None = None


# ── Report System ───────────────────────────────────────

ReportType = Literal["does_not_exist", "wrong_location", "duplicate", "inappropriate_content", "wrong_info", "other"]
ReportStatus = Literal["pending", "reviewing", "resolved", "dismissed"]


class ReportCreate(CamelModel):
    """Report incorrect masjid data."""
    masjid_id: UUID
    report_type: ReportType
    description: str = Field(min_length=10, max_length=1000)


class ReportResponse(CamelModel):
    """Report submission result."""
    id: UUID
    masjid_id: UUID
    reporter_id: UUID
    report_type: ReportType
    description: str
    status: ReportStatus
    created_at: datetime


class ReportAdminView(ReportResponse):
    """Admin view of reports with resolution info."""
    resolution_notes: str | None
    resolved_by: UUID | None
    resolved_at: datetime | None
    masjid_name: str
    reporter_email: str

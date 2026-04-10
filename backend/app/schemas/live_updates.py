"""
Live updates for real-time crowdsourcing (saf status, parking, iftar menu).
"""
from typing import Literal
from pydantic import Field
from uuid import UUID
from datetime import datetime
from app.schemas.base import CamelModel


# ── Update Types ────────────────────────────────────────────────────
UpdateType = Literal["saf_status", "parking_status", "iftar_menu", "crowd_level"]


# ── Request ─────────────────────────────────────────────────────────

class LiveUpdateCreate(CamelModel):
    """Post a live update (valid for 45 min - 24 hours)."""
    masjid_id: UUID
    update_type: UpdateType
    value: str = Field(max_length=500, description="Status value or menu text")


# ── Response ────────────────────────────────────────────────────────

class LiveUpdateResponse(CamelModel):
    """Live update with expiry time."""
    id: UUID
    masjid_id: UUID
    user_id: UUID
    update_type: UpdateType
    value: str
    expires_at: datetime
    created_at: datetime
    time_remaining_minutes: int  # Calculated field
    

class MasjidLiveStatus(CamelModel):
    """All active live updates for a masjid."""
    masjid_id: UUID
    masjid_name: str
    saf_status: str | None = None
    parking_status: str | None = None
    iftar_menu: str | None = None
    crowd_level: str | None = None
    last_updated_at: datetime | None = None
    

# ── Common Values (for frontend dropdowns) ─────────────────────────

class LiveUpdateOptions(CamelModel):
    """Predefined options for each update type."""
    saf_status: list[str] = ["Selesa", "Mula Rapat", "Padat", "Melimpah ke Luar"]
    parking_status: list[str] = ["Banyak Ruang", "Sederhana", "Hampir Penuh", "Penuh"]
    crowd_level: list[str] = ["Sepi", "Sederhana", "Ramai", "Sangat Ramai"]

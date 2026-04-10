"""
Masjid schemas with complete Supabase integration.
Includes facilities, media, live updates, and verification status.
"""
import uuid
from datetime import datetime
from typing import Literal
from pydantic import Field
from app.schemas.base import CamelModel
from app.schemas.facilities import FacilitiesResponse
from app.schemas.live_updates import MasjidLiveStatus
from app.schemas.verification import MasjidVerificationStatus


# ── Enums ────────────────────────────────────────────────────────────
MasjidStatus = Literal["pending", "verified", "flagged", "rejected"]
MediaType = Literal["main_photo", "toilet_photo", "interior_photo", "qr_tng", "qr_duitnow", "masjid_board"]


# ── Request bodies (Create/Update) ──────────────────────────────────

class MasjidCreate(CamelModel):
    """Create new masjid with location validation."""
    name: str = Field(min_length=3, max_length=200)
    address: str = Field(max_length=500)
    description: str | None = Field(None, max_length=2000)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class MasjidUpdate(CamelModel):
    """Update masjid info (owner or admin only)."""
    name: str | None = Field(None, min_length=3, max_length=200)
    address: str | None = None
    description: str | None = None
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)


# ── Media (Photos & QR Codes) ───────────────────────────────────────

class MasjidMediaCreate(CamelModel):
    """Upload photo or QR code."""
    masjid_id: uuid.UUID
    media_type: MediaType
    url: str  # Uploaded to storage, URL returned


class MasjidMediaResponse(CamelModel):
    """Media item with verification status."""
    id: uuid.UUID
    masjid_id: uuid.UUID
    media_type: MediaType
    url: str
    is_verified: bool = False
    verification_count: int = 0
    created_at: datetime
    created_by: uuid.UUID | None = None


# ── Response bodies ─────────────────────────────────────────────────

class MasjidListItem(CamelModel):
    """Lightweight masjid card for list/map views."""
    id: uuid.UUID
    name: str
    address: str
    latitude: float
    longitude: float
    status: MasjidStatus
    verification_count: int
    distance_meters: float | None = None  # Populated if nearby search
    
    # Quick preview of key facilities
    cooling_system: str | None = None
    has_coway: bool = False
    kucing_count: str | None = None
    
    # Media preview
    main_photo: str | None = None
    
    created_at: datetime


class MasjidDetail(CamelModel):
    """Full masjid profile page."""
    id: uuid.UUID
    name: str
    address: str
    description: str | None
    latitude: float
    longitude: float
    status: MasjidStatus
    verification_count: int
    
    # Complete facilities data
    facilities: FacilitiesResponse | None
    
    # Media gallery
    media: list[MasjidMediaResponse]
    
    # Live status (real-time crowdsourced data)
    live_status: MasjidLiveStatus | None
    
    # Verification status
    verification: MasjidVerificationStatus
    
    # Stats
    total_visits: int = 0
    unique_visitors: int = 0
    
    # Audit
    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID | None
    updated_by: uuid.UUID | None


# ── Nearby Search (100m Radius Check) ──────────────────────────────

class NearbySearchRequest(CamelModel):
    """Search for masjids near coordinates."""
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    radius_meters: int = Field(100, le=5000, description="Search radius (max 5km)")


class NearbyMasjidResult(CamelModel):
    """Result from nearby search with distance."""
    id: uuid.UUID
    name: str
    distance_meters: float
    address: str
    status: MasjidStatus

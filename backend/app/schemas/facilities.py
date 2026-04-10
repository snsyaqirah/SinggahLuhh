"""
Masjid facilities schemas - all the fun Malaysian features!
"""
from typing import Literal
from pydantic import Field
from uuid import UUID
from datetime import datetime
from app.schemas.base import CamelModel


# ── Enums (using Literal for type safety) ──────────────────────────

TerawihRakaat = Literal[8, 11, 20, 23]
IftarType = Literal["Nasi Kotak", "Talam", "Buffet", "Bawa Sendiri", "Tidak Pasti"]
CoolingSystem = Literal["Full AC / Sejuk Gila", "AC Sebahagian", "Kipas Gergasi (HVLS)", "Kipas Biasa", "Panas"]
KucingCount = Literal["Banyak / Kucing Friendly", "Ada Seekor Oren", "Ada Sikit", "Takda", "Tidak Pasti"]
KarpetVibe = Literal["Tebal / Selesa", "Standard", "Nipis", "Sajadah Sendiri"]
ParkingLevel = Literal["Senang", "Sederhana", "Susah / Double Park"]
TelekungRating = Literal["Banyak & Bersih", "Ada Tapi Sikit", "Bawa Sendiri"]
ToiletCleanliness = Literal["Bersih", "Sederhana", "Kurang Bersih"]
ToiletFloorCondition = Literal["Kering", "Licin", "Basah"]


# ── Request/Update ─────────────────────────────────────────────────

class FacilitiesCreate(CamelModel):
    """Create/Update facilities for a masjid."""
    
    # Prayer Info
    terawih_rakaat: TerawihRakaat | None = None
    
    # Iftar Info
    has_iftar: bool = False
    iftar_type: IftarType | None = None
    iftar_menu: str | None = Field(None, max_length=500, description="Today's iftar menu")
    
    # Cooling (The Sejuk Meter!)
    cooling_system: CoolingSystem = "Kipas Biasa"
    
    # Malaysian Lovable Features
    has_coway: bool = False
    kucing_count: KucingCount = "Tidak Pasti"
    karpet_vibe: KarpetVibe | None = None
    talam_gang: bool = False
    
    # Parking
    parking_level: ParkingLevel | None = None
    has_parking_oku: bool = False
    has_parking_moto: bool = True
    
    # Family & Accessibility
    has_kids_area: bool = False
    is_family_friendly: bool = True
    
    # Women's Facilities
    has_clean_telekung: bool = False
    telekung_rating: TelekungRating | None = None
    
    # Wudhu & Toilet
    wudhu_seating: bool = False
    toilet_cleanliness: ToiletCleanliness | None = None
    toilet_floor_condition: ToiletFloorCondition | None = None
    
    # Special Features
    is_tourist_friendly: bool = False
    has_tahfiz: bool = False
    has_library: bool = False

    # Public Transport
    near_bas: bool = False
    near_lrt: bool = False
    near_mrt: bool = False


class FacilitiesUpdate(FacilitiesCreate):
    """Same as create - all fields optional."""
    pass


# ── Response ────────────────────────────────────────────────────────

class FacilitiesResponse(CamelModel):
    """Full facilities data returned from API."""
    id: UUID
    masjid_id: UUID
    
    # All facility fields
    terawih_rakaat: TerawihRakaat | None
    has_iftar: bool
    iftar_type: IftarType | None
    iftar_menu: str | None
    cooling_system: CoolingSystem
    has_coway: bool
    kucing_count: KucingCount
    karpet_vibe: KarpetVibe | None
    talam_gang: bool
    parking_level: ParkingLevel | None
    has_parking_oku: bool
    has_parking_moto: bool
    has_kids_area: bool
    is_family_friendly: bool
    has_clean_telekung: bool
    telekung_rating: TelekungRating | None
    wudhu_seating: bool
    toilet_cleanliness: ToiletCleanliness | None
    toilet_floor_condition: ToiletFloorCondition | None
    is_tourist_friendly: bool
    has_tahfiz: bool
    has_library: bool
    near_bas: bool
    near_lrt: bool
    near_mrt: bool
    
    # Audit fields
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None
    updated_by: UUID | None

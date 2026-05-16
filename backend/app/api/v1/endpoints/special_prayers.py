"""
Special Prayers — private log for tahajjud, hajat, istikharah, etc.
"""
from fastapi import APIRouter, Depends
from supabase import Client
from app.core.supabase import get_supabase_admin
from app.core.deps import get_current_user
from app.schemas.base import CamelModel
from typing import Literal

router = APIRouter()

PrayerType = Literal["tahajjud", "hajat", "istikharah", "witir", "dhuha", "taubat", "syukur", "others"]


class SpecialPrayerCreate(CamelModel):
    prayer_type: PrayerType
    rakaat: int | None = None
    notes: str | None = None
    masjid_id: str | None = None
    is_ramadan: bool = False


class SpecialPrayerResponse(CamelModel):
    id: str
    prayer_type: str
    rakaat: int | None = None
    notes: str | None = None
    masjid_id: str | None = None
    is_ramadan: bool
    created_at: str
    masjid_name: str | None = None


PRAYER_LABELS = {
    "tahajjud":   "Tahajjud",
    "hajat":      "Hajat",
    "istikharah": "Istikharah",
    "witir":      "Witir",
    "dhuha":      "Dhuha",
    "taubat":     "Taubat",
    "syukur":     "Syukur",
    "others":     "Lain-lain",
}


@router.get("", response_model=list[SpecialPrayerResponse])
async def list_special_prayers(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    res = supabase.table("special_prayers").select(
        "*, masjid:masjids(name)"
    ).eq("user_id", current_user["id"]).order("created_at", desc=True).execute()

    result = []
    for row in (res.data or []):
        m = row.get("masjid") or {}
        result.append(SpecialPrayerResponse(
            id=row["id"],
            prayer_type=row["prayer_type"],
            rakaat=row.get("rakaat"),
            notes=row.get("notes"),
            masjid_id=row.get("masjid_id"),
            is_ramadan=row.get("is_ramadan", False),
            created_at=row["created_at"],
            masjid_name=m.get("name"),
        ))
    return result


@router.post("", status_code=201, response_model=SpecialPrayerResponse)
async def log_special_prayer(
    body: SpecialPrayerCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    payload = body.model_dump()
    payload["user_id"] = current_user["id"]
    res = supabase.table("special_prayers").insert(payload).execute()
    row = res.data[0]
    return SpecialPrayerResponse(
        id=row["id"],
        prayer_type=row["prayer_type"],
        rakaat=row.get("rakaat"),
        notes=row.get("notes"),
        masjid_id=row.get("masjid_id"),
        is_ramadan=row.get("is_ramadan", False),
        created_at=row["created_at"],
    )


@router.delete("/{entry_id}", status_code=204)
async def delete_special_prayer(
    entry_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    supabase.table("special_prayers").delete().eq(
        "id", entry_id
    ).eq("user_id", current_user["id"]).execute()

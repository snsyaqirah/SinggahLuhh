"""
Khatam Tracker — track Quran reading progress per session.
"""
from fastapi import APIRouter, Depends
from supabase import Client
from app.core.supabase import get_supabase_admin
from app.core.deps import get_current_user
from app.schemas.base import CamelModel

router = APIRouter()


class KhatamUpsert(CamelModel):
    surah_from: int         # 1–114
    ayah_from: int
    surah_to: int
    ayah_to: int
    juz: int | None = None  # 1–30
    notes: str | None = None
    masjid_id: str | None = None


class KhatamResponse(CamelModel):
    id: str
    surah_from: int
    ayah_from: int
    surah_to: int
    ayah_to: int
    juz: int | None = None
    notes: str | None = None
    masjid_id: str | None = None
    created_at: str


@router.get("", response_model=list[KhatamResponse])
async def list_khatam(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    res = supabase.table("khatam_progress").select("*").eq(
        "user_id", current_user["id"]
    ).order("created_at", desc=True).execute()
    return [KhatamResponse(**{k: row.get(k) for k in KhatamResponse.model_fields}) for row in (res.data or [])]


@router.post("", status_code=201, response_model=KhatamResponse)
async def log_khatam(
    body: KhatamUpsert,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Log a Quran reading session."""
    payload = body.model_dump()
    payload["user_id"] = current_user["id"]
    res = supabase.table("khatam_progress").insert(payload).execute()
    row = res.data[0]
    return KhatamResponse(**{k: row.get(k) for k in KhatamResponse.model_fields})


@router.delete("/{entry_id}", status_code=204)
async def delete_khatam(
    entry_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    supabase.table("khatam_progress").delete().eq(
        "id", entry_id
    ).eq("user_id", current_user["id"]).execute()

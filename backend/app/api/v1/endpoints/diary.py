"""
Masjid Diary — private personal notes per masjid (strictly private, RLS enforced).
"""
from fastapi import APIRouter, Depends
from supabase import Client
from app.core.supabase import get_supabase_admin
from app.core.deps import get_current_user
from app.schemas.base import CamelModel

router = APIRouter()


class DiaryEntryCreate(CamelModel):
    masjid_id: str
    content: str
    mood: str | None = None       # emoji or short string
    visit_type: str | None = None


class DiaryEntryUpdate(CamelModel):
    content: str | None = None
    mood: str | None = None


class DiaryEntryResponse(CamelModel):
    id: str
    masjid_id: str
    content: str
    mood: str | None = None
    visit_type: str | None = None
    created_at: str
    updated_at: str
    masjid_name: str | None = None


@router.get("", response_model=list[DiaryEntryResponse])
async def list_diary(
    masjid_id: str | None = None,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """List all diary entries, optionally filtered by masjid."""
    q = supabase.table("masjid_diary").select(
        "*, masjid:masjids(name)"
    ).eq("user_id", current_user["id"]).order("created_at", desc=True)

    if masjid_id:
        q = q.eq("masjid_id", masjid_id)

    res = q.execute()
    result = []
    for row in (res.data or []):
        m = row.get("masjid") or {}
        result.append(DiaryEntryResponse(
            id=row["id"],
            masjid_id=row["masjid_id"],
            content=row["content"],
            mood=row.get("mood"),
            visit_type=row.get("visit_type"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            masjid_name=m.get("name"),
        ))
    return result


@router.post("", status_code=201, response_model=DiaryEntryResponse)
async def create_diary_entry(
    body: DiaryEntryCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Add a private diary entry for a masjid visit."""
    res = supabase.table("masjid_diary").insert({
        "user_id": current_user["id"],
        "masjid_id": body.masjid_id,
        "content": body.content,
        "mood": body.mood,
        "visit_type": body.visit_type,
    }).execute()
    row = res.data[0]
    return DiaryEntryResponse(
        id=row["id"],
        masjid_id=row["masjid_id"],
        content=row["content"],
        mood=row.get("mood"),
        visit_type=row.get("visit_type"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.patch("/{entry_id}", response_model=DiaryEntryResponse)
async def update_diary_entry(
    entry_id: str,
    body: DiaryEntryUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Update a diary entry (owner only)."""
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise ValueError("Nothing to update")
    res = supabase.table("masjid_diary").update(update).eq(
        "id", entry_id
    ).eq("user_id", current_user["id"]).execute()
    row = res.data[0]
    return DiaryEntryResponse(**{k: row.get(k) for k in DiaryEntryResponse.model_fields})


@router.delete("/{entry_id}", status_code=204)
async def delete_diary_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    supabase.table("masjid_diary").delete().eq(
        "id", entry_id
    ).eq("user_id", current_user["id"]).execute()

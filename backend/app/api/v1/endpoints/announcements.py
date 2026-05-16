"""
Masjid Announcements — public notice board per masjid.
"""
from fastapi import APIRouter, Depends, Query
from supabase import Client
from app.core.supabase import get_supabase_admin
from app.core.deps import get_current_user, get_current_user_optional
from app.schemas.base import CamelModel

router = APIRouter()


class AnnouncementCreate(CamelModel):
    masjid_id: str
    title: str
    body: str
    category: str = "umum"  # umum, solat, event, iftar, others
    is_pinned: bool = False


class AnnouncementResponse(CamelModel):
    id: str
    masjid_id: str
    title: str
    body: str
    category: str
    is_pinned: bool
    created_at: str
    expires_at: str | None = None
    masjid_name: str | None = None
    created_by: str | None = None


@router.get("", response_model=list[AnnouncementResponse])
async def list_announcements(
    masjid_id: str | None = Query(None),
    current_user: dict | None = Depends(get_current_user_optional),
    supabase: Client = Depends(get_supabase_admin),
):
    q = supabase.table("masjid_announcements").select(
        "*, masjid:masjids(name)"
    ).order("is_pinned", desc=True).order("created_at", desc=True)

    if masjid_id:
        q = q.eq("masjid_id", masjid_id)

    res = q.execute()
    result = []
    for row in (res.data or []):
        m = row.get("masjid") or {}
        result.append(AnnouncementResponse(
            id=row["id"],
            masjid_id=row["masjid_id"],
            title=row["title"],
            body=row["body"],
            category=row.get("category", "umum"),
            is_pinned=row.get("is_pinned", False),
            created_at=str(row["created_at"]),
            expires_at=str(row["expires_at"]) if row.get("expires_at") else None,
            masjid_name=m.get("name"),
            created_by=row.get("created_by"),
        ))
    return result


@router.post("", status_code=201, response_model=AnnouncementResponse)
async def create_announcement(
    body: AnnouncementCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    payload = body.model_dump()
    payload["created_by"] = current_user["id"]
    res = supabase.table("masjid_announcements").insert(payload).execute()
    row = res.data[0]
    return AnnouncementResponse(
        id=row["id"],
        masjid_id=row["masjid_id"],
        title=row["title"],
        body=row["body"],
        category=row.get("category", "umum"),
        is_pinned=row.get("is_pinned", False),
        created_at=str(row["created_at"]),
        created_by=row.get("created_by"),
    )


@router.delete("/{ann_id}", status_code=204)
async def delete_announcement(
    ann_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    supabase.table("masjid_announcements").delete().eq(
        "id", ann_id
    ).eq("created_by", current_user["id"]).execute()

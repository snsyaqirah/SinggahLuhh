"""
Lost & Found board — community posts per masjid (expires after 7 days).
"""
from fastapi import APIRouter, Depends, Query
from supabase import Client
from app.core.supabase import get_supabase_admin
from app.core.deps import get_current_user, get_current_user_optional
from app.schemas.base import CamelModel

router = APIRouter()


class LostFoundCreate(CamelModel):
    masjid_id: str
    description: str


class LostFoundResponse(CamelModel):
    id: str
    masjid_id: str
    description: str
    is_resolved: bool
    created_at: str
    expires_at: str
    user_id: str | None = None


@router.get("", response_model=list[LostFoundResponse])
async def list_posts(
    masjid_id: str | None = Query(None),
    current_user: dict | None = Depends(get_current_user_optional),
    supabase: Client = Depends(get_supabase_admin),
):
    q = (
        supabase.table("lost_found_posts")
        .select("*")
        .is_("deleted_at", "null")
        .order("created_at", desc=True)
    )
    if masjid_id:
        q = q.eq("masjid_id", masjid_id)
    res = q.execute()
    return [
        LostFoundResponse(
            id=row["id"],
            masjid_id=row["masjid_id"],
            description=row["description"],
            is_resolved=row.get("is_resolved", False),
            created_at=str(row["created_at"]),
            expires_at=str(row["expires_at"]),
            user_id=row.get("user_id"),
        )
        for row in (res.data or [])
    ]


@router.post("", status_code=201, response_model=LostFoundResponse)
async def create_post(
    body: LostFoundCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    payload = body.model_dump()
    payload["user_id"] = current_user["id"]
    res = supabase.table("lost_found_posts").insert(payload).execute()
    row = res.data[0]
    return LostFoundResponse(
        id=row["id"],
        masjid_id=row["masjid_id"],
        description=row["description"],
        is_resolved=row.get("is_resolved", False),
        created_at=str(row["created_at"]),
        expires_at=str(row["expires_at"]),
        user_id=row.get("user_id"),
    )


@router.patch("/{post_id}/resolve", status_code=200)
async def resolve_post(
    post_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    supabase.table("lost_found_posts").update({"is_resolved": True}).eq(
        "id", post_id
    ).eq("user_id", current_user["id"]).execute()
    return {"ok": True}


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    supabase.table("lost_found_posts").update({"deleted_at": "now()"}).eq(
        "id", post_id
    ).eq("user_id", current_user["id"]).execute()

"""
Bookmark endpoints — save/wishlist masjids.
is_wishlist=False → "Dah pergi" (visited/saved)
is_wishlist=True  → "Nak pergi" (wishlist)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.core.supabase import get_supabase_admin
from app.core.deps import get_current_user
from app.schemas.base import CamelModel

router = APIRouter()


class BookmarkCreate(CamelModel):
    masjid_id: str
    is_wishlist: bool = False


class BookmarkResponse(CamelModel):
    id: str
    masjid_id: str
    is_wishlist: bool
    created_at: str
    masjid_name: str | None = None
    masjid_address: str | None = None
    masjid_type: str | None = None
    masjid_status: str | None = None


@router.get("", response_model=list[BookmarkResponse])
async def list_bookmarks(
    is_wishlist: bool | None = None,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """List all bookmarks for the current user, optionally filtered by type."""
    q = supabase.table("masjid_bookmarks").select(
        "*, masjid:masjids(name, address, type, status)"
    ).eq("user_id", current_user["id"]).order("created_at", desc=True)

    if is_wishlist is not None:
        q = q.eq("is_wishlist", is_wishlist)

    res = q.execute()
    result = []
    for row in (res.data or []):
        m = row.get("masjid") or {}
        result.append(BookmarkResponse(
            id=row["id"],
            masjid_id=row["masjid_id"],
            is_wishlist=row["is_wishlist"],
            created_at=row["created_at"],
            masjid_name=m.get("name"),
            masjid_address=m.get("address"),
            masjid_type=m.get("type"),
            masjid_status=m.get("status"),
        ))
    return result


@router.get("/status/{masjid_id}")
async def get_bookmark_status(
    masjid_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Check if a masjid is bookmarked by the current user."""
    res = supabase.table("masjid_bookmarks").select("id, is_wishlist").eq(
        "user_id", current_user["id"]
    ).eq("masjid_id", masjid_id).execute()

    if res.data:
        return {"bookmarked": True, "is_wishlist": res.data[0]["is_wishlist"]}
    return {"bookmarked": False, "is_wishlist": False}


@router.post("", status_code=201)
async def add_bookmark(
    body: BookmarkCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Add or update a bookmark. If already bookmarked, updates is_wishlist type."""
    existing = supabase.table("masjid_bookmarks").select("id").eq(
        "user_id", current_user["id"]
    ).eq("masjid_id", body.masjid_id).execute()

    if existing.data:
        # Update the type if different
        supabase.table("masjid_bookmarks").update(
            {"is_wishlist": body.is_wishlist}
        ).eq("id", existing.data[0]["id"]).execute()
        return {"message": "Bookmark dikemaskini"}

    supabase.table("masjid_bookmarks").insert({
        "user_id": current_user["id"],
        "masjid_id": body.masjid_id,
        "is_wishlist": body.is_wishlist,
    }).execute()
    return {"message": "Bookmark ditambah"}


@router.delete("/{masjid_id}", status_code=204)
async def remove_bookmark(
    masjid_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Remove a bookmark."""
    supabase.table("masjid_bookmarks").delete().eq(
        "user_id", current_user["id"]
    ).eq("masjid_id", masjid_id).execute()

"""
Iftar thread — community iftar reviews per masjid, tagged by Ramadan season.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from supabase import Client
from app.core.supabase import get_supabase_admin
from app.core.deps import get_current_user, get_current_user_optional
from app.schemas.base import CamelModel

router = APIRouter()


class IftarCreate(CamelModel):
    masjid_id: str
    iftar_type: str = "other"   # talam, kotak, buffet, diy, other
    description: str | None = None
    rating: int | None = None   # 1–5


class IftarResponse(CamelModel):
    id: str
    masjid_id: str
    iftar_type: str | None
    description: str | None
    rating: int | None
    ramadan_season: str
    created_at: str
    user_id: str | None = None


@router.get("", response_model=list[IftarResponse])
async def list_iftar(
    masjid_id: str | None = Query(None),
    season: str | None = Query(None),
    current_user: dict | None = Depends(get_current_user_optional),
    supabase: Client = Depends(get_supabase_admin),
):
    q = (
        supabase.table("iftar_threads")
        .select("*")
        .is_("deleted_at", "null")
        .order("created_at", desc=True)
    )
    if masjid_id:
        q = q.eq("masjid_id", masjid_id)
    if season:
        q = q.eq("ramadan_season", season)
    res = q.execute()
    return [
        IftarResponse(
            id=row["id"],
            masjid_id=row["masjid_id"],
            iftar_type=row.get("iftar_type"),
            description=row.get("description"),
            rating=row.get("rating"),
            ramadan_season=row["ramadan_season"],
            created_at=str(row["created_at"]),
            user_id=row.get("user_id"),
        )
        for row in (res.data or [])
    ]


@router.post("", status_code=201, response_model=IftarResponse)
async def create_iftar(
    body: IftarCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    payload = body.model_dump()
    payload["user_id"] = current_user["id"]
    payload["ramadan_season"] = str(datetime.now().year)
    res = supabase.table("iftar_threads").insert(payload).execute()
    row = res.data[0]
    return IftarResponse(
        id=row["id"],
        masjid_id=row["masjid_id"],
        iftar_type=row.get("iftar_type"),
        description=row.get("description"),
        rating=row.get("rating"),
        ramadan_season=row["ramadan_season"],
        created_at=str(row["created_at"]),
        user_id=row.get("user_id"),
    )


@router.delete("/{iftar_id}", status_code=204)
async def delete_iftar(
    iftar_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    supabase.table("iftar_threads").update({"deleted_at": "now()"}).eq(
        "id", iftar_id
    ).eq("user_id", current_user["id"]).execute()

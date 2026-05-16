"""
Masjid Events — public event calendar per masjid.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from supabase import Client
from app.core.supabase import get_supabase_admin
from app.core.deps import get_current_user, get_current_user_optional
from app.schemas.base import CamelModel

router = APIRouter()


class EventCreate(CamelModel):
    masjid_id: str
    title: str
    description: str | None = None
    event_type: str = "kuliah"   # kuliah, iftar, gotong_royong, khatam, others
    starts_at: datetime
    ends_at: datetime | None = None
    is_recurring: bool = False


class EventResponse(CamelModel):
    id: str
    masjid_id: str
    title: str
    description: str | None = None
    event_type: str
    starts_at: str
    ends_at: str | None = None
    is_recurring: bool
    created_at: str
    masjid_name: str | None = None
    created_by: str | None = None


@router.get("", response_model=list[EventResponse])
async def list_events(
    masjid_id: str | None = Query(None),
    upcoming_only: bool = Query(True),
    current_user: dict | None = Depends(get_current_user_optional),
    supabase: Client = Depends(get_supabase_admin),
):
    q = supabase.table("masjid_events").select(
        "*, masjid:masjids(name)"
    ).order("starts_at", desc=False)

    if masjid_id:
        q = q.eq("masjid_id", masjid_id)
    if upcoming_only:
        q = q.gte("starts_at", datetime.utcnow().isoformat())

    res = q.execute()
    result = []
    for row in (res.data or []):
        m = row.get("masjid") or {}
        result.append(EventResponse(
            id=row["id"],
            masjid_id=row["masjid_id"],
            title=row["title"],
            description=row.get("description"),
            event_type=row.get("event_type", "kuliah"),
            starts_at=str(row["starts_at"]),
            ends_at=str(row["ends_at"]) if row.get("ends_at") else None,
            is_recurring=row.get("is_recurring", False),
            created_at=str(row["created_at"]),
            masjid_name=m.get("name"),
            created_by=row.get("created_by"),
        ))
    return result


@router.post("", status_code=201, response_model=EventResponse)
async def create_event(
    body: EventCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    payload = body.model_dump()
    payload["created_by"] = current_user["id"]
    payload["starts_at"] = payload["starts_at"].isoformat()
    if payload.get("ends_at"):
        payload["ends_at"] = payload["ends_at"].isoformat()
    res = supabase.table("masjid_events").insert(payload).execute()
    row = res.data[0]
    return EventResponse(
        id=row["id"],
        masjid_id=row["masjid_id"],
        title=row["title"],
        description=row.get("description"),
        event_type=row.get("event_type", "kuliah"),
        starts_at=str(row["starts_at"]),
        ends_at=str(row["ends_at"]) if row.get("ends_at") else None,
        is_recurring=row.get("is_recurring", False),
        created_at=str(row["created_at"]),
        created_by=row.get("created_by"),
    )


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    supabase.table("masjid_events").delete().eq(
        "id", event_id
    ).eq("created_by", current_user["id"]).execute()

"""
Prayer Groups & Buddy System.
Core flow: create → get invite code → join → see members + activity.
"""
import secrets
import string
from fastapi import APIRouter, Depends, Query, HTTPException
from supabase import Client
from app.core.supabase import get_supabase_admin
from app.core.deps import get_current_user
from app.schemas.base import CamelModel

router = APIRouter()


def _invite_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


# ── Schemas ──────────────────────────────────────────────────────

class GroupCreate(CamelModel):
    name: str
    type: str = "group"   # buddy | group


class GroupMemberResponse(CamelModel):
    user_id: str
    full_name: str | None = None
    role: str
    joined_at: str


class RecentVisitItem(CamelModel):
    user_id: str
    full_name: str | None = None
    visit_type: str
    created_at: str
    masjid_name: str | None = None
    masjid_slug: str | None = None


class GroupResponse(CamelModel):
    id: str
    name: str
    type: str
    invite_code: str
    created_by: str
    max_members: int
    member_count: int
    created_at: str


class GroupDetailResponse(CamelModel):
    id: str
    name: str
    type: str
    invite_code: str
    created_by: str
    max_members: int
    created_at: str
    members: list[GroupMemberResponse]
    recent_activity: list[RecentVisitItem]


# ── Endpoints ────────────────────────────────────────────────────

@router.get("", response_model=list[GroupResponse])
async def list_my_groups(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    uid = current_user["id"]

    member_res = supabase.table("prayer_group_members").select("group_id").eq("user_id", uid).execute()
    group_ids = list({r["group_id"] for r in (member_res.data or [])})

    if not group_ids:
        return []

    groups_res = supabase.table("prayer_groups").select("*").in_("id", group_ids).is_("deleted_at", "null").execute()

    counts_res = supabase.table("prayer_group_members").select("group_id").in_("group_id", group_ids).execute()
    count_map: dict[str, int] = {}
    for r in (counts_res.data or []):
        gid = r["group_id"]
        count_map[gid] = count_map.get(gid, 0) + 1

    return [
        GroupResponse(
            id=g["id"], name=g["name"], type=g["type"],
            invite_code=g["invite_code"], created_by=g["created_by"],
            max_members=g.get("max_members", 10),
            member_count=count_map.get(g["id"], 0),
            created_at=str(g["created_at"]),
        )
        for g in (groups_res.data or [])
    ]


@router.post("", status_code=201, response_model=GroupResponse)
async def create_group(
    body: GroupCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    if body.type not in ("buddy", "group"):
        raise HTTPException(400, "Jenis tidak sah")

    res = supabase.table("prayer_groups").insert({
        "name": body.name,
        "type": body.type,
        "invite_code": _invite_code(),
        "created_by": current_user["id"],
    }).execute()
    g = res.data[0]

    # Auto-join as admin
    supabase.table("prayer_group_members").insert({
        "group_id": g["id"],
        "user_id": current_user["id"],
        "role": "admin",
    }).execute()

    return GroupResponse(
        id=g["id"], name=g["name"], type=g["type"],
        invite_code=g["invite_code"], created_by=g["created_by"],
        max_members=g.get("max_members", 10),
        member_count=1, created_at=str(g["created_at"]),
    )


@router.post("/join", status_code=200, response_model=GroupResponse)
async def join_group(
    invite_code: str = Query(...),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    group_res = supabase.table("prayer_groups").select("*").eq(
        "invite_code", invite_code.strip().upper()
    ).is_("deleted_at", "null").execute()

    if not group_res.data:
        raise HTTPException(404, "Kod jemputan tidak sah atau tamat tempoh")
    g = group_res.data[0]

    count_res = supabase.table("prayer_group_members").select("id", count="exact").eq("group_id", g["id"]).execute()
    if (count_res.count or 0) >= g.get("max_members", 10):
        raise HTTPException(400, "Kumpulan sudah penuh")

    existing = supabase.table("prayer_group_members").select("id").eq("group_id", g["id"]).eq("user_id", current_user["id"]).execute()
    if existing.data:
        raise HTTPException(400, "Anda sudah dalam kumpulan ini")

    supabase.table("prayer_group_members").insert({
        "group_id": g["id"],
        "user_id": current_user["id"],
        "role": "member",
    }).execute()

    return GroupResponse(
        id=g["id"], name=g["name"], type=g["type"],
        invite_code=g["invite_code"], created_by=g["created_by"],
        max_members=g.get("max_members", 10),
        member_count=(count_res.count or 0) + 1,
        created_at=str(g["created_at"]),
    )


@router.get("/{group_id}", response_model=GroupDetailResponse)
async def get_group(
    group_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    group_res = supabase.table("prayer_groups").select("*").eq("id", group_id).is_("deleted_at", "null").execute()
    if not group_res.data:
        raise HTTPException(404, "Kumpulan tidak dijumpai")
    g = group_res.data[0]

    # Verify caller is a member
    member_check = supabase.table("prayer_group_members").select("id").eq("group_id", group_id).eq("user_id", current_user["id"]).execute()
    if not member_check.data:
        raise HTTPException(403, "Anda bukan ahli kumpulan ini")

    members_res = supabase.table("prayer_group_members").select(
        "user_id, role, joined_at, profile:profiles(full_name)"
    ).eq("group_id", group_id).order("joined_at").execute()

    members = [
        GroupMemberResponse(
            user_id=m["user_id"],
            full_name=(m.get("profile") or {}).get("full_name"),
            role=m["role"],
            joined_at=str(m["joined_at"]),
        )
        for m in (members_res.data or [])
    ]

    # Recent check-ins from all members
    member_ids = [m["user_id"] for m in (members_res.data or [])]
    name_map = {m["user_id"]: (m.get("profile") or {}).get("full_name") for m in (members_res.data or [])}
    recent_activity: list[RecentVisitItem] = []

    if member_ids:
        visits_res = supabase.table("user_visits").select(
            "user_id, visit_type, created_at, masjid:masjids(name, slug)"
        ).in_("user_id", member_ids).is_("deleted_at", "null").order("created_at", desc=True).limit(15).execute()

        recent_activity = [
            RecentVisitItem(
                user_id=v["user_id"],
                full_name=name_map.get(v["user_id"]),
                visit_type=v.get("visit_type", "general"),
                created_at=str(v["created_at"]),
                masjid_name=(v.get("masjid") or {}).get("name"),
                masjid_slug=(v.get("masjid") or {}).get("slug"),
            )
            for v in (visits_res.data or [])
        ]

    return GroupDetailResponse(
        id=g["id"], name=g["name"], type=g["type"],
        invite_code=g["invite_code"], created_by=g["created_by"],
        max_members=g.get("max_members", 10), created_at=str(g["created_at"]),
        members=members, recent_activity=recent_activity,
    )


@router.delete("/{group_id}/leave", status_code=204)
async def leave_group(
    group_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    supabase.table("prayer_group_members").delete().eq("group_id", group_id).eq("user_id", current_user["id"]).execute()


@router.delete("/{group_id}", status_code=204)
async def delete_group(
    group_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    supabase.table("prayer_groups").update({"deleted_at": "now()"}).eq(
        "id", group_id
    ).eq("created_by", current_user["id"]).execute()

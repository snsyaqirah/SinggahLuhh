"""
Live crowdsourcing endpoints — saf status, parking, iftar menu, crowd level.
Updates auto-expire: 45 min for prayer updates, 24h for iftar menu.
"""
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.core.supabase import get_supabase, get_supabase_admin
from app.core.deps import get_current_user
from app.schemas.live_updates import (
    LiveUpdateCreate, LiveUpdateResponse,
    MasjidLiveStatus, LiveUpdateOptions,
)

router = APIRouter()

# How long each update type stays valid
EXPIRY_MINUTES: dict[str, int] = {
    'saf_status': 45,
    'parking_status': 45,
    'crowd_level': 45,
    'iftar_menu': 1440,   # 24 hours
}


@router.post("/", response_model=LiveUpdateResponse, status_code=201)
async def post_live_update(
    body: LiveUpdateCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """
    Post a live update for a masjid (saf, parking, iftar menu, crowd level).
    Expires automatically based on type. Awards +5 reputation.
    """
    user_id = current_user['id']
    masjid_id_str = str(body.masjid_id)

    # Verify masjid exists
    masjid_res = supabase.table('masjids').select('id').eq(
        'id', masjid_id_str
    ).is_('deleted_at', 'null').execute()
    if not masjid_res.data:
        raise HTTPException(status_code=404, detail="Masjid not found")

    minutes = EXPIRY_MINUTES.get(body.update_type, 45)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=minutes)

    result = supabase.table('live_updates').insert({
        'masjid_id': masjid_id_str,
        'user_id': user_id,
        'update_type': body.update_type,
        'value': body.value,
        'expires_at': expires_at.isoformat(),
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to post update")

    rec = result.data[0]

    # Award +5 reputation + AJK Iftar badge for first iftar update
    try:
        prof = supabase.table('profiles').select('reputation_points').eq(
            'id', user_id
        ).single().execute()
        pts = prof.data.get('reputation_points', 0) if prof.data else 0
        supabase.table('profiles').update({'reputation_points': pts + 5}).eq(
            'id', user_id
        ).execute()

        if body.update_type == 'iftar_menu':
            badge_res = supabase.table('badges').select('id').eq(
                'code', 'ajk_iftar'
            ).single().execute()
            if badge_res.data:
                supabase.table('user_badges').insert({
                    'user_id': user_id,
                    'badge_id': badge_res.data['id'],
                }).execute()
    except Exception:
        pass  # Non-critical

    created_at_raw = rec.get('created_at', datetime.now(timezone.utc).isoformat())
    return LiveUpdateResponse(
        id=rec['id'],
        masjid_id=rec['masjid_id'],
        user_id=rec['user_id'],
        update_type=rec['update_type'],
        value=rec['value'],
        expires_at=rec['expires_at'],
        created_at=created_at_raw,
        time_remaining_minutes=minutes,
    )


@router.get("/options", response_model=LiveUpdateOptions)
async def get_update_options():
    """Return all predefined option lists for frontend dropdowns."""
    return LiveUpdateOptions()


@router.get("/{masjid_id}", response_model=MasjidLiveStatus)
async def get_masjid_live_status(
    masjid_id: uuid.UUID,
    supabase: Client = Depends(get_supabase_admin),
):
    """
    Get all currently active live updates for a masjid.
    Returns the most-recent valid value per update type.
    """
    masjid_id_str = str(masjid_id)
    now_iso = datetime.now(timezone.utc).isoformat()

    # Masjid must exist
    masjid_res = supabase.table('masjids').select('name').eq(
        'id', masjid_id_str
    ).is_('deleted_at', 'null').execute()
    if not masjid_res.data:
        raise HTTPException(status_code=404, detail="Masjid not found")

    masjid_name = masjid_res.data[0]['name']

    # Fetch all active updates, newest first
    updates_res = supabase.table('live_updates').select('*').eq(
        'masjid_id', masjid_id_str
    ).gt('expires_at', now_iso).order('created_at', desc=True).execute()

    # Keep only the latest per update type
    status_map: dict[str, str] = {}
    last_updated: datetime | None = None

    for upd in (updates_res.data or []):
        utype = upd['update_type']
        if utype not in status_map:
            status_map[utype] = upd['value']
            created = datetime.fromisoformat(upd['created_at'].replace('Z', '+00:00'))
            if last_updated is None or created > last_updated:
                last_updated = created

    return MasjidLiveStatus(
        masjid_id=masjid_id,
        masjid_name=masjid_name,
        saf_status=status_map.get('saf_status'),
        parking_status=status_map.get('parking_status'),
        iftar_menu=status_map.get('iftar_menu'),
        crowd_level=status_map.get('crowd_level'),
        last_updated_at=last_updated,
    )

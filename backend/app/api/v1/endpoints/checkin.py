"""
Check-in endpoints with geofencing validation and streak/points tracking.
"""
import uuid
from datetime import datetime, date, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.core.supabase import get_supabase_admin
from app.core.deps import get_current_user
from app.schemas.checkin import (
    CheckInRequest, CheckInResponse,
    VisitResponse, VisitHistoryResponse,
)

router = APIRouter()

# Max distance from masjid to allow check-in (meters)
CHECKIN_MAX_DISTANCE = 200

# Reputation points per visit type (premium prayers earn more)
POINTS_MAP = {
    "subuh": 15,
    "isyak": 12,
    "jumaat": 15,
    "terawih": 15,
    "zohor": 10,
    "asar": 10,
    "maghrib": 10,
    "iftar": 10,
    "kuliah": 8,
    "general": 8,
}


# ── Helpers ────────────────────────────────────────────────────────

def _update_streak(supabase: Client, user_id: str) -> tuple[int, bool]:
    """
    Recalculate and persist streak based on today vs last check-in date.
    Returns (new_streak_count, streak_was_incremented).
    """
    profile_res = supabase.table('profiles').select(
        'streak_count, longest_streak, last_checkin_at'
    ).eq('id', user_id).single().execute()

    profile = profile_res.data or {}
    streak = profile.get('streak_count', 0)
    longest = profile.get('longest_streak', 0)
    last_checkin_raw = profile.get('last_checkin_at')
    today = date.today()

    update_data: dict = {'last_checkin_at': datetime.now(timezone.utc).isoformat()}
    streak_incremented = False

    if last_checkin_raw:
        last_dt = datetime.fromisoformat(last_checkin_raw.replace('Z', '+00:00'))
        last_date = last_dt.date()

        if last_date == today:
            pass  # Already checked in today - no streak change
        elif last_date == today - timedelta(days=1):
            streak += 1
            streak_incremented = True
            update_data['streak_count'] = streak
            if streak > longest:
                update_data['longest_streak'] = streak
        else:
            # Streak broken — reset to 1
            streak = 1
            streak_incremented = True
            update_data['streak_count'] = 1
    else:
        # First ever check-in
        streak = 1
        streak_incremented = True
        update_data['streak_count'] = 1
        update_data['longest_streak'] = max(1, longest)

    supabase.table('profiles').update(update_data).eq('id', user_id).execute()
    return streak, streak_incremented


def _try_award_badge(supabase: Client, user_id: str, badge_code: str, earned: list[str]) -> None:
    """Award a badge if not already earned. Silently ignores errors."""
    try:
        badge_res = supabase.table('badges').select('id').eq('code', badge_code).single().execute()
        if not badge_res.data:
            return
        badge_id = badge_res.data['id']
        # Check not already earned
        existing = supabase.table('user_badges').select('id').eq(
            'user_id', user_id
        ).eq('badge_id', badge_id).execute()
        if not existing.data:
            supabase.table('user_badges').insert({
                'user_id': user_id,
                'badge_id': badge_id,
            }).execute()
            earned.append(badge_code)
    except Exception:
        pass  # Unique constraint or badge not found — skip


def _check_badges(supabase: Client, user_id: str, streak: int, visit_type: str) -> list[str]:
    """Check all badge conditions and award newly earned ones."""
    earned: list[str] = []

    # Subuh Warrior — 7-day streak
    if streak >= 7:
        _try_award_badge(supabase, user_id, 'subuh_warrior', earned)

    # Masjid Hunter — 50 unique masjids
    unique_res = supabase.table('user_visits').select('masjid_id').eq(
        'user_id', user_id
    ).is_('deleted_at', 'null').execute()
    unique_count = len({v['masjid_id'] for v in (unique_res.data or [])})
    if unique_count >= 50:
        _try_award_badge(supabase, user_id, 'masjid_hunter', earned)

    # Ramadan Champion — 20 terawih check-ins
    if visit_type == 'terawih':
        ter_res = supabase.table('user_visits').select(
            'id', count='exact'
        ).eq('user_id', user_id).eq('visit_type', 'terawih').is_('deleted_at', 'null').execute()
        if (ter_res.count or 0) >= 20:
            _try_award_badge(supabase, user_id, 'ramadan_champion', earned)

    return earned


# ── Endpoints ─────────────────────────────────────────────────────

@router.post("/", response_model=CheckInResponse, status_code=201)
async def check_in(
    body: CheckInRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """
    Check in at a masjid. Must be within 200m.
    Awards reputation points and updates streak.
    Prevents duplicate check-ins (same masjid + prayer + day).
    """
    user_id = current_user['id']
    masjid_id = str(body.masjid_id)

    # 1. Geofencing — get exact distance via PostGIS
    dist_res = supabase.rpc('get_masjid_distance', {
        'user_lat': body.latitude,
        'user_lng': body.longitude,
        'target_masjid_id': masjid_id,
    }).execute()

    if dist_res.data is None:
        raise HTTPException(status_code=404, detail="Masjid not found")

    distance = float(dist_res.data)
    if distance < 0:
        raise HTTPException(status_code=404, detail="Masjid not found")

    if distance > CHECKIN_MAX_DISTANCE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Anda terlalu jauh dari masjid ({distance:.0f}m). Check-in perlu dalam {CHECKIN_MAX_DISTANCE}m."
        )

    # 2. Record visit (unique DB index prevents same masjid+type+day)
    try:
        visit_res = supabase.table('user_visits').insert({
            'user_id': user_id,
            'masjid_id': masjid_id,
            'visit_type': body.visit_type,
            'user_location': f'POINT({body.longitude} {body.latitude})',
            'distance_meters': round(distance, 2),
        }).execute()
    except Exception as e:
        err = str(e).lower()
        if 'unique' in err or 'duplicate' in err or '23505' in err:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Anda sudah check-in di sini untuk solat ini hari ini."
            )
        raise HTTPException(status_code=500, detail=f"Gagal rekod check-in: {str(e)}")

    visit_id = visit_res.data[0]['id']

    # 3. Update streak
    new_streak, _ = _update_streak(supabase, user_id)

    # 4. Award reputation points
    points = POINTS_MAP.get(body.visit_type, 10)
    try:
        prof = supabase.table('profiles').select('reputation_points').eq(
            'id', user_id
        ).single().execute()
        current_pts = prof.data.get('reputation_points', 0) if prof.data else 0
        supabase.table('profiles').update(
            {'reputation_points': current_pts + points}
        ).eq('id', user_id).execute()
    except Exception:
        pass  # Non-critical

    # 5. Check & award badges
    badges_unlocked = _check_badges(supabase, user_id, new_streak, body.visit_type)

    return CheckInResponse(
        message="Check-in berjaya! 🕌",
        visit_id=uuid.UUID(visit_id),
        streak_count=new_streak,
        points_earned=points,
        badges_unlocked=badges_unlocked,
        distance_meters=distance,
    )


@router.get("/history", response_model=VisitHistoryResponse)
async def get_visit_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Get current user's visit history with streak and unique masjid stats."""
    user_id = current_user['id']
    offset = (page - 1) * page_size

    # Paginated visits with masjid name joined
    visits_res = supabase.table('user_visits').select(
        '*, masjid:masjids(name)'
    ).eq('user_id', user_id).is_('deleted_at', 'null').order(
        'created_at', desc=True
    ).range(offset, offset + page_size - 1).execute()

    visits = []
    for v in (visits_res.data or []):
        masjid_info = v.get('masjid') or {}
        visits.append(VisitResponse(
            id=v['id'],
            user_id=v['user_id'],
            masjid_id=v['masjid_id'],
            visit_type=v['visit_type'],
            visit_date=v['visit_date'],
            distance_meters=v.get('distance_meters'),
            created_at=v['created_at'],
            masjid_name=masjid_info.get('name') if isinstance(masjid_info, dict) else None,
        ))

    # Profile streak data
    prof_res = supabase.table('profiles').select(
        'streak_count, longest_streak'
    ).eq('id', user_id).single().execute()
    prof = prof_res.data or {}

    # All visits for aggregate stats (just masjid_id column — lightweight)
    all_res = supabase.table('user_visits').select('masjid_id').eq(
        'user_id', user_id
    ).is_('deleted_at', 'null').execute()
    all_visits = all_res.data or []
    all_masjid_ids = [v['masjid_id'] for v in all_visits]

    # Find most-visited masjid
    favorite_name: str | None = None
    if all_masjid_ids:
        counts: dict[str, int] = {}
        for mid in all_masjid_ids:
            counts[mid] = counts.get(mid, 0) + 1
        fav_id = max(counts, key=counts.__getitem__)
        fav_res = supabase.table('masjids').select('name').eq('id', fav_id).single().execute()
        if fav_res.data:
            favorite_name = fav_res.data['name']

    return VisitHistoryResponse(
        visits=visits,
        total_visits=len(all_masjid_ids),
        current_streak=prof.get('streak_count', 0),
        longest_streak=prof.get('longest_streak', 0),
        unique_masjids=len(set(all_masjid_ids)),
        favorite_masjid=favorite_name,
    )

"""
Dashboard & gamification endpoints.
- /stats        — full user stats (visits, streaks, badges, breakdown)
- /badges       — my earned badges
- /leaderboard  — top users by reputation
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.core.supabase import get_supabase, get_supabase_admin
from app.core.deps import get_current_user, get_current_user_optional
from app.schemas.gamification import (
    UserStatsResponse, BadgeResponse, UserBadgeResponse,
    LeaderboardEntry, LeaderboardResponse,
)

router = APIRouter()


@router.get("/stats", response_model=UserStatsResponse)
async def get_my_stats(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """
    Full dashboard stats for the authenticated user:
    reputation, streak, visit breakdown, badge progress.
    """
    user_id = current_user['id']

    # Profile data (streak + reputation)
    prof_res = supabase.table('profiles').select(
        'reputation_points, streak_count, longest_streak'
    ).eq('id', user_id).execute()
    prof = (prof_res.data[0] if prof_res.data else {}) or {}

    # All visits (for totals + breakdown)
    visits_res = supabase.table('user_visits').select(
        'visit_type, masjid_id'
    ).eq('user_id', user_id).is_('deleted_at', 'null').execute()
    visits = visits_res.data or []

    total_visits = len(visits)
    unique_masjids = len({v['masjid_id'] for v in visits})

    breakdown: dict[str, int] = {}
    for v in visits:
        vtype = v['visit_type']
        breakdown[vtype] = breakdown.get(vtype, 0) + 1

    # Earned badges with badge details
    badges_res = supabase.table('user_badges').select(
        '*, badge:badges(*)'
    ).eq('user_id', user_id).execute()

    user_badges: list[UserBadgeResponse] = []
    for ub in (badges_res.data or []):
        badge_data = ub.get('badge') or {}
        if badge_data:
            try:
                user_badges.append(UserBadgeResponse(
                    id=ub['id'],
                    user_id=user_id,
                    badge=BadgeResponse(**badge_data),
                    earned_at=ub['earned_at'],
                    progress=1.0,
                ))
            except Exception:
                pass  # Skip malformed rows

    # Total available badges
    total_badges_res = supabase.table('badges').select('id', count='exact').execute()
    total_badges = total_badges_res.count or 0

    return UserStatsResponse(
        reputation_points=prof.get('reputation_points', 0),
        streak_count=prof.get('streak_count', 0),
        longest_streak=prof.get('longest_streak', 0),
        total_visits=total_visits,
        unique_masjids_visited=unique_masjids,
        badges_earned=len(user_badges),
        total_badges=total_badges,
        badges=user_badges,
        visit_breakdown=breakdown,
    )


@router.get("/badges", response_model=list[UserBadgeResponse])
async def get_my_badges(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """List all badges earned by the current user."""
    user_id = current_user['id']

    badges_res = supabase.table('user_badges').select(
        '*, badge:badges(*)'
    ).eq('user_id', user_id).order('earned_at', desc=True).execute()

    result: list[UserBadgeResponse] = []
    for ub in (badges_res.data or []):
        badge_data = ub.get('badge') or {}
        if badge_data:
            try:
                result.append(UserBadgeResponse(
                    id=ub['id'],
                    user_id=user_id,
                    badge=BadgeResponse(**badge_data),
                    earned_at=ub['earned_at'],
                    progress=1.0,
                ))
            except Exception:
                pass

    return result


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict | None = Depends(get_current_user_optional),
    supabase: Client = Depends(get_supabase_admin),
):
    """
    Top users ranked by reputation points.
    Authenticated users also see their own rank.
    Uses 3 batched queries instead of N queries.
    """
    # Top N profiles
    top_res = supabase.table('profiles').select(
        'id, full_name, reputation_points, streak_count'
    ).order('reputation_points', desc=True).limit(limit).execute()

    top_profiles = top_res.data or []
    top_ids = [p['id'] for p in top_profiles]

    if not top_ids:
        return LeaderboardResponse(entries=[], user_rank=None, total_users=0)

    # Batch fetch visits for all top users
    visits_res = supabase.table('user_visits').select('user_id').in_(
        'user_id', top_ids
    ).is_('deleted_at', 'null').execute()
    visit_counts: dict[str, int] = {}
    for v in (visits_res.data or []):
        uid = v['user_id']
        visit_counts[uid] = visit_counts.get(uid, 0) + 1

    # Batch fetch badges for all top users
    badges_res = supabase.table('user_badges').select('user_id').in_(
        'user_id', top_ids
    ).execute()
    badge_counts: dict[str, int] = {}
    for b in (badges_res.data or []):
        uid = b['user_id']
        badge_counts[uid] = badge_counts.get(uid, 0) + 1

    entries = [
        LeaderboardEntry(
            rank=i + 1,
            user_id=p['id'],
            full_name=p.get('full_name', 'Unknown'),
            reputation_points=p.get('reputation_points', 0),
            streak_count=p.get('streak_count', 0),
            total_visits=visit_counts.get(p['id'], 0),
            badges_earned=badge_counts.get(p['id'], 0),
        )
        for i, p in enumerate(top_profiles)
    ]

    # Find authenticated user's rank
    user_rank: int | None = None
    total_users = 0
    if current_user:
        rank_res = supabase.table('profiles').select(
            'id'
        ).order('reputation_points', desc=True).execute()
        all_ids = [r['id'] for r in (rank_res.data or [])]
        total_users = len(all_ids)
        if current_user['id'] in all_ids:
            user_rank = all_ids.index(current_user['id']) + 1
    else:
        total_res = supabase.table('profiles').select('id', count='exact').execute()
        total_users = total_res.count or 0

    return LeaderboardResponse(
        entries=entries,
        user_rank=user_rank,
        total_users=total_users,
    )

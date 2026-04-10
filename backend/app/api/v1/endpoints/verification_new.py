"""
Verification & reporting endpoints.
- Vote (upvote/downvote) on a masjid — triggers auto-verify at 3 upvotes
- Report incorrect masjid data
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client

from app.core.supabase import get_supabase, get_supabase_admin
from app.core.deps import get_current_user, get_current_user_optional
from app.schemas.verification import (
    VerificationVote, VerificationResponse, MasjidVerificationStatus,
    ReportCreate, ReportResponse,
)

router = APIRouter()


# ── Voting ────────────────────────────────────────────────────────

@router.post("/vote", response_model=VerificationResponse)
async def vote_on_masjid(
    body: VerificationVote,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """
    Upvote or downvote a masjid.
    - 3 upvotes triggers auto-verification (handled by DB trigger).
    - Users cannot vote on their own masjid.
    - Changing vote type (upvote ↔ downvote) is allowed.
    - Downvotes require a reason.
    """
    user_id = current_user['id']
    masjid_id_str = str(body.masjid_id)

    # Fetch masjid (must exist, not deleted)
    masjid_res = supabase.table('masjids').select(
        'id, status, created_by, verification_count'
    ).eq('id', masjid_id_str).is_('deleted_at', 'null').execute()

    if not masjid_res.data:
        raise HTTPException(status_code=404, detail="Masjid tidak dijumpai")

    masjid = masjid_res.data[0]

    # Cannot vote on own submission
    if masjid.get('created_by') == user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak boleh mengundi masjid yang anda tambah sendiri"
        )

    # Downvote requires reason
    if body.vote_type == 'downvote' and not body.reason:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Sila berikan sebab untuk downvote"
        )

    # Check existing vote
    existing_res = supabase.table('verifications').select(
        'id, vote_type'
    ).eq('masjid_id', masjid_id_str).eq('user_id', user_id).is_('deleted_at', 'null').execute()

    if existing_res.data:
        existing = existing_res.data[0]
        if existing['vote_type'] == body.vote_type:
            # Same vote type — toggle off (remove the vote)
            supabase.table('verifications').update({
                'deleted_at': 'now()'
            }).eq('id', existing['id']).execute()
        else:
            # Different vote type — switch the vote
            supabase.table('verifications').update({
                'vote_type': body.vote_type,
                'reason': body.reason,
                'deleted_at': None,
            }).eq('id', existing['id']).execute()
    else:
        # Create new vote
        supabase.table('verifications').insert({
            'masjid_id': masjid_id_str,
            'user_id': user_id,
            'vote_type': body.vote_type,
            'reason': body.reason,
        }).execute()

    # Award +5 reputation for voting
    try:
        prof = supabase.table('profiles').select('reputation_points').eq(
            'id', user_id
        ).single().execute()
        pts = prof.data.get('reputation_points', 0) if prof.data else 0
        supabase.table('profiles').update({'reputation_points': pts + 5}).eq(
            'id', user_id
        ).execute()
    except Exception:
        pass

    # Recount upvotes directly — don't rely on DB trigger (trigger may not fire on UPDATE)
    upvote_res = supabase.table('verifications').select(
        'id', count='exact'
    ).eq('masjid_id', masjid_id_str).eq('vote_type', 'upvote').is_('deleted_at', 'null').execute()
    new_count = upvote_res.count or 0

    # Determine new status: auto-verify at 3 upvotes, unflag if upvotes recover
    old_status = masjid['status']
    if new_count >= 3 and old_status == 'pending':
        new_status = 'verified'
    elif new_count == 0 and old_status == 'verified':
        new_status = 'pending'
    else:
        new_status = old_status

    # Write the authoritative count (and status) back to the masjid row
    supabase.table('masjids').update({
        'verification_count': new_count,
        'status': new_status,
    }).eq('id', masjid_id_str).execute()

    was_auto_verified = (new_status == 'verified' and old_status == 'pending')

    # Award creator +25 bonus when their masjid gets auto-verified
    if was_auto_verified and masjid.get('created_by'):
        try:
            creator_prof = supabase.table('profiles').select('reputation_points').eq(
                'id', masjid['created_by']
            ).single().execute()
            create_pts = creator_prof.data.get('reputation_points', 0) if creator_prof.data else 0
            supabase.table('profiles').update(
                {'reputation_points': create_pts + 25}
            ).eq('id', masjid['created_by']).execute()
        except Exception:
            pass

    return VerificationResponse(
        message="Undi berjaya direkodkan",
        masjid_id=body.masjid_id,
        new_verification_count=new_count,
        new_status=new_status,
        auto_verified=was_auto_verified,
    )


@router.get("/status/{masjid_id}", response_model=MasjidVerificationStatus)
async def get_verification_status(
    masjid_id: uuid.UUID,
    current_user: dict | None = Depends(get_current_user_optional),
    supabase: Client = Depends(get_supabase_admin),
):
    """Get current verification status of a masjid, including user's own vote if authenticated."""
    masjid_id_str = str(masjid_id)

    masjid_res = supabase.table('masjids').select(
        'status, verification_count'
    ).eq('id', masjid_id_str).is_('deleted_at', 'null').execute()

    if not masjid_res.data:
        raise HTTPException(status_code=404, detail="Masjid not found")

    masjid = masjid_res.data[0]
    needed = max(0, 3 - (masjid.get('verification_count') or 0))

    user_has_voted = False
    user_vote_type = None

    if current_user:
        vote_res = supabase.table('verifications').select('vote_type').eq(
            'masjid_id', masjid_id_str
        ).eq('user_id', current_user['id']).is_('deleted_at', 'null').execute()
        if vote_res.data:
            user_has_voted = True
            user_vote_type = vote_res.data[0]['vote_type']

    return MasjidVerificationStatus(
        masjid_id=masjid_id,
        status=masjid['status'],
        verification_count=masjid.get('verification_count', 0),
        needed_for_verification=needed,
        user_has_voted=user_has_voted,
        user_vote_type=user_vote_type,
    )


# ── Reporting ─────────────────────────────────────────────────────

@router.post("/report", response_model=ReportResponse, status_code=201)
async def report_masjid(
    body: ReportCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Report incorrect or problematic masjid data."""
    masjid_id_str = str(body.masjid_id)

    # Verify masjid exists
    masjid_res = supabase.table('masjids').select('id').eq(
        'id', masjid_id_str
    ).is_('deleted_at', 'null').execute()
    if not masjid_res.data:
        raise HTTPException(status_code=404, detail="Masjid tidak dijumpai")

    result = supabase.table('reports').insert({
        'masjid_id': masjid_id_str,
        'reporter_id': current_user['id'],
        'report_type': body.report_type,
        'description': body.description,
        'status': 'pending',
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit report")

    rec = result.data[0]
    return ReportResponse(
        id=rec['id'],
        masjid_id=rec['masjid_id'],
        reporter_id=rec['reporter_id'],
        report_type=rec['report_type'],
        description=rec['description'],
        status=rec['status'],
        created_at=rec['created_at'],
    )


@router.get("/reports/mine", response_model=list[ReportResponse])
async def get_my_reports(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Get all reports submitted by the current user."""
    result = supabase.table('reports').select('*').eq(
        'reporter_id', current_user['id']
    ).order('created_at', desc=True).execute()

    return [
        ReportResponse(
            id=r['id'],
            masjid_id=r['masjid_id'],
            reporter_id=r['reporter_id'],
            report_type=r['report_type'],
            description=r['description'],
            status=r['status'],
            created_at=r['created_at'],
        )
        for r in (result.data or [])
    ]


# ── Admin: Manage Reports ─────────────────────────────────────────

def _require_admin(user_id: str, supabase: Client):
    """Raise 403 if user is not an admin."""
    result = supabase.table('profiles').select('is_admin').eq('id', user_id).single().execute()
    if not result.data or not result.data.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin sahaja")


@router.get("/reports/all")
async def admin_list_reports(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """[Admin] List all reports, newest first, with masjid name."""
    _require_admin(current_user['id'], supabase)
    result = supabase.table('reports').select(
        'id, masjid_id, reporter_id, report_type, description, status, resolution_notes, resolved_at, created_at, masjids(id, name)'
    ).order('created_at', desc=True).execute()
    return result.data or []


class ReportResolve(BaseModel):
    status: str  # 'reviewing' | 'resolved' | 'dismissed'
    resolution_notes: str | None = None


@router.patch("/reports/{report_id}")
async def admin_update_report(
    report_id: str,
    body: ReportResolve,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """[Admin] Update a report status and add resolution notes."""
    _require_admin(current_user['id'], supabase)

    from datetime import datetime, timezone
    update_data: dict = {
        'status': body.status,
        'resolution_notes': body.resolution_notes,
        'resolved_by': current_user['id'],
        'resolved_at': datetime.now(timezone.utc).isoformat(),
    }

    result = supabase.table('reports').update(update_data).eq('id', report_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Report tidak dijumpai")
    return result.data[0]


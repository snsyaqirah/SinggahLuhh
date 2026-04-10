"""
Facilities CRUD endpoints — the lovable Malaysian features!
(kucing count, sejuk meter, talam gang, etc.)
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.core.supabase import get_supabase, get_supabase_admin
from app.core.deps import get_current_user
from app.schemas.facilities import FacilitiesCreate, FacilitiesUpdate, FacilitiesResponse

router = APIRouter()


@router.get("/{masjid_id}")
async def get_facilities(
    masjid_id: uuid.UUID,
    supabase: Client = Depends(get_supabase_admin),
):
    """Get facilities info for a masjid. Returns null if not yet added."""
    result = supabase.table('masjid_facilities').select('*').eq(
        'masjid_id', str(masjid_id)
    ).is_('deleted_at', 'null').execute()

    if not result.data:
        return None
    return result.data[0]


@router.post("/{masjid_id}", status_code=201)
async def create_facilities(
    masjid_id: uuid.UUID,
    body: FacilitiesCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """
    Add facilities data for a masjid.
    Awards +10 reputation for contributing.
    Each masjid can only have one facilities record.
    """
    masjid_id_str = str(masjid_id)

    # Verify masjid exists
    masjid_res = supabase.table('masjids').select('id').eq(
        'id', masjid_id_str
    ).is_('deleted_at', 'null').execute()
    if not masjid_res.data:
        raise HTTPException(status_code=404, detail="Masjid tidak dijumpai")

    # Enforce unique constraint (one facility record per masjid)
    existing = supabase.table('masjid_facilities').select('id').eq(
        'masjid_id', masjid_id_str
    ).is_('deleted_at', 'null').execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Facilities sudah wujud. Guna PATCH untuk kemaskini."
        )

    data = body.model_dump(exclude_none=True)
    data['masjid_id'] = masjid_id_str
    data['created_by'] = current_user['id']

    result = supabase.table('masjid_facilities').insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create facilities")

    # Award +10 reputation for contributing facilities
    try:
        prof = supabase.table('profiles').select('reputation_points').eq(
            'id', current_user['id']
        ).single().execute()
        pts = prof.data.get('reputation_points', 0) if prof.data else 0
        supabase.table('profiles').update(
            {'reputation_points': pts + 10}
        ).eq('id', current_user['id']).execute()
    except Exception:
        pass

    return result.data[0]


@router.patch("/{masjid_id}")
async def update_facilities(
    masjid_id: uuid.UUID,
    body: FacilitiesUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """
    Update facilities for a masjid. Any authenticated user can update —
    community-driven accuracy. Awards +5 reputation.
    """
    masjid_id_str = str(masjid_id)

    existing = supabase.table('masjid_facilities').select('id').eq(
        'masjid_id', masjid_id_str
    ).is_('deleted_at', 'null').execute()
    if not existing.data:
        raise HTTPException(
            status_code=404,
            detail="Tiada facilities untuk masjid ini. Guna POST untuk tambah."
        )

    update_data = body.model_dump(exclude_unset=True, exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=422, detail="Tiada field untuk dikemaskini")

    update_data['updated_by'] = current_user['id']

    result = supabase.table('masjid_facilities').update(update_data).eq(
        'masjid_id', masjid_id_str
    ).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update facilities")

    # Award +5 reputation for updating
    try:
        prof = supabase.table('profiles').select('reputation_points').eq(
            'id', current_user['id']
        ).single().execute()
        pts = prof.data.get('reputation_points', 0) if prof.data else 0
        supabase.table('profiles').update(
            {'reputation_points': pts + 5}
        ).eq('id', current_user['id']).execute()
    except Exception:
        pass

    return result.data[0]

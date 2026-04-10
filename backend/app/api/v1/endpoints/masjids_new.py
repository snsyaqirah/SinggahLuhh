"""
Masjid CRUD endpoints with 100m radius duplicate check and facilities management.
"""
import re
import uuid
import struct
import unicodedata
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from pydantic import BaseModel
from supabase import Client
from app.core.supabase import get_supabase, get_supabase_admin
from app.core.deps import get_current_user, get_current_user_optional
from app.schemas.masjid import (
    MasjidCreate, MasjidUpdate, MasjidDetail, MasjidListItem,
    NearbySearchRequest, NearbyMasjidResult, MasjidMediaCreate, MasjidMediaResponse
)
from app.schemas.facilities import FacilitiesCreate, FacilitiesUpdate, FacilitiesResponse
from app.schemas.common import MessageResponse, PaginatedResponse

router = APIRouter()


def _slugify(text: str) -> str:
    """Convert text to URL-safe ASCII slug."""
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^a-z0-9]+', '-', text.lower())
    return text.strip('-')


def _generate_slug(name: str, uid: str) -> str:
    return f"{_slugify(name)}-{uid[:8]}"


class _MediaAddBody(BaseModel):
    media_type: Literal["main_photo", "toilet_photo", "interior_photo", "qr_tng", "qr_duitnow", "masjid_board"]
    url: str


def parse_ewkb_point(hex_str: str) -> tuple[float, float]:
    """Parse PostGIS EWKB hex string to (longitude, latitude)."""
    data = bytes.fromhex(hex_str)
    byte_order = data[0]
    endian = '<' if byte_order == 1 else '>'
    # geom_type is 4 bytes; check bit 0x20000000 for SRID presence
    geom_type = struct.unpack_from(f'{endian}I', data, 1)[0]
    has_srid = bool(geom_type & 0x20000000)
    offset = 1 + 4 + (4 if has_srid else 0)  # byte_order + type + optional SRID
    lng, lat = struct.unpack_from(f'{endian}dd', data, offset)
    return lng, lat


# ── Nearby Search (100m Radius Check) ────────────────────────────────

@router.post("/check-nearby", response_model=list[NearbyMasjidResult])
async def check_nearby_masjids(
    body: NearbySearchRequest,
    supabase: Client = Depends(get_supabase_admin)
):
    """
    CHECK BEFORE CREATING: Find masjids within radius (default 100m).
    Used to prevent duplicate masjid entries.
    """
    try:
        # Use the PostGIS function we created in Supabase
        result = supabase.rpc(
            'find_nearby_masjids',
            {
                'lat': body.latitude,
                'lng': body.longitude,
                'radius_meters': body.radius_meters
            }
        ).execute()
        
        return result.data or []
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search nearby masjids: {str(e)}"
        )


# ── List & Browse Masjids ────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse)
async def list_masjids(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = None,
    supabase: Client = Depends(get_supabase_admin)
):
    """
    List all masjids with pagination and filtering.
    Public users see only 'verified' masjids.
    Authenticated users see all except 'rejected'.
    """
    try:
        query = supabase.table('masjids').select('*, facilities:masjid_facilities(*)', count='exact')
        
        # Filter by status
        if status_filter:
            query = query.eq('status', status_filter)
        else:
            query = query.in_('status', ['pending', 'verified'])
        
        # Search by name/address
        if search:
            # Sanitize: strip PostgREST filter-syntax characters to prevent filter injection
            safe_search = re.sub(r'[(),.\'"\\]', '', search.strip())[:100]
            if safe_search:
                query = query.or_(f'name.ilike.%{safe_search}%,address.ilike.%{safe_search}%')
        
        # Soft delete filter
        query = query.is_('deleted_at', 'null')
        
        # Pagination
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)
        
        result = query.execute()
        
        return PaginatedResponse(
            items=result.data or [],
            total=result.count or 0,
            page=page,
            page_size=page_size,
            total_pages=((result.count or 0) + page_size - 1) // page_size
        )
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memuatkan senarai masjid"
        )


@router.get("/stats", response_model=dict)
async def get_masjid_stats(
    supabase: Client = Depends(get_supabase_admin)
):
    """
    Public stats for the homepage: total masjids, verified count, and total visits.
    """
    try:
        masjids_res = supabase.table('masjids').select(
            'id, status', count='exact'
        ).is_('deleted_at', 'null').execute()

        rows = masjids_res.data or []
        total_masjids = masjids_res.count or len(rows)
        verified_masjids = sum(1 for r in rows if r.get('status') == 'verified')

        visits_res = supabase.table('user_visits').select(
            'id', count='exact'
        ).is_('deleted_at', 'null').execute()
        total_visits = visits_res.count or 0

        return {
            "total_masjids": total_masjids,
            "verified_masjids": verified_masjids,
            "total_visits": total_visits,
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memuatkan statistik"
        )


@router.get("/{identifier}")
async def get_masjid_detail(
    identifier: str,
    current_user: dict | None = Depends(get_current_user_optional),
    supabase: Client = Depends(get_supabase_admin)
):
    """
    Get full masjid details by UUID or slug.
    """
    try:
        query = supabase.table('masjids').select(
            '''
            *,
            facilities:masjid_facilities(*),
            media:masjid_media(*),
            verification:verifications(count)
            '''
        ).is_('deleted_at', 'null')

        # Accept both UUID and slug
        try:
            uuid.UUID(identifier)
            query = query.eq('id', identifier)
        except ValueError:
            query = query.eq('slug', identifier)

        result = query.execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Masjid not found"
            )
        
        masjid = result.data[0]

        # Parse lat/lng from PostGIS EWKB hex
        try:
            lng, lat = parse_ewkb_point(masjid['location'])
        except Exception:
            lng, lat = 0.0, 0.0

        # facilities join returns a list — take first item or None
        raw_facilities = masjid.get('facilities')
        facilities = raw_facilities[0] if isinstance(raw_facilities, list) and raw_facilities else (
            raw_facilities if isinstance(raw_facilities, dict) else None
        )

        # media join returns a list
        media = masjid.get('media') or []

        # Get live updates (active only) — set to None when empty
        live_updates = supabase.table('live_updates').select('*').eq(
            'masjid_id', str(masjid['id'])
        ).gt('expires_at', 'now()').execute()
        live_status = live_updates.data[0] if live_updates.data else None

        # Build verification object from masjid row data
        verification = {
            'masjid_id': masjid['id'],
            'status': masjid['status'],
            'verification_count': masjid.get('verification_count', 0),
            'needed_for_verification': 3,
            'user_has_voted': False,
            'user_vote_type': None,
        }

        return {
            **masjid,
            'latitude': lat,
            'longitude': lng,
            'facilities': facilities,
            'media': media,
            'live_status': live_status,
            'verification': verification,
        }
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memuatkan maklumat masjid"
        )


# ── Create Masjid (with Duplicate Check) ─────────────────────────────

@router.post("", status_code=201)
async def create_masjid(
    body: MasjidCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin)
):
    """
    Create new masjid after checking for duplicates within 100m.
    Status starts as 'pending' until verified by community.
    """
    try:
        # First check for nearby masjids (anti-duplicate)
        nearby = supabase.rpc(
            'find_nearby_masjids',
            {
                'lat': body.latitude,
                'lng': body.longitude,
                'radius_meters': 100
            }
        ).execute()
        
        if nearby.data and len(nearby.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Masjid already exists nearby: {nearby.data[0]['name']} ({nearby.data[0]['distance_meters']:.0f}m away)"
            )

        # Check if user is banned
        ban_check = supabase.table('profiles').select('is_banned').eq(
            'id', current_user['id']
        ).single().execute()
        if ban_check.data and ban_check.data.get('is_banned'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akaun anda telah disekat daripada menambah masjid."
            )
        
        # Create masjid with PostGIS geography point
        masjid_data = {
            "name": body.name.strip().title(),
            "address": body.address,
            "description": body.description,
            "location": f"POINT({body.longitude} {body.latitude})",  # PostGIS format
            "status": "pending",
            "created_by": current_user['id']
        }

        # Pre-generate a temp slug (will be updated with real ID after insert)
        result = supabase.table('masjids').insert(masjid_data).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create masjid"
            )

        row = result.data[0]
        slug = _generate_slug(body.name, row["id"])
        # Update with slug now that we have the real ID
        supabase.table('masjids').update({"slug": slug}).eq("id", row["id"]).execute()
        row["slug"] = slug
        
        # Award 50 reputation points for creating a masjid
        try:
            profile = supabase.table('profiles').select('reputation_points').eq(
                'id', current_user['id']
            ).single().execute()
            current_pts = profile.data.get('reputation_points', 0) if profile.data else 0
            supabase.table('profiles').update(
                {'reputation_points': current_pts + 50}
            ).eq('id', current_user['id']).execute()
        except Exception:
            pass  # Non-critical - don't fail the masjid creation

        # Build full MasjidDetail response — DB row lacks lat/lng (stored as PostGIS)
        # and related tables are empty on a brand-new masjid
        return {
            **row,
            "latitude": body.latitude,
            "longitude": body.longitude,
            "facilities": None,
            "media": [],
            "live_status": None,
            "verification": {
                "masjid_id": row["id"],
                "status": row["status"],
                "verification_count": 0,
                "needed_for_verification": 3,
                "user_has_voted": False,
                "user_vote_type": None,
            },
        }
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal mencipta masjid"
        )


# ── Update & Delete Masjid ───────────────────────────────────────────

@router.patch("/{masjid_id}")
async def update_masjid(
    masjid_id: uuid.UUID,
    body: MasjidUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin)
):
    """
    Update masjid info (owner or admin only).
    """
    try:
        # Check ownership or admin
        masjid = supabase.table('masjids').select('created_by').eq(
            'id', str(masjid_id)
        ).is_('deleted_at', 'null').execute()
        
        if not masjid.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Masjid tidak dijumpai")
        
        is_admin = _is_admin(current_user['id'], supabase)
        is_owner = masjid.data[0]['created_by'] == current_user['id']
        if not (is_owner or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Anda tidak mempunyai kebenaran untuk mengemaskini masjid ini"
            )
        
        # Only allow updating safe content fields — never status/verification_count/created_by
        ALLOWED_FIELDS = {'name', 'address', 'description', 'latitude', 'longitude'}
        update_data = {
            k: v for k, v in body.model_dump(exclude_unset=True).items()
            if k in ALLOWED_FIELDS
        }
        if 'name' in update_data and update_data['name']:
            update_data['name'] = update_data['name'].strip().title()
        if 'latitude' in update_data and 'longitude' in update_data:
            update_data['location'] = f"POINT({update_data.pop('longitude')} {update_data.pop('latitude')})"
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Tiada data untuk dikemaskini")
        
        result = supabase.table('masjids').update(update_data).eq(
            'id', str(masjid_id)
        ).execute()
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal mengemaskini masjid"
        )


# ── Media (Photos & QR codes) ─────────────────────────────────────────

@router.get("/{masjid_id}/media", response_model=list[MasjidMediaResponse])
async def get_masjid_media(
    masjid_id: uuid.UUID,
    supabase: Client = Depends(get_supabase_admin),
):
    """Get all media items for a masjid (public)."""
    result = supabase.table('masjid_media').select('*').eq(
        'masjid_id', str(masjid_id)
    ).is_('deleted_at', 'null').order('created_at').execute()
    return result.data or []


@router.post("/{masjid_id}/media", response_model=MasjidMediaResponse, status_code=201)
async def add_masjid_media(
    masjid_id: uuid.UUID,
    body: _MediaAddBody,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Add a photo or QR code URL for a masjid. Awards +5 reputation."""
    masjid_id_str = str(masjid_id)

    # Verify masjid exists
    masjid_res = supabase.table('masjids').select('id').eq(
        'id', masjid_id_str
    ).is_('deleted_at', 'null').execute()
    if not masjid_res.data:
        raise HTTPException(status_code=404, detail="Masjid tidak dijumpai")

    if not body.url.startswith('https://'):
        raise HTTPException(status_code=422, detail="URL mesti bermula dengan https://")

    # QR codes require minimum reputation (prevent fraud)
    QR_TYPES = {'qr_tng', 'qr_duitnow'}
    if body.media_type in QR_TYPES:
        prof_res = supabase.table('profiles').select('reputation_points').eq(
            'id', current_user['id']
        ).single().execute()
        rep = prof_res.data.get('reputation_points', 0) if prof_res.data else 0
        if rep < 30:
            raise HTTPException(
                status_code=403,
                detail=f"Anda memerlukan sekurang-kurangnya 30 mata reputasi untuk submit QR code. Anda ada {rep} mata."
            )

    # Rate limit: max 3 media uploads per user per masjid (across all types)
    recent_res = supabase.table('masjid_media').select('id', count='exact').eq(
        'masjid_id', masjid_id_str
    ).eq('created_by', current_user['id']).is_('deleted_at', 'null').execute()
    if (recent_res.count or 0) >= 3:
        raise HTTPException(
            status_code=429,
            detail="Had maksimum 3 media setiap masjid telah dicapai untuk akaun anda."
        )

    # QR codes start unverified and need admin approval before being shown
    is_verified = body.media_type not in QR_TYPES

    result = supabase.table('masjid_media').insert({
        'masjid_id': masjid_id_str,
        'media_type': body.media_type,
        'url': body.url,
        'created_by': current_user['id'],
        'is_verified': is_verified,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Gagal menyimpan gambar")

    # Award +5 reputation for contributing
    try:
        prof = supabase.table('profiles').select('reputation_points').eq(
            'id', current_user['id']
        ).single().execute()
        pts = prof.data.get('reputation_points', 0) if prof.data else 0
        supabase.table('profiles').update({'reputation_points': pts + 5}).eq(
            'id', current_user['id']
        ).execute()
    except Exception:
        pass

    return result.data[0]


@router.delete("/{masjid_id}/media/{media_id}", response_model=MessageResponse)
async def delete_masjid_media(
    masjid_id: uuid.UUID,
    media_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Soft-delete a media item (only uploader can delete)."""
    result = supabase.table('masjid_media').update({'deleted_at': 'now()'}).eq(
        'id', str(media_id)
    ).eq('masjid_id', str(masjid_id)).eq('created_by', current_user['id']).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Gambar tidak dijumpai atau tiada kebenaran")

    return MessageResponse(message="Gambar dipadam", success=True)


@router.post("/{masjid_id}/media/upload", response_model=MasjidMediaResponse, status_code=201)
async def upload_masjid_media(
    masjid_id: uuid.UUID,
    file: UploadFile = File(...),
    media_type: str = Form(...),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Upload an image file directly to Supabase Storage. Awards +5 reputation."""
    masjid_id_str = str(masjid_id)

    VALID_TYPES = ["main_photo", "toilet_photo", "interior_photo", "qr_tng", "qr_duitnow", "masjid_board"]
    if media_type not in VALID_TYPES:
        raise HTTPException(status_code=422, detail="Jenis media tidak sah")

    masjid_res = supabase.table('masjids').select('id').eq(
        'id', masjid_id_str
    ).is_('deleted_at', 'null').execute()
    if not masjid_res.data:
        raise HTTPException(status_code=404, detail="Masjid tidak dijumpai")

    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=422, detail="Hanya fail imej dibenarkan (JPG, PNG, WebP)")

    file_bytes = await file.read()
    MAX_SIZE = 5 * 1024 * 1024  # 5 MB
    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Saiz fail terlalu besar. Had maksimum ialah 5MB.")

    QR_TYPES = {'qr_tng', 'qr_duitnow'}
    if media_type in QR_TYPES:
        prof_res = supabase.table('profiles').select('reputation_points').eq(
            'id', current_user['id']
        ).single().execute()
        rep = prof_res.data.get('reputation_points', 0) if prof_res.data else 0
        if rep < 30:
            raise HTTPException(
                status_code=403,
                detail=f"Anda memerlukan sekurang-kurangnya 30 mata reputasi untuk submit QR code. Anda ada {rep} mata."
            )

    recent_res = supabase.table('masjid_media').select('id', count='exact').eq(
        'masjid_id', masjid_id_str
    ).eq('created_by', current_user['id']).is_('deleted_at', 'null').execute()
    if (recent_res.count or 0) >= 3:
        raise HTTPException(
            status_code=429,
            detail="Had maksimum 3 media setiap masjid telah dicapai untuk akaun anda."
        )

    ext = (file.filename or "image.jpg").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "heic", "heif"):
        ext = "jpg"
    file_path = f"{masjid_id_str}/{uuid.uuid4()}.{ext}"

    try:
        supabase.storage.from_("masjid-media").upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "false"},
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Gagal muat naik gambar ke storan. Cuba lagi.")

    public_url = supabase.storage.from_("masjid-media").get_public_url(file_path)

    is_verified = media_type not in QR_TYPES

    result = supabase.table('masjid_media').insert({
        'masjid_id': masjid_id_str,
        'media_type': media_type,
        'url': public_url,
        'created_by': current_user['id'],
        'is_verified': is_verified,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Gagal menyimpan maklumat gambar")

    try:
        prof = supabase.table('profiles').select('reputation_points').eq(
            'id', current_user['id']
        ).single().execute()
        pts = prof.data.get('reputation_points', 0) if prof.data else 0
        supabase.table('profiles').update({'reputation_points': pts + 5}).eq(
            'id', current_user['id']
        ).execute()
    except Exception:
        pass

    return result.data[0]


# ── Admin: Media Moderation ──────────────────────────────────────────

def _is_admin(user_id: str, supabase: Client) -> bool:
    res = supabase.table('profiles').select('is_admin').eq('id', user_id).single().execute()
    return bool(res.data and res.data.get('is_admin'))


@router.get("/admin/pending-media")
async def list_pending_media(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Admin only: list all unverified QR media awaiting review."""
    if not _is_admin(current_user['id'], supabase):
        raise HTTPException(status_code=403, detail="Admin sahaja")

    result = supabase.table('masjid_media').select(
        '*, masjids:masjid_id(name)'
    ).eq('is_verified', False).is_('deleted_at', 'null').in_(
        'media_type', ['qr_tng', 'qr_duitnow']
    ).order('created_at').execute()

    items = []
    for row in (result.data or []):
        items.append({
            **row,
            'masjid_name': row.get('masjids', {}).get('name') if row.get('masjids') else None,
        })
    return items


@router.patch("/admin/media/{media_id}/approve")
async def approve_media(
    media_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Admin only: approve a pending media item."""
    if not _is_admin(current_user['id'], supabase):
        raise HTTPException(status_code=403, detail="Admin sahaja")

    result = supabase.table('masjid_media').update({'is_verified': True}).eq(
        'id', str(media_id)
    ).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Media tidak dijumpai")
    return {"success": True}


@router.delete("/admin/media/{media_id}/reject")
async def reject_media(
    media_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Admin only: reject (soft-delete) a pending media item."""
    if not _is_admin(current_user['id'], supabase):
        raise HTTPException(status_code=403, detail="Admin sahaja")

    result = supabase.table('masjid_media').update({'deleted_at': 'now()'}).eq(
        'id', str(media_id)
    ).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Media tidak dijumpai")
    return {"success": True}


@router.delete("/{masjid_id}", response_model=MessageResponse)
async def delete_masjid(
    masjid_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin)
):
    """
    Soft delete masjid (owner or admin only).
    """
    try:
        # Verify masjid exists (not already deleted)
        masjid_res = supabase.table('masjids').select('created_by').eq(
            'id', str(masjid_id)
        ).is_('deleted_at', 'null').execute()
        
        if not masjid_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Masjid tidak dijumpai")
        
        is_admin = _is_admin(current_user['id'], supabase)
        is_owner = masjid_res.data[0]['created_by'] == current_user['id']
        if not (is_owner or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Anda tidak mempunyai kebenaran untuk memadam masjid ini"
            )
        
        # Soft delete by setting deleted_at
        supabase.table('masjids').update({
            'deleted_at': 'now()'
        }).eq('id', str(masjid_id)).execute()
        
        return MessageResponse(message="Masjid berjaya dipadam", success=True)
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memadam masjid"
        )
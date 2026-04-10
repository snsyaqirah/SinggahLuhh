"""
Profile endpoints — view and update the authenticated user's profile.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from pydantic import BaseModel

from app.core.supabase import get_supabase_admin
from app.core.deps import get_current_user

router = APIRouter()


class ProfileResponse(BaseModel):
    id: str
    full_name: str
    phone_number: str | None = None
    gender: str | None = None
    reputation_points: int = 0
    streak_count: int = 0
    longest_streak: int = 0
    last_checkin_at: str | None = None
    created_at: str | None = None
    is_admin: bool = False

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None
    gender: str | None = None  # 'Lelaki' or 'Perempuan'


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Get the authenticated user's profile."""
    result = supabase.table('profiles').select('*').eq(
        'id', current_user['id']
    ).single().execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return result.data


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    body: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_admin),
):
    """Update the authenticated user's profile (full_name, phone_number)."""
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    result = supabase.table('profiles').update(update_data).eq(
        'id', current_user['id']
    ).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    # If full_name changed, sync to Supabase Auth user_metadata
    if 'full_name' in update_data:
        try:
            supabase.auth.admin.update_user_by_id(
                current_user['id'],
                {"user_metadata": {"full_name": update_data['full_name']}}
            )
        except Exception:
            pass  # Non-critical

    return result.data[0]

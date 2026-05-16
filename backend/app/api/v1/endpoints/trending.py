"""
Trending Masjid — top activity this week.
Queries the pre-computed trending_masjids table (filled by compute_trending_masjids()).
If this week's data is missing, triggers the function on-demand via Supabase RPC.

pg_cron setup (run once in Supabase SQL editor):
  SELECT cron.schedule('0 0 * * 1', $$SELECT compute_trending_masjids()$$);
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from supabase import Client
from app.core.supabase import get_supabase_admin
from app.schemas.base import CamelModel

router = APIRouter()


def _week_monday() -> str:
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())
    return monday.strftime("%Y-%m-%d")


class TrendingMasjidResponse(CamelModel):
    masjid_id: str
    score: int
    week_of: str
    masjid_name: str | None = None
    masjid_address: str | None = None
    masjid_type: str | None = None
    masjid_slug: str | None = None
    masjid_state: str | None = None


@router.get("", response_model=list[TrendingMasjidResponse])
async def get_trending(
    limit: int = Query(10, ge=1, le=20),
    supabase: Client = Depends(get_supabase_admin),
):
    week = _week_monday()

    # Check if this week's data exists
    check = (
        supabase.table("trending_masjids")
        .select("id", count="exact")
        .eq("week_of", week)
        .execute()
    )

    # Auto-compute if stale / empty
    if not check.count:
        try:
            supabase.rpc("compute_trending_masjids").execute()
        except Exception:
            pass  # Table may still be empty if no activity this week

    res = (
        supabase.table("trending_masjids")
        .select("score, week_of, masjid:masjids(id, name, address, type, slug, state)")
        .eq("week_of", week)
        .order("score", desc=True)
        .limit(limit)
        .execute()
    )

    result = []
    for row in (res.data or []):
        m = row.get("masjid") or {}
        result.append(TrendingMasjidResponse(
            masjid_id=m.get("id", ""),
            score=row["score"],
            week_of=str(row["week_of"]),
            masjid_name=m.get("name"),
            masjid_address=m.get("address"),
            masjid_type=m.get("type"),
            masjid_slug=m.get("slug"),
            masjid_state=m.get("state"),
        ))
    return result

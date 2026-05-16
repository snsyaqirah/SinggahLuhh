from fastapi import APIRouter

from app.api.v1.endpoints import auth, masjids_new, profile
from app.api.v1.endpoints import checkin, live_updates_new, verification_new, dashboard, facilities_new, feedback
from app.api.v1.endpoints import bookmarks, diary, khatam, special_prayers, events, announcements, lost_found, iftar, trending, prayer_groups

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router,                prefix="/auth",              tags=["auth"])
router.include_router(masjids_new.router,         prefix="/masjids",           tags=["masjids"])
router.include_router(profile.router,             prefix="/profile",           tags=["profile"])
router.include_router(checkin.router,             prefix="/checkins",          tags=["check-in"])
router.include_router(live_updates_new.router,    prefix="/live-updates",      tags=["live-updates"])
router.include_router(verification_new.router,    prefix="/verifications",     tags=["verifications"])
router.include_router(dashboard.router,           prefix="/dashboard",         tags=["dashboard"])
router.include_router(facilities_new.router,      prefix="/facilities",        tags=["facilities"])
router.include_router(feedback.router,            prefix="/feedback",          tags=["feedback"])
router.include_router(bookmarks.router,           prefix="/bookmarks",         tags=["bookmarks"])
router.include_router(diary.router,               prefix="/diary",             tags=["diary"])
router.include_router(khatam.router,              prefix="/khatam",            tags=["khatam"])
router.include_router(special_prayers.router,     prefix="/special-prayers",   tags=["special-prayers"])
router.include_router(events.router,              prefix="/events",            tags=["events"])
router.include_router(announcements.router,       prefix="/announcements",     tags=["announcements"])
router.include_router(lost_found.router,          prefix="/lost-found",        tags=["lost-found"])
router.include_router(iftar.router,               prefix="/iftar",             tags=["iftar"])
router.include_router(trending.router,            prefix="/trending",          tags=["trending"])
router.include_router(prayer_groups.router,       prefix="/groups",            tags=["groups"])

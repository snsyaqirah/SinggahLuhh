-- ============================================================
-- JejakMasjid - Additional SQL Functions (Migration v2)
-- Run this in Supabase SQL Editor AFTER the main schema
-- ============================================================

-- ── get_masjid_distance ──────────────────────────────────────────
-- Returns exact distance (meters) between a user's location and a masjid.
-- Used by the check-in endpoint to enforce the 200m geofence.
-- Returns -1 if the masjid_id does not exist or is soft-deleted.

CREATE OR REPLACE FUNCTION get_masjid_distance(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    target_masjid_id UUID
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    dist DOUBLE PRECISION;
BEGIN
    SELECT ST_Distance(
        m.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    )
    INTO dist
    FROM masjids m
    WHERE m.id = target_masjid_id
      AND m.deleted_at IS NULL;

    RETURN COALESCE(dist, -1);
END;
$$ LANGUAGE plpgsql;


-- ── get_masjid_coordinates ───────────────────────────────────────
-- Convenience helper: extract lat/lng from a masjid's geography column.
-- Useful for frontend map display without exposing raw PostGIS types.

CREATE OR REPLACE FUNCTION get_masjid_coordinates(target_masjid_id UUID)
RETURNS TABLE (latitude DOUBLE PRECISION, longitude DOUBLE PRECISION) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude
    FROM masjids
    WHERE id = target_masjid_id
      AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;


-- ── badges table: allow all authenticated users to read ──────────
-- (badges are global reference data, not user-specific)

CREATE POLICY "Anyone can view badges"
    ON badges FOR SELECT
    USING (true);

-- ============================================================
-- Done! Two new functions added:
-- ✅ get_masjid_distance(user_lat, user_lng, masjid_id)
-- ✅ get_masjid_coordinates(masjid_id)
-- ✅ badges read policy for all users
-- ============================================================

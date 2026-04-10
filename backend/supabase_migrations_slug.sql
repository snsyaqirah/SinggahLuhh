-- ── Slug Migration ──────────────────────────────────────────────────
-- Run this in Supabase SQL Editor

-- 1. Add slug column
ALTER TABLE masjids ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Backfill slugs for existing records
--    Format: lowercase-name-with-hyphens-{first8charsOfUUID}
UPDATE masjids
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'),
        '-+', '-', 'g'
    )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- 3. Add unique constraint
ALTER TABLE masjids ADD CONSTRAINT masjids_slug_unique UNIQUE (slug);

-- 4. Index for fast slug lookup
CREATE INDEX IF NOT EXISTS masjids_slug_idx ON masjids(slug);

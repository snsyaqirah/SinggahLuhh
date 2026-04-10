-- ============================================
-- JejakMasjid - Complete Supabase Schema
-- Copy & Paste this entire file into Supabase SQL Editor
-- ============================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_by column (gets current user from Supabase auth context)
CREATE OR REPLACE FUNCTION update_modified_by_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.uid();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE 1: PROFILES (Extends Supabase Auth)
-- ============================================
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    
    -- Gamification Fields
    reputation_points INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_checkin_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create trigger for profiles
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger when new user signs up via Supabase Auth
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_new_user();

-- ============================================
-- TABLE 2: MASJIDS (Core Masjid Data)
-- ============================================
CREATE TABLE masjids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    
    -- PostGIS Geography for precise radius search (100m check)
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    -- Status Management
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'flagged', 'rejected')),
    verification_count INTEGER DEFAULT 0,
    
    -- Additional Metadata
    description TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Spatial Index for fast radius queries (CRITICAL for 100m check)
CREATE INDEX idx_masjids_location ON masjids USING GIST(location);

-- Index for status filtering
CREATE INDEX idx_masjids_status ON masjids(status) WHERE deleted_at IS NULL;

-- Trigger for auto-update
CREATE TRIGGER update_masjids_modtime
    BEFORE UPDATE ON masjids
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_by_column();

-- ============================================
-- TABLE 3: MASJID_FACILITIES (The Fun Details!)
-- ============================================
CREATE TABLE masjid_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID REFERENCES masjids(id) ON DELETE CASCADE UNIQUE, -- One facility per masjid
    
    -- Prayer Info
    terawih_rakaat INTEGER CHECK (terawih_rakaat IN (8, 11, 20, 23)),
    
    -- Iftar Info
    has_iftar BOOLEAN DEFAULT FALSE,
    iftar_type TEXT CHECK (iftar_type IN ('Nasi Kotak', 'Talam', 'Buffet', 'Bawa Sendiri', 'Tidak Pasti')),
    iftar_menu TEXT, -- "Nasi Ayam, Air Sirap" - for daily updates
    
    -- The "Sejuk" Meter (Malaysian must-have!)
    cooling_system TEXT DEFAULT 'Kipas Biasa' CHECK (
        cooling_system IN (
            'Full AC / Sejuk Gila',
            'AC Sebahagian',
            'Kipas Gergasi (HVLS)',
            'Kipas Biasa',
            'Panas'
        )
    ),
    
    -- The "Lovable" Malaysian Features
    has_coway BOOLEAN DEFAULT FALSE,
    kucing_count TEXT DEFAULT 'Tidak Pasti' CHECK (
        kucing_count IN (
            'Banyak / Kucing Friendly',
            'Ada Seekor Oren',
            'Ada Sikit',
            'Takda'
        )
    ),
    karpet_vibe TEXT CHECK (
        karpet_vibe IN (
            'Tebal / Selesa',
            'Standard',
            'Nipis',
            'Sajadah Sendiri'
        )
    ),
    talam_gang BOOLEAN DEFAULT FALSE, -- Eating in talam tradition
    
    -- Parking Situation
    parking_level TEXT CHECK (parking_level IN ('Senang', 'Sederhana', 'Susah / Double Park')),
    has_parking_oku BOOLEAN DEFAULT FALSE,
    has_parking_moto BOOLEAN DEFAULT TRUE,
    
    -- Family & Accessibility
    has_kids_area BOOLEAN DEFAULT FALSE,
    is_family_friendly BOOLEAN DEFAULT TRUE,
    
    -- Women's Facilities
    has_clean_telekung BOOLEAN DEFAULT FALSE,
    telekung_rating TEXT CHECK (telekung_rating IN ('Banyak & Bersih', 'Ada Tapi Sikit', 'Bawa Sendiri')),
    
    -- Wudhu & Toilet
    wudhu_seating BOOLEAN DEFAULT FALSE, -- For elderly
    toilet_cleanliness TEXT CHECK (toilet_cleanliness IN ('Bersih', 'Sederhana', 'Kurang Bersih')),
    toilet_floor_condition TEXT CHECK (toilet_floor_condition IN ('Kering', 'Licin', 'Basah')),
    
    -- Special Features
    is_tourist_friendly BOOLEAN DEFAULT FALSE, -- Beautiful architecture/historical
    has_tahfiz BOOLEAN DEFAULT FALSE,
    has_library BOOLEAN DEFAULT FALSE,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER update_facilities_modtime
    BEFORE UPDATE ON masjid_facilities
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_by_column();

-- ============================================
-- TABLE 4: MASJID_MEDIA (Photos & QR Codes)
-- ============================================
CREATE TABLE masjid_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID REFERENCES masjids(id) ON DELETE CASCADE,
    
    media_type TEXT NOT NULL CHECK (
        media_type IN (
            'main_photo',
            'toilet_photo',
            'interior_photo',
            'qr_tng',
            'qr_duitnow',
            'masjid_board'
        )
    ),
    url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE, -- Verified by 3+ users
    verification_count INTEGER DEFAULT 0,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_media_masjid ON masjid_media(masjid_id, media_type) WHERE deleted_at IS NULL;

CREATE TRIGGER update_media_modtime
    BEFORE UPDATE ON masjid_media
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_by_column();

-- ============================================
-- TABLE 5: USER_VISITS (Check-ins & Streak Tracker)
-- ============================================
CREATE TABLE user_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    masjid_id UUID REFERENCES masjids(id) ON DELETE CASCADE,
    
    visit_type TEXT NOT NULL CHECK (
        visit_type IN (
            'subuh',
            'zohor',
            'asar',
            'maghrib',
            'isyak',
            'jumaat',
            'terawih',
            'iftar',
            'kuliah',
            'general'
        )
    ),
    visit_date DATE DEFAULT CURRENT_DATE,
    
    -- Geofencing validation (optional: store user's location at check-in)
    user_location GEOGRAPHY(POINT, 4326),
    distance_meters NUMERIC, -- Distance from masjid at check-in time
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Prevent duplicate check-ins (same user, same masjid, same type, same day)
CREATE UNIQUE INDEX idx_unique_visit 
    ON user_visits(user_id, masjid_id, visit_type, visit_date) 
    WHERE deleted_at IS NULL;

-- Index for streak calculation queries
CREATE INDEX idx_visits_user_date ON user_visits(user_id, visit_date DESC) WHERE deleted_at IS NULL;

-- ============================================
-- TABLE 6: VERIFICATIONS (Peer Review)
-- ============================================
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID REFERENCES masjids(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    
    -- Optional: reason for downvote
    reason TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Prevent duplicate votes from same user
CREATE UNIQUE INDEX idx_unique_verification 
    ON verifications(masjid_id, user_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_verifications_masjid ON verifications(masjid_id) WHERE deleted_at IS NULL;

-- ============================================
-- TABLE 7: LIVE_UPDATES (Real-time Crowdsourcing)
-- ============================================
CREATE TABLE live_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID REFERENCES masjids(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    update_type TEXT NOT NULL CHECK (
        update_type IN (
            'saf_status',      -- Saf penuh ke tak
            'parking_status',  -- Parking available ke tak
            'iftar_menu',      -- Menu iftar hari ni
            'crowd_level'      -- Overall crowd
        )
    ),
    
    value TEXT NOT NULL, -- "Selesa", "Padat", "Melimpah", etc.
    
    -- Auto-expire after 45 minutes (for prayers) or 24 hours (for iftar menu)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying active updates (filter by expires_at in queries, not in index)
CREATE INDEX idx_live_updates_active 
    ON live_updates(masjid_id, update_type, expires_at);

-- ============================================
-- TABLE 8: BADGES (Gamification)
-- ============================================
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'subuh_warrior', 'musafir_tegar', etc.
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Icon name or emoji
    requirement_type TEXT, -- 'streak', 'visit_count', 'contribution'
    requirement_value INTEGER, -- e.g., 7 for 7-day streak
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 9: USER_BADGES (Earned Badges)
-- ============================================
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_unique_user_badge 
    ON user_badges(user_id, badge_id);

-- ============================================
-- TABLE 10: REPORTS (Flagging Wrong Data)
-- ============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID REFERENCES masjids(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    report_type TEXT NOT NULL CHECK (
        report_type IN (
            'does_not_exist',
            'wrong_location',
            'duplicate',
            'inappropriate_content',
            'wrong_info',
            'other'
        )
    ),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    
    -- Admin notes
    resolution_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status, created_at DESC);

CREATE TRIGGER update_reports_modtime
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ============================================
-- AUTO-VERIFY TRIGGER (3 Upvotes = Verified)
-- ============================================
CREATE OR REPLACE FUNCTION auto_verify_masjid()
RETURNS TRIGGER AS $$
BEGIN
    -- Count upvotes for this masjid
    UPDATE masjids
    SET 
        verification_count = (
            SELECT COUNT(*) 
            FROM verifications 
            WHERE masjid_id = NEW.masjid_id 
            AND vote_type = 'upvote' 
            AND deleted_at IS NULL
        )
    WHERE id = NEW.masjid_id;
    
    -- Auto-verify if >= 3 upvotes
    UPDATE masjids
    SET status = 'verified'
    WHERE id = NEW.masjid_id 
    AND verification_count >= 3
    AND status = 'pending';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_verify
    AFTER INSERT ON verifications
    FOR EACH ROW
    EXECUTE FUNCTION auto_verify_masjid();

-- ============================================
-- SEEDING BADGES (Initial Data)
-- ============================================
INSERT INTO badges (code, name, description, icon, requirement_type, requirement_value) VALUES
    ('subuh_warrior', 'Subuh Warrior', 'Check-in Subuh 7 hari berturut-turut', '🌅', 'streak', 7),
    ('musafir_tegar', 'Musafir Tegar', 'Jejak masjid di 3 negeri berbeza', '🗺️', 'visit_count', 3),
    ('ajk_iftar', 'AJK Iftar', 'Orang pertama update menu iftar', '🍽️', 'contribution', 1),
    ('kucing_lover', 'Kucing Lover', 'Update info kucing di 5 masjid', '🐱', 'contribution', 5),
    ('ramadan_champion', 'Ramadan Champion', 'Check-in Terawih 20 malam dalam Ramadan', '🌙', 'visit_count', 20),
    ('masjid_hunter', 'Masjid Hunter', 'Jejak 50 masjid berbeza', '🕌', 'visit_count', 50)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE masjids ENABLE ROW LEVEL SECURITY;
ALTER TABLE masjid_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE masjid_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Masjids: Public read, authenticated write
CREATE POLICY "Anyone can view verified masjids" ON masjids FOR SELECT USING (status = 'verified' OR auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create masjids" ON masjids FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners can update own masjids" ON masjids FOR UPDATE USING (created_by = auth.uid());

-- Facilities: Public read, authenticated write
CREATE POLICY "Anyone can view facilities" ON masjid_facilities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage facilities" ON masjid_facilities FOR ALL USING (auth.uid() IS NOT NULL);

-- Media: Public read, authenticated write
CREATE POLICY "Anyone can view media" ON masjid_media FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload media" ON masjid_media FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- User Visits: Users can only see own visits
CREATE POLICY "Users can view own visits" ON user_visits FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own visits" ON user_visits FOR INSERT WITH CHECK (user_id = auth.uid());

-- Verifications: Public read, authenticated write
CREATE POLICY "Anyone can view verifications" ON verifications FOR SELECT USING (true);
CREATE POLICY "Authenticated users can verify" ON verifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Live Updates: Public read, authenticated write
CREATE POLICY "Anyone can view live updates" ON live_updates FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Authenticated users can post updates" ON live_updates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- User Badges: Users can only see own badges
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (user_id = auth.uid());

-- Reports: Public read for admins, authenticated write
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (reporter_id = auth.uid());

-- ============================================
-- HELPER FUNCTIONS FOR QUERIES
-- ============================================

-- Function to find nearby masjids within radius (in meters)
CREATE OR REPLACE FUNCTION find_nearby_masjids(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        ST_Distance(
            m.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) as distance_meters
    FROM masjids m
    WHERE 
        ST_DWithin(
            m.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_meters
        )
        AND m.deleted_at IS NULL
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONE! 🎉
-- ============================================
-- This schema is production-ready with:
-- ✅ PostGIS for radius checks
-- ✅ Audit trails (created_at, updated_at, deleted_at)
-- ✅ Soft deletes
-- ✅ Auto-verification trigger
-- ✅ Row Level Security
-- ✅ Proper indexes for performance
-- ✅ All "lovable" features included
-- ============================================

// ── Masjid ─────────────────────────────────────────────────────────

export type MasjidStatus = "pending" | "verified" | "flagged" | "rejected";

export type VisitType =
  | "subuh" | "zohor" | "asar" | "maghrib" | "isyak"
  | "jumaat" | "terawih" | "iftar" | "kuliah" | "general";

/** Raw shape returned from Supabase via the list/detail endpoints (snake_case) */
export interface Facilities {
  id: string;
  masjid_id: string;
  terawih_rakaat: 8 | 11 | 20 | 23 | null;
  has_iftar: boolean;
  iftar_type: string | null;
  iftar_menu: string | null;
  cooling_system: string;
  has_coway: boolean;
  kucing_count: string;
  karpet_vibe: string | null;
  talam_gang: boolean;
  parking_level: string | null;
  has_parking_oku: boolean;
  has_parking_moto: boolean;
  has_kids_area: boolean;
  is_family_friendly: boolean;
  has_clean_telekung: boolean;
  telekung_rating: string | null;
  wudhu_seating: boolean;
  toilet_cleanliness: string | null;
  toilet_floor_condition: string | null;
  is_tourist_friendly: boolean;
  has_tahfiz: boolean;
  has_library: boolean;
  near_bas: boolean;
  near_lrt: boolean;
  near_mrt: boolean;
}

export interface Masjid {
  id: string;
  slug: string | null;
  name: string;
  address: string | null;
  description: string | null;
  status: MasjidStatus;
  verification_count: number;
  created_at: string;
  created_by: string | null;
  facilities: Facilities | null;
}

export interface LiveStatus {
  masjid_id: string;
  masjid_name: string;
  saf_status: string | null;
  parking_status: string | null;
  iftar_menu: string | null;
  crowd_level: string | null;
  last_updated_at: string | null;
}

// ── Auth ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

// ── Pagination ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Gamification ───────────────────────────────────────────────────

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge: Badge;
  earned_at: string;
}

export interface UserStats {
  reputation_points: number;
  streak_count: number;
  longest_streak: number;
  total_visits: number;
  unique_masjids_visited: number;
  badges_earned: number;
  total_badges: number;
  badges: UserBadge[];
  visit_breakdown: Record<string, number>;
}

// ── Visits ─────────────────────────────────────────────────────────

export interface Visit {
  id: string;
  user_id: string;
  masjid_id: string;
  visit_type: VisitType;
  visit_date: string;
  distance_meters: number | null;
  created_at: string;
  masjid_name: string | null;
}

export interface VisitHistory {
  visits: Visit[];
  total_visits: number;
  current_streak: number;
  longest_streak: number;
  unique_masjids: number;
  favorite_masjid: string | null;
}

export interface CheckInResult {
  message: string;
  visit_id: string;
  streak_count: number;
  points_earned: number;
  badges_unlocked: string[];
  distance_meters: number;
}

// ── Reports ──────────────────────────────────────────────────────

export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export interface Report {
  id: string;
  masjid_id: string;
  reporter_id: string | null;
  report_type: string;
  description: string | null;
  status: ReportStatus;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  masjids: { id: string; name: string } | null;
}

// ── Verification ──────────────────────────────────────────────────

export interface VerificationStatus {
  masjid_id: string;
  status: MasjidStatus;
  verification_count: number;
  needed_for_verification: number;
  user_has_voted: boolean;
  user_vote_type: "upvote" | "downvote" | null;
}
═══════════════════════════════════════════════════════════════════════════════
This file is the SINGLE SOURCE OF TRUTH for all variable / field names across
the three layers: Database → Python/Backend → TypeScript/Frontend.

Convention:
  DB column     →  snake_case   (PostgreSQL)
  Python field  →  snake_case   (SQLAlchemy / Pydantic)
  JSON / API    →  camelCase    (auto-generated via Pydantic alias_generator)
  TypeScript    →  camelCase    (matches JSON wire format exactly)

═══════════════════════════════════════════════════════════════════════════════
*/

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "user" | "moderator" | "admin";

export type MasjidStatus = "unverified" | "verified" | "rejected";

export type PrayerType =
  | "subuh"
  | "zohor"
  | "asar"
  | "maghrib"
  | "isyak"
  | "jumaat"
  | "terawih"
  | "iftar"
  | "tahajjud"
  | "others";

export type VerificationAction = "upvote" | "flag";

// ─────────────────────────────────────────────────────────────────────────────
// USER
// DB col          | Python field       | JSON/TS field
// ─────────────────────────────────────────────────────────────────────────────
// id              | id                 | id
// email           | email              | email
// password_hash   | password_hash      | (never sent to FE)
// google_id       | google_id          | (never sent to FE)
// full_name       | full_name          | fullName
// display_name    | display_name       | displayName
// avatar_url      | avatar_url         | avatarUrl
// bio             | bio                | bio
// is_email_verified | is_email_verified | isEmailVerified
// is_active       | is_active          | isActive
// role            | role               | role
// created_at      | created_at         | createdAt
// updated_at      | updated_at         | updatedAt
// deleted_at      | deleted_at         | deletedAt
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string; // UUID
  email: string;
  fullName: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string; // ISO 8601
}

export interface UserProfile {
  id: string;
  fullName: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MASJID
// DB col              | Python field         | JSON/TS field
// ─────────────────────────────────────────────────────────────────────────────
// id                  | id                   | id
// name                | name                 | name
// slug                | slug                 | slug
// description         | description          | description
// address             | address              | address
// city                | city                 | city
// state               | state                | state
// postcode            | postcode             | postcode
// country             | country              | country
// latitude            | latitude             | latitude
// longitude           | longitude            | longitude
// google_place_id     | google_place_id      | googlePlaceId
// google_maps_url     | google_maps_url      | googleMapsUrl
// images              | images               | images
// cover_image_url     | cover_image_url      | coverImageUrl
// facilities          | facilities           | facilities
// status              | status               | status
// verification_count  | verification_count   | verificationCount
// visit_count         | visit_count          | visitCount
// average_rating      | average_rating       | averageRating
// review_count        | review_count         | reviewCount
// submitted_by        | submitted_by         | submittedBy
// is_active           | is_active            | isActive
// created_at          | created_at           | createdAt
// updated_at          | updated_at           | updatedAt
// deleted_at          | deleted_at           | deletedAt
// ─────────────────────────────────────────────────────────────────────────────

export interface MasjidImage {
  url: string;
  caption?: string;
  isPrimary?: boolean;
}

export interface MasjidFacilities {
  wifi?: boolean;
  parking?: boolean;
  ablution?: boolean;      // tempat wudhu
  wheelchair?: boolean;    // akses OKU
  aircond?: boolean;
  library?: boolean;
  cafeteria?: boolean;
  childrenArea?: boolean;
  sisterhood?: boolean;    // bahagian wanita
}

export interface MasjidSummary {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  status: MasjidStatus;
  verificationCount: number;
  visitCount: number;
  averageRating: number | null;
  coverImageUrl: string | null;
}

export interface MasjidDetail extends MasjidSummary {
  description: string | null;
  address: string;
  postcode: string | null;
  country: string;
  googlePlaceId: string | null;
  googleMapsUrl: string | null;
  images: MasjidImage[] | null;
  facilities: MasjidFacilities | null;
  reviewCount: number;
  submittedBy: UserProfile | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// VISIT / LANGKAH
// DB col       | Python field  | JSON/TS field
// ─────────────────────────────────────────────────────────────────────────────
// id           | id            | id
// user_id      | user_id       | userId
// masjid_id    | masjid_id     | masjidId
// prayer_type  | prayer_type   | prayerType
// visited_at   | visited_at    | visitedAt
// notes        | notes         | notes
// is_ramadan   | is_ramadan    | isRamadan
// created_at   | created_at    | createdAt
// ─────────────────────────────────────────────────────────────────────────────

export interface Visit {
  id: string;
  userId: string;
  masjidId: string;
  prayerType: PrayerType;
  visitedAt: string;
  notes: string | null;
  isRamadan: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION
// DB col      | Python field  | JSON/TS field
// ─────────────────────────────────────────────────────────────────────────────
// id          | id            | id
// user_id     | user_id       | userId
// masjid_id   | masjid_id     | masjidId
// action      | action        | action
// created_at  | created_at    | createdAt
// ─────────────────────────────────────────────────────────────────────────────

export interface Verification {
  id: string;
  userId: string;
  masjidId: string;
  action: VerificationAction;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW
// DB col               | Python field          | JSON/TS field
// ─────────────────────────────────────────────────────────────────────────────
// id                   | id                    | id
// user_id              | user_id               | userId
// masjid_id            | masjid_id             | masjidId
// rating               | rating                | rating
// comment              | comment               | comment
// cleanliness_rating   | cleanliness_rating    | cleanlinessRating
// facilities_rating    | facilities_rating     | facilitiesRating
// crowd_rating         | crowd_rating          | crowdRating
// is_approved          | is_approved           | isApproved
// created_at           | created_at            | createdAt
// updated_at           | updated_at            | updatedAt
// deleted_at           | deleted_at            | deletedAt
// ─────────────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  masjidId: string;
  rating: number; // 1–5
  comment: string | null;
  cleanlinessRating: number | null;
  facilitiesRating: number | null;
  crowdRating: number | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API UTILITY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM / REQUEST TYPES (matches Pydantic request schemas)
// ─────────────────────────────────────────────────────────────────────────────

export interface UserRegisterForm {
  email: string;
  password: string;
  fullName: string;
}

export interface UserLoginForm {
  email: string;
  password: string;
}

export interface MasjidCreateForm {
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  postcode?: string;
  country: string;
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  facilities?: MasjidFacilities;
}

export interface VisitCreateForm {
  masjidId: string;
  prayerType: PrayerType;
  visitedAt?: string;
  notes?: string;
  isRamadan: boolean;
}

export interface ReviewCreateForm {
  rating: number;
  comment?: string;
  cleanlinessRating?: number;
  facilitiesRating?: number;
  crowdRating?: number;
}

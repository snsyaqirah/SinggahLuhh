// ── Masjid ─────────────────────────────────────────────────────────

export type MasjidStatus = "pending" | "verified" | "flagged" | "rejected";

export type VisitType =
  | "subuh" | "zohor" | "asar" | "maghrib" | "isyak"
  | "jumaat" | "terawih" | "iftar" | "kuliah" | "general";

// Extended prayer type used in labels (superset of VisitType)
export type PrayerType =
  | "subuh" | "zohor" | "asar" | "maghrib" | "isyak"
  | "jumaat" | "terawih" | "iftar" | "kuliah" | "general"
  | "tahajjud" | "others";

/** Raw shape returned from Supabase (snake_case, matches masjid_facilities table) */
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
  latitude: number | null;
  longitude: number | null;
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

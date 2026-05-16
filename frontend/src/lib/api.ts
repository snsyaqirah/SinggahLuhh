/**
 * SinggahLuhh API client
 * All requests go through here. Matches FastAPI backend at /api/v1/...
 * Note: auth/pagination wrappers are camelCase (Pydantic aliases).
 *       Masjid/facilities data inside `items` is snake_case (raw Supabase).
 */

import type {
  Masjid,
  UserStats,
  UserBadge,
  VisitHistory,
  CheckInResult,
  VerificationStatus,
  LiveStatus,
  PaginatedResponse,
  AuthUser,
} from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Token helpers ─────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ── Core fetch wrapper ────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(res.status, error.detail ?? error.error ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Auth ──────────────────────────────────────────────────────────

export const authApi = {
  signup: (body: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    gender?: "Lelaki" | "Perempuan";
  }) =>
    request<{
      message: string;
      email: string;
      userId: string;
      accessToken?: string;
      refreshToken?: string;
      user?: Record<string, unknown>;
    }>(
      "/api/v1/auth/signup",
      { method: "POST", body: JSON.stringify(body) }
    ),

  verifyOtp: async (body: { email: string; token: string }) => {
    const data = await request<{
      message: string;
      accessToken: string;
      refreshToken: string;
      user: Record<string, unknown>;
    }>("/api/v1/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  resendOtp: (email: string) =>
    request<{ message: string }>("/api/v1/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  login: async (body: { email: string; password: string }) => {
    const data = await request<{
      accessToken: string;
      refreshToken: string;
      user: Record<string, unknown>;
    }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  logout: async () => {
    try {
      await request("/api/v1/auth/logout", { method: "POST" });
    } finally {
      clearTokens();
    }
  },

  me: () =>
    request<{ id: string; email: string; user_metadata: Record<string, unknown> }>(
      "/api/v1/auth/me"
    ),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      }),
    }),

  updatePassword: (newPassword: string, accessToken: string) =>
    request<{ message: string }>("/api/v1/auth/update-password", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ newPassword }),
    }),

  deleteAccount: () =>
    request<{ message: string; success: boolean }>("/api/v1/auth/account", { method: "DELETE" }),
};

export function userFromMeta(raw: {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
}): AuthUser {
  return {
    id: raw.id,
    email: raw.email,
    fullName:
      (raw.user_metadata?.full_name as string) ??
      raw.email.split("@")[0],
  };
}

// ── Masjids ───────────────────────────────────────────────────────

export const masjidsApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    type?: "masjid" | "surau" | "musolla";
    state?: string;
    search?: string;
  }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    );
    return request<PaginatedResponse<Masjid>>(`/api/v1/masjids?${qs}`);
  },

  get: (id: string) => request<Masjid>(`/api/v1/masjids/${id}`),

  checkNearby: (lat: number, lng: number, radiusMeters = 100) =>
    request<Array<{ id: string; name: string; distance_meters: number }>>(
      "/api/v1/masjids/check-nearby",
      {
        method: "POST",
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radius_meters: radiusMeters,
        }),
      }
    ),

  create: (body: {
    name: string;
    address: string;
    description?: string;
    latitude: number;
    longitude: number;
    type?: "masjid" | "surau" | "musolla";
    state?: string;
    district?: string;
  }) =>
    request<Masjid>("/api/v1/masjids", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<{ name: string; address: string; description: string }>) =>
    request<Masjid>(`/api/v1/masjids/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  remove: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/v1/masjids/${id}`, { method: "DELETE" }),
};

// ── Facilities ────────────────────────────────────────────────────

export const facilitiesApi = {
  get: (masjidId: string) =>
    request<Record<string, unknown> | null>(`/api/v1/facilities/${masjidId}`),

  create: (masjidId: string, body: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/v1/facilities/${masjidId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (masjidId: string, body: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/v1/facilities/${masjidId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

// ── Check-ins ─────────────────────────────────────────────────────

export const checkinsApi = {
  checkIn: (body: {
    masjidId: string;
    visitType: string;
    latitude: number;
    longitude: number;
    isMusafir?: boolean;
  }) =>
    request<CheckInResult>("/api/v1/checkins/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  history: (page = 1) =>
    request<VisitHistory>(`/api/v1/checkins/history?page=${page}`),
};

// ── Verifications ─────────────────────────────────────────────────

export const verificationsApi = {
  vote: (body: {
    masjidId: string;
    voteType: "upvote" | "downvote";
    reason?: string;
  }) =>
    request("/api/v1/verifications/vote", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getStatus: (masjidId: string) =>
    request<VerificationStatus>(`/api/v1/verifications/status/${masjidId}`),

  // alias kept for backward compat
  status: (masjidId: string) =>
    request<VerificationStatus>(`/api/v1/verifications/status/${masjidId}`),

  report: (body: {
    masjidId: string;
    reportType: string;
    description: string;
  }) =>
    request("/api/v1/verifications/report", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getMyReports: () =>
    request<import("@/types").Report[]>("/api/v1/verifications/reports/mine"),
};

// ── Media ─────────────────────────────────────────────────────────

export type MediaType = "main_photo" | "toilet_photo" | "interior_photo" | "qr_tng" | "qr_duitnow" | "masjid_board";

export interface MediaItem {
  id: string;
  masjidId: string;
  mediaType: MediaType;
  url: string;
  isVerified: boolean;
  verificationCount: number;
  createdAt: string;
  createdBy: string | null;
}

export const mediaApi = {
  get: (masjidId: string) =>
    request<MediaItem[]>(`/api/v1/masjids/${masjidId}/media`),

  add: (masjidId: string, body: { media_type: MediaType; url: string }) =>
    request<MediaItem>(`/api/v1/masjids/${masjidId}/media`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  remove: (masjidId: string, mediaId: string) =>
    request(`/api/v1/masjids/${masjidId}/media/${mediaId}`, { method: "DELETE" }),

  upload: async (masjidId: string, file: File, mediaType: MediaType): Promise<MediaItem> => {
    const token = getAccessToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("media_type", mediaType);
    const res = await fetch(`${BASE_URL}/api/v1/masjids/${masjidId}/media/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload gagal" }));
      throw new ApiError(res.status, err.detail ?? "Upload gagal");
    }
    return res.json();
  },
};

// ── Live Updates ──────────────────────────────────────────────────

export const liveUpdatesApi = {
  getStatus: (masjidId: string) =>
    request<LiveStatus>(`/api/v1/live-updates/${masjidId}`),

  post: (body: {
    masjidId: string;
    updateType: string;
    value: string;
  }) =>
    request("/api/v1/live-updates/", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ── Dashboard ─────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => request<UserStats>("/api/v1/dashboard/stats"),
  badges: () => request<UserBadge[]>("/api/v1/dashboard/badges"),
  leaderboard: (limit = 10, state?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (state) params.set("state", state);
    return request<{
      entries: Array<{
        rank: number;
        userId: string;
        fullName: string;
        reputationPoints: number;
        streakCount: number;
        totalVisits: number;
        badgesEarned: number;
      }>;
      userRank: number | null;
      totalUsers: number;
    }>(`/api/v1/dashboard/leaderboard?${params}`);
  },
};

// ── Public Stats ──────────────────────────────────────────────────

export const statsApi = {
  public: () =>
    request<{
      total_masjids: number;
      verified_masjids: number;
      total_visits: number;
    }>("/api/v1/masjids/stats"),
};

// ── Profile ───────────────────────────────────────────────────────

export const profileApi = {
  get: () =>
    request<{
      id: string;
      full_name: string;
      phone_number: string | null;
      gender: string | null;
      reputation_points: number;
      streak_count: number;
      longest_streak: number;
      last_checkin_at: string | null;
      created_at: string | null;
      is_admin: boolean;
    }>("/api/v1/profile/me"),

  update: (body: { full_name?: string; phone_number?: string; gender?: "Lelaki" | "Perempuan" }) =>
    request<{
      id: string;
      full_name: string;
      phone_number: string | null;
      gender: string | null;
      reputation_points: number;
      streak_count: number;
      longest_streak: number;
      last_checkin_at: string | null;
      created_at: string | null;
      is_admin: boolean;
    }>("/api/v1/profile/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

// ── Admin ────────────────────────────────────────────────────────

export const adminApi = {
  listReports: () =>
    request<import("@/types").Report[]>("/api/v1/verifications/reports/all"),

  resolveReport: (reportId: string, body: { status: string; resolution_notes?: string }) =>
    request<import("@/types").Report>(`/api/v1/verifications/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  listPendingMedia: () =>
    request<Array<{ id: string; masjid_id: string; media_type: string; url: string; created_at: string; masjid_name?: string }>>(
      "/api/v1/masjids/admin/pending-media"
    ),

  approveMedia: (mediaId: string) =>
    request<{ success: boolean }>(`/api/v1/masjids/admin/media/${mediaId}/approve`, { method: "PATCH" }),

  rejectMedia: (mediaId: string) =>
    request<{ success: boolean }>(`/api/v1/masjids/admin/media/${mediaId}/reject`, { method: "DELETE" }),
};

// ── Bookmarks ─────────────────────────────────────────────────────

export interface BookmarkItem {
  id: string;
  masjidId: string;
  isWishlist: boolean;
  createdAt: string;
  masjidName: string | null;
  masjidAddress: string | null;
  masjidType: string | null;
  masjidStatus: string | null;
}

export const bookmarksApi = {
  list: (isWishlist?: boolean) => {
    const qs = isWishlist != null ? `?is_wishlist=${isWishlist}` : "";
    return request<BookmarkItem[]>(`/api/v1/bookmarks${qs}`);
  },
  status: (masjidId: string) =>
    request<{ bookmarked: boolean; isWishlist: boolean }>(`/api/v1/bookmarks/status/${masjidId}`),
  add: (masjidId: string, isWishlist = false) =>
    request<{ message: string }>("/api/v1/bookmarks", {
      method: "POST",
      body: JSON.stringify({ masjidId, isWishlist }),
    }),
  remove: (masjidId: string) =>
    request(`/api/v1/bookmarks/${masjidId}`, { method: "DELETE" }),
};

// ── Diary ─────────────────────────────────────────────────────────

export interface DiaryEntry {
  id: string;
  masjidId: string;
  content: string;
  mood: string | null;
  visitType: string | null;
  createdAt: string;
  updatedAt: string;
  masjidName: string | null;
}

export const diaryApi = {
  list: (masjidId?: string) => {
    const qs = masjidId ? `?masjid_id=${masjidId}` : "";
    return request<DiaryEntry[]>(`/api/v1/diary${qs}`);
  },
  create: (body: { masjidId: string; content: string; mood?: string; visitType?: string }) =>
    request<DiaryEntry>("/api/v1/diary", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { content?: string; mood?: string }) =>
    request<DiaryEntry>(`/api/v1/diary/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request(`/api/v1/diary/${id}`, { method: "DELETE" }),
};

// ── Khatam Tracker ────────────────────────────────────────────────

export interface KhatamEntry {
  id: string;
  surahFrom: number;
  ayahFrom: number;
  surahTo: number;
  ayahTo: number;
  juz: number | null;
  notes: string | null;
  masjidId: string | null;
  createdAt: string;
}

export const khatamApi = {
  list: () => request<KhatamEntry[]>("/api/v1/khatam"),
  log: (body: { surahFrom: number; ayahFrom: number; surahTo: number; ayahTo: number; juz?: number; notes?: string; masjidId?: string }) =>
    request<KhatamEntry>("/api/v1/khatam", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request(`/api/v1/khatam/${id}`, { method: "DELETE" }),
};

// ── Special Prayers ───────────────────────────────────────────────

export interface SpecialPrayerEntry {
  id: string;
  prayerType: string;
  rakaat: number | null;
  notes: string | null;
  masjidId: string | null;
  isRamadan: boolean;
  createdAt: string;
  masjidName: string | null;
}

export const specialPrayersApi = {
  list: () => request<SpecialPrayerEntry[]>("/api/v1/special-prayers"),
  log: (body: { prayerType: string; rakaat?: number; notes?: string; masjidId?: string; isRamadan?: boolean }) =>
    request<SpecialPrayerEntry>("/api/v1/special-prayers", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request(`/api/v1/special-prayers/${id}`, { method: "DELETE" }),
};

// ── Events ────────────────────────────────────────────────────────

export interface EventItem {
  id: string;
  masjidId: string;
  title: string;
  description: string | null;
  eventType: string;
  startsAt: string;
  endsAt: string | null;
  isRecurring: boolean;
  createdAt: string;
  masjidName: string | null;
  createdBy: string | null;
}

export const eventsApi = {
  list: (masjidId?: string, upcomingOnly = true) => {
    const params = new URLSearchParams();
    if (masjidId) params.set("masjid_id", masjidId);
    params.set("upcoming_only", String(upcomingOnly));
    return request<EventItem[]>(`/api/v1/events?${params}`);
  },
  create: (body: { masjidId: string; title: string; description?: string; eventType?: string; startsAt: string; endsAt?: string; isRecurring?: boolean }) =>
    request<EventItem>("/api/v1/events", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request(`/api/v1/events/${id}`, { method: "DELETE" }),
};

// ── Announcements ─────────────────────────────────────────────────

export interface AnnouncementItem {
  id: string;
  masjidId: string;
  title: string;
  body: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
  expiresAt: string | null;
  masjidName: string | null;
  createdBy: string | null;
}

export const announcementsApi = {
  list: (masjidId?: string) => {
    const qs = masjidId ? `?masjid_id=${masjidId}` : "";
    return request<AnnouncementItem[]>(`/api/v1/announcements${qs}`);
  },
  create: (body: { masjidId: string; title: string; body: string; category?: string; isPinned?: boolean }) =>
    request<AnnouncementItem>("/api/v1/announcements", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request(`/api/v1/announcements/${id}`, { method: "DELETE" }),
};

// ── Feedback ──────────────────────────────────────────────────────

export const feedbackApi = {
  submit: (body: { message: string; rating?: number; pageUrl?: string; name?: string }) =>
    request<{ id: string }>("/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  list: () =>
    request<Array<{
      id: string;
      message: string;
      rating: number | null;
      page_url: string | null;
      name: string | null;
      user_id: string | null;
      created_at: string;
    }>>("/api/v1/feedback/admin"),
};

// ── Lost & Found ──────────────────────────────────────────────────

export interface LostFoundPost {
  id: string;
  masjidId: string;
  description: string;
  isResolved: boolean;
  createdAt: string;
  expiresAt: string;
  userId: string | null;
}

export const lostFoundApi = {
  list: (masjidId?: string) => {
    const qs = masjidId ? `?masjid_id=${masjidId}` : "";
    return request<LostFoundPost[]>(`/api/v1/lost-found${qs}`);
  },
  create: (body: { masjidId: string; description: string }) =>
    request<LostFoundPost>("/api/v1/lost-found", { method: "POST", body: JSON.stringify(body) }),
  resolve: (id: string) =>
    request<{ ok: boolean }>(`/api/v1/lost-found/${id}/resolve`, { method: "PATCH" }),
  remove: (id: string) =>
    request(`/api/v1/lost-found/${id}`, { method: "DELETE" }),
};

// ── Iftar Thread ──────────────────────────────────────────────────

export interface IftarPost {
  id: string;
  masjidId: string;
  iftarType: string | null;
  description: string | null;
  rating: number | null;
  ramadanSeason: string;
  createdAt: string;
  userId: string | null;
}

export const iftarApi = {
  list: (masjidId?: string, season?: string) => {
    const params = new URLSearchParams();
    if (masjidId) params.set("masjid_id", masjidId);
    if (season) params.set("season", season);
    return request<IftarPost[]>(`/api/v1/iftar?${params}`);
  },
  create: (body: { masjidId: string; iftarType?: string; description?: string; rating?: number }) =>
    request<IftarPost>("/api/v1/iftar", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request(`/api/v1/iftar/${id}`, { method: "DELETE" }),
};

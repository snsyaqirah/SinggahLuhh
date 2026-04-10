/**
 * JejakMasjid API — Supabase direct edition
 * All data goes directly to/from Supabase. No backend server needed.
 */

import { supabase } from "./supabase";
import type {
  Masjid,
  Facilities,
  LiveStatus,
  PaginatedResponse,
  UserStats,
  VisitHistory,
  CheckInResult,
  VerificationStatus,
  AuthUser,
  Badge,
  Report,
} from "@/types";

// ── Error class ───────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Auth helpers ──────────────────────────────────────────────────

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

// Kept for backward-compat imports — Supabase manages tokens internally
export function getAccessToken(): string | null { return null; }
export function setTokens(_a: string, _r: string) {}
export function clearTokens() {}

// ── Auth ──────────────────────────────────────────────────────────

export const authApi = {
  signup: async (body: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    gender?: "Lelaki" | "Perempuan";
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: { full_name: body.fullName, gender: body.gender },
      },
    });
    if (error) throw new ApiError(400, error.message);
    return {
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      session: data.session,
      user: data.user,
    };
  },

  login: async (body: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) throw new ApiError(401, error.message);
    return { user: data.user };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  me: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new ApiError(401, "Not authenticated");
    return { id: user.id, email: user.email!, user_metadata: user.user_metadata };
  },

  forgotPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new ApiError(400, error.message);
    return { message: "Email sent" };
  },

  updatePassword: async (newPassword: string, _accessToken?: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new ApiError(400, error.message);
    return { message: "Password updated" };
  },

  verifyOtp: async (body: { email: string; token: string }) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: body.email,
      token: body.token,
      type: "email",
    });
    if (error) throw new ApiError(400, error.message);
    return { user: data.user };
  },

  resendOtp: async (email: string) => {
    const { error } = await supabase.auth.resend({ email, type: "signup" });
    if (error) throw new ApiError(400, error.message);
    return { message: "OTP resent" };
  },

  deleteAccount: async () => {
    return { message: "Sila hubungi support untuk padam akaun.", success: false };
  },
};

// ── Masjids ───────────────────────────────────────────────────────

export const masjidsApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Masjid>> => {
    const pageSize = params?.page_size ?? 20;
    const page = params?.page ?? 1;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("masjids")
      .select("*, masjid_facilities(*)", { count: "exact" })
      .is("deleted_at", null);

    if (params?.status) query = query.eq("status", params.status);
    if (params?.search) query = query.ilike("name", `%${params.search}%`);

    const { data, error, count } = await query
      .range(from, to)
      .order("verification_count", { ascending: false });

    if (error) throw new ApiError(500, error.message);

    const items = (data ?? []).map((m: Record<string, unknown>) => ({
      ...m,
      facilities: (m.masjid_facilities as Facilities | null) ?? null,
    })) as Masjid[];

    const total = count ?? 0;
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  get: async (slugOrId: string): Promise<Masjid> => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const { data, error } = await supabase
      .from("masjids")
      .select("*, masjid_facilities(*)")
      .eq(isUuid ? "id" : "slug", slugOrId)
      .is("deleted_at", null)
      .single();

    if (error) throw new ApiError(404, error.message);
    return {
      ...data,
      facilities: (data.masjid_facilities as Facilities | null) ?? null,
    } as Masjid;
  },

  checkNearby: async (_lat: number, _lng: number, _radiusMeters = 100) => {
    // Duplicate detection skipped — requires PostGIS RPC not yet configured
    return [] as Array<{ id: string; name: string; distance_meters: number }>;
  },

  create: async (body: {
    name: string;
    address: string;
    description?: string;
    latitude: number;
    longitude: number;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, "Sila log masuk dahulu.");

    const { data, error } = await supabase
      .from("masjids")
      .insert({
        name: body.name,
        address: body.address,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        status: "pending",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw new ApiError(400, error.message);
    return data as Masjid;
  },

  update: async (id: string, body: Partial<{ name: string; address: string; description: string }>) => {
    const { data, error } = await supabase
      .from("masjids")
      .update(body)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new ApiError(400, error.message);
    return data as Masjid;
  },

  remove: async (id: string) => {
    const { error } = await supabase
      .from("masjids")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new ApiError(400, error.message);
    return { success: true, message: "Deleted" };
  },
};

// ── Facilities ────────────────────────────────────────────────────

export const facilitiesApi = {
  get: async (masjidId: string) => {
    const { data } = await supabase
      .from("masjid_facilities")
      .select("*")
      .eq("masjid_id", masjidId)
      .maybeSingle();
    return data as Record<string, unknown> | null;
  },

  create: async (masjidId: string, body: Record<string, unknown>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("masjid_facilities")
      .insert({ masjid_id: masjidId, ...body, created_by: user?.id })
      .select()
      .single();
    if (error) throw new ApiError(400, error.message);
    return data as Record<string, unknown>;
  },

  update: async (masjidId: string, body: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from("masjid_facilities")
      .upsert({ masjid_id: masjidId, ...body }, { onConflict: "masjid_id" })
      .select()
      .single();
    if (error) throw new ApiError(400, error.message);
    return data as Record<string, unknown>;
  },
};

// ── Check-ins ─────────────────────────────────────────────────────

export const checkinsApi = {
  checkIn: async (body: {
    masjidId: string;
    visitType: string;
    latitude: number;
    longitude: number;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, "Sila log masuk dahulu.");

    const { data, error } = await supabase
      .from("user_visits")
      .insert({
        user_id: user.id,
        masjid_id: body.masjidId,
        visit_type: body.visitType,
        visit_date: new Date().toISOString().split("T")[0],
        distance_meters: 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505")
        throw new ApiError(409, "Anda sudah check-in hari ini untuk jenis ibadah ini.");
      throw new ApiError(400, error.message);
    }

    return {
      message: "Check-in berjaya!",
      visit_id: (data as Record<string, unknown>).id as string,
      streak_count: 0,
      points_earned: 10,
      badges_unlocked: [],
      distance_meters: 0,
    } as CheckInResult;
  },

  history: async (_page = 1): Promise<VisitHistory> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, "Sila log masuk dahulu.");

    const [visitsRes, profileRes] = await Promise.all([
      supabase
        .from("user_visits")
        .select("id, user_id, masjid_id, visit_type, visit_date, distance_meters, created_at, masjids(name)")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("visit_date", { ascending: false }),
      supabase
        .from("profiles")
        .select("streak_count, longest_streak")
        .eq("id", user.id)
        .single(),
    ]);

    const visits = (visitsRes.data ?? []).map((v: Record<string, unknown>) => ({
      id: v.id as string,
      user_id: v.user_id as string,
      masjid_id: v.masjid_id as string,
      visit_type: v.visit_type as import("@/types").VisitType,
      visit_date: v.visit_date as string,
      distance_meters: v.distance_meters as number | null,
      created_at: v.created_at as string,
      masjid_name: (v.masjids as { name: string } | null)?.name ?? null,
    }));

    const uniqueMasjids = new Set(visits.map(v => v.masjid_id)).size;

    return {
      visits,
      total_visits: visits.length,
      current_streak: profileRes.data?.streak_count ?? 0,
      longest_streak: profileRes.data?.longest_streak ?? 0,
      unique_masjids: uniqueMasjids,
      favorite_masjid: null,
    };
  },
};

// ── Verifications ─────────────────────────────────────────────────

export const verificationsApi = {
  vote: async (body: {
    masjidId: string;
    voteType: "upvote" | "downvote";
    reason?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, "Sila log masuk dahulu.");

    const { error } = await supabase
      .from("verifications")
      .upsert(
        { masjid_id: body.masjidId, user_id: user.id, vote_type: body.voteType, reason: body.reason },
        { onConflict: "masjid_id,user_id" }
      );
    if (error) throw new ApiError(400, error.message);

    // Recalculate verification count from upvotes
    const { count } = await supabase
      .from("verifications")
      .select("id", { count: "exact", head: true })
      .eq("masjid_id", body.masjidId)
      .eq("vote_type", "upvote")
      .is("deleted_at", null);

    await supabase
      .from("masjids")
      .update({
        verification_count: count ?? 0,
        status: (count ?? 0) >= 3 ? "verified" : "pending",
      })
      .eq("id", body.masjidId);

    return { message: "Vote recorded" };
  },

  getStatus: async (masjidId: string): Promise<VerificationStatus> => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: masjid } = await supabase
      .from("masjids")
      .select("status, verification_count")
      .eq("id", masjidId)
      .single();

    let userVote: { vote_type: string } | null = null;
    if (user) {
      const { data } = await supabase
        .from("verifications")
        .select("vote_type")
        .eq("masjid_id", masjidId)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .maybeSingle();
      userVote = data;
    }

    const vCount = masjid?.verification_count ?? 0;
    return {
      masjid_id: masjidId,
      status: (masjid?.status ?? "pending") as import("@/types").MasjidStatus,
      verification_count: vCount,
      needed_for_verification: Math.max(0, 3 - vCount),
      user_has_voted: !!userVote,
      user_vote_type: (userVote?.vote_type ?? null) as "upvote" | "downvote" | null,
    };
  },

  status: (masjidId: string) => verificationsApi.getStatus(masjidId),

  report: async (body: { masjidId: string; reportType: string; description: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("reports")
      .insert({
        masjid_id: body.masjidId,
        reporter_id: user?.id,
        report_type: body.reportType,
        description: body.description,
      });
    if (error) throw new ApiError(400, error.message);
    return { message: "Report submitted" };
  },

  getMyReports: async (): Promise<Report[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("reports")
      .select("*, masjids(id, name)")
      .eq("reporter_id", user.id);
    return (data ?? []) as Report[];
  },
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

const toMediaItem = (m: Record<string, unknown>): MediaItem => ({
  id: m.id as string,
  masjidId: m.masjid_id as string,
  mediaType: m.media_type as MediaType,
  url: m.url as string,
  isVerified: m.is_verified as boolean,
  verificationCount: m.verification_count as number,
  createdAt: m.created_at as string,
  createdBy: (m.created_by as string) ?? null,
});

export const mediaApi = {
  get: async (masjidId: string): Promise<MediaItem[]> => {
    const { data } = await supabase
      .from("masjid_media")
      .select("*")
      .eq("masjid_id", masjidId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    return (data ?? []).map(toMediaItem);
  },

  add: async (masjidId: string, body: { media_type: MediaType; url: string }): Promise<MediaItem> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("masjid_media")
      .insert({ masjid_id: masjidId, media_type: body.media_type, url: body.url, created_by: user?.id })
      .select()
      .single();
    if (error) throw new ApiError(400, error.message);
    return toMediaItem(data as Record<string, unknown>);
  },

  remove: async (masjidId: string, mediaId: string) => {
    const { error } = await supabase
      .from("masjid_media")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", mediaId)
      .eq("masjid_id", masjidId);
    if (error) throw new ApiError(400, error.message);
  },

  upload: async (masjidId: string, file: File, mediaType: MediaType): Promise<MediaItem> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, "Sila log masuk dahulu.");

    const ext = file.name.split(".").pop();
    const path = `${masjidId}/${mediaType}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("masjid-media")
      .upload(path, file, { upsert: true });
    if (uploadError) throw new ApiError(400, uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from("masjid-media")
      .getPublicUrl(path);

    return mediaApi.add(masjidId, { media_type: mediaType, url: publicUrl });
  },
};

// ── Live Updates ──────────────────────────────────────────────────

export const liveUpdatesApi = {
  getStatus: async (masjidId: string): Promise<LiveStatus> => {
    const now = new Date().toISOString();
    const [updatesRes, masjidRes] = await Promise.all([
      supabase
        .from("live_updates")
        .select("update_type, value, created_at")
        .eq("masjid_id", masjidId)
        .gt("expires_at", now)
        .order("created_at", { ascending: false }),
      supabase.from("masjids").select("name").eq("id", masjidId).single(),
    ]);

    const latest: Record<string, string> = {};
    (updatesRes.data ?? []).forEach((u: { update_type: string; value: string }) => {
      if (!latest[u.update_type]) latest[u.update_type] = u.value;
    });

    return {
      masjid_id: masjidId,
      masjid_name: masjidRes.data?.name ?? "",
      saf_status: latest["saf_status"] ?? null,
      parking_status: latest["parking_status"] ?? null,
      iftar_menu: latest["iftar_menu"] ?? null,
      crowd_level: latest["crowd_level"] ?? null,
      last_updated_at: updatesRes.data?.[0] ? now : null,
    };
  },

  post: async (body: { masjidId: string; updateType: string; value: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, "Sila log masuk dahulu.");

    const expireMinutes = body.updateType === "iftar_menu" ? 24 * 60 : 45;
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000).toISOString();

    const { error } = await supabase.from("live_updates").insert({
      masjid_id: body.masjidId,
      user_id: user.id,
      update_type: body.updateType,
      value: body.value,
      expires_at: expiresAt,
    });
    if (error) throw new ApiError(400, error.message);
    return { message: "Update posted" };
  },
};

// ── Dashboard ─────────────────────────────────────────────────────

export const dashboardApi = {
  stats: async (): Promise<UserStats> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, "Sila log masuk dahulu.");

    const [profileRes, visitsRes, badgesRes, totalBadgesRes] = await Promise.all([
      supabase.from("profiles").select("reputation_points, streak_count, longest_streak").eq("id", user.id).single(),
      supabase.from("user_visits").select("visit_type, masjid_id").eq("user_id", user.id).is("deleted_at", null),
      supabase.from("user_badges").select("id, earned_at, badges(id, code, name, description, icon, requirement_type, requirement_value)").eq("user_id", user.id),
      supabase.from("badges").select("id", { count: "exact", head: true }),
    ]);

    const visitBreakdown: Record<string, number> = {};
    const uniqueMasjids = new Set<string>();
    (visitsRes.data ?? []).forEach((v: { visit_type: string; masjid_id: string }) => {
      visitBreakdown[v.visit_type] = (visitBreakdown[v.visit_type] ?? 0) + 1;
      uniqueMasjids.add(v.masjid_id);
    });

    const badges = (badgesRes.data ?? []).map((b: Record<string, unknown>) => ({
      id: b.id as string,
      user_id: user.id,
      badge: b.badges as Badge,
      earned_at: b.earned_at as string,
    }));

    return {
      reputation_points: profileRes.data?.reputation_points ?? 0,
      streak_count: profileRes.data?.streak_count ?? 0,
      longest_streak: profileRes.data?.longest_streak ?? 0,
      total_visits: (visitsRes.data ?? []).length,
      unique_masjids_visited: uniqueMasjids.size,
      badges_earned: badges.length,
      total_badges: totalBadgesRes.count ?? 0,
      badges,
      visit_breakdown: visitBreakdown,
    };
  },

  badges: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("user_badges")
      .select("id, earned_at, badges(id, code, name, description, icon, requirement_type, requirement_value)")
      .eq("user_id", user.id);
    return (data ?? []).map((b: Record<string, unknown>) => ({
      id: b.id as string,
      user_id: user.id,
      badge: b.badges as Badge,
      earned_at: b.earned_at as string,
    }));
  },

  leaderboard: async (limit = 10) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, reputation_points, streak_count")
      .order("reputation_points", { ascending: false })
      .limit(limit);

    const entries = (data ?? []).map((p: Record<string, unknown>, i: number) => ({
      rank: i + 1,
      userId: p.id as string,
      fullName: p.full_name as string,
      reputationPoints: p.reputation_points as number,
      streakCount: p.streak_count as number,
      totalVisits: 0,
      badgesEarned: 0,
    }));

    const userRank = user ? (entries.findIndex(e => e.userId === user.id) + 1) || null : null;
    return { entries, userRank, totalUsers: entries.length };
  },
};

// ── Public Stats ──────────────────────────────────────────────────

export const statsApi = {
  public: async () => {
    const [totalRes, verifiedRes, visitsRes] = await Promise.all([
      supabase.from("masjids").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("masjids").select("id", { count: "exact", head: true }).eq("status", "verified").is("deleted_at", null),
      supabase.from("user_visits").select("id", { count: "exact", head: true }).is("deleted_at", null),
    ]);
    return {
      total_masjids: totalRes.count ?? 0,
      verified_masjids: verifiedRes.count ?? 0,
      total_visits: visitsRes.count ?? 0,
    };
  },
};

// ── Profile ───────────────────────────────────────────────────────

export const profileApi = {
  get: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, "Sila log masuk dahulu.");
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error) throw new ApiError(404, error.message);
    return {
      id: data.id as string,
      full_name: data.full_name as string,
      phone_number: (data.phone_number as string | null) ?? null,
      gender: (data.gender as string | null) ?? null,
      reputation_points: (data.reputation_points as number) ?? 0,
      streak_count: (data.streak_count as number) ?? 0,
      longest_streak: (data.longest_streak as number) ?? 0,
      last_checkin_at: (data.last_checkin_at as string | null) ?? null,
      created_at: (data.created_at as string | null) ?? null,
      is_admin: (data.is_admin as boolean) ?? false,
    };
  },

  update: async (body: { full_name?: string; phone_number?: string; gender?: "Lelaki" | "Perempuan" }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, "Sila log masuk dahulu.");
    const { data, error } = await supabase
      .from("profiles")
      .update(body)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw new ApiError(400, error.message);
    return { ...data, is_admin: (data.is_admin as boolean) ?? false };
  },
};

// ── Admin ────────────────────────────────────────────────────────

export const adminApi = {
  listReports: async (): Promise<Report[]> => {
    const { data } = await supabase
      .from("reports")
      .select("*, masjids(id, name)")
      .order("created_at", { ascending: false });
    return (data ?? []) as Report[];
  },

  resolveReport: async (reportId: string, body: { status: string; resolution_notes?: string }) => {
    const { data, error } = await supabase
      .from("reports")
      .update({ status: body.status, resolution_notes: body.resolution_notes, resolved_at: new Date().toISOString() })
      .eq("id", reportId)
      .select()
      .single();
    if (error) throw new ApiError(400, error.message);
    return data as Report;
  },

  listPendingMedia: async () => {
    const { data } = await supabase
      .from("masjid_media")
      .select("id, masjid_id, media_type, url, created_at, masjids(name)")
      .eq("is_verified", false)
      .is("deleted_at", null);
    return (data ?? []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      masjid_id: m.masjid_id as string,
      media_type: m.media_type as string,
      url: m.url as string,
      created_at: m.created_at as string,
      masjid_name: (m.masjids as { name: string } | null)?.name,
    }));
  },

  approveMedia: async (mediaId: string) => {
    const { error } = await supabase.from("masjid_media").update({ is_verified: true }).eq("id", mediaId);
    if (error) throw new ApiError(400, error.message);
    return { success: true };
  },

  rejectMedia: async (mediaId: string) => {
    const { error } = await supabase.from("masjid_media").update({ deleted_at: new Date().toISOString() }).eq("id", mediaId);
    if (error) throw new ApiError(400, error.message);
    return { success: true };
  },
};

// ── Feedback ──────────────────────────────────────────────────────

export const feedbackApi = {
  submit: async (body: { message: string; rating?: number; pageUrl?: string; name?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        message: body.message,
        rating: body.rating,
        page_url: body.pageUrl,
        name: body.name,
        user_id: user?.id,
      })
      .select("id")
      .single();
    if (error) throw new ApiError(400, error.message);
    return { id: (data as Record<string, unknown>).id as string };
  },

  list: async () => {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  },
};

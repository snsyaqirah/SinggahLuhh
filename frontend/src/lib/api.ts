/**
 * JejakMasjid API client
 * ─────────────────────────────────────────────────────────────────────────────
 * All fetch calls go through here. camelCase on FE matches the Pydantic
 * alias_generator on the backend, so no mapping layer is needed.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Token helpers ─────────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

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
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, error.error ?? error.detail ?? "Request failed");
  }

  // 204 No Content
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

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: { email: string; password: string; fullName: string }) =>
    supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: { data: { full_name: body.fullName } }
    }),

  login: async (body: { email: string; password: string }) => 
    supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    }),

  googleLogin: () => 
    supabase.auth.signInWithOAuth({ provider: 'google' }),
};

// ── Masjids ───────────────────────────────────────────────────────────────────

export const masjidsApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('masjids') // Pastikan nama table sama macam kat Supabase
      .select('*')
    if (error) throw error;
    return data;
  },
  
  get: (slug: string) => 
    supabase.from('masjids').select('*').eq('slug', slug).single(),
};

// ── Visits / Langkah ──────────────────────────────────────────────────────────

export const visitsApi = {
  checkIn: (body: unknown) =>
    request("/api/v1/visits", { method: "POST", body: JSON.stringify(body) }),

  myVisits: (page = 1, prayerType?: string) => {
    const qs = prayerType ? `&prayerType=${prayerType}` : "";
    return request(`/api/v1/visits/me?page=${page}${qs}`);
  },

  delete: (id: string) =>
    request(`/api/v1/visits/${id}`, { method: "DELETE" }),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  me: () => request("/api/v1/users/me"),
  updateMe: (body: unknown) =>
    request("/api/v1/users/me", { method: "PATCH", body: JSON.stringify(body) }),
  profile: (id: string) => request(`/api/v1/users/${id}`),
};

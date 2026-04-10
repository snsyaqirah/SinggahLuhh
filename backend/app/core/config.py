from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "JejakMasjid API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"   # "development" | "staging" | "production"

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str  # e.g. postgresql+asyncpg://user:pass@localhost:5432/jejakmasjid
    
    # ── Supabase ─────────────────────────────────────────────────────────────
    SUPABASE_URL: str              # Your Supabase project URL
    SUPABASE_ANON_KEY: str         # Supabase anon/public key
    SUPABASE_SERVICE_KEY: str      # Supabase service_role key (for admin operations)

    # ── Security / JWT ────────────────────────────────────────────────────────
    SECRET_KEY: str                          # generate with: openssl rand -hex 32
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Google OAuth ─────────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # ── CORS ──────────────────────────────────────────────────────────────────
    FRONTEND_URL: str = ""          # Set in production: https://your-app.vercel.app
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    @property
    def cors_origins(self) -> list[str]:
        origins = list(self.ALLOWED_ORIGINS)
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins

    # ── Masjid verification ───────────────────────────────────────────────────
    MASJID_VERIFY_THRESHOLD: int = 3
    MASJID_DUPLICATE_RADIUS_METERS: int = 100

    # ── Email (SMTP) ──────────────────────────────────────────────────────────
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@jejakmasjid.com"


settings = Settings()  # type: ignore[call-arg]

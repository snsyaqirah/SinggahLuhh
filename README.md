# SinggahLuhh

**Cari, jejak, dan kongsi masjid berhampiran anda.**

SinggahLuhh is a community-driven mosque discovery and visit tracking app for Malaysia. Users discover mosques, check in to earn streaks and reputation, contribute facility info, and share real-time crowd updates — all wrapped in gamification that rewards the Malaysian jemaah spirit.

---

## Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Auth Flow](#auth-flow)
- [Check-in Flow](#check-in-flow)
- [API Overview](#api-overview)
- [Environment Variables](#environment-variables)
- [Running with Docker](#running-with-docker)
- [Project Structure](#project-structure)

---

## Features

### Mosque Discovery
- Browse all verified mosques with search and filters
- View full facility details per mosque (AC, parking, toilets, etc.)
- Slug-based URLs (`/masjid/masjid-al-amin-abc123`)
- 100m radius duplicate check before adding a new mosque

### Malaysian-Specific Facilities
| Category | Details |
|---|---|
| Cooling | Full AC / partial AC / HVLS fans / regular fans / panas |
| Kucing | Count of cats (ramai / orange / a few / none) |
| Parking | Difficulty level, OKU spaces, motorcycle parking |
| Wanita | Telekung availability + cleanliness, wudhu seating |
| Food | Talam gang flag, iftar type (kotak / talam / buffet / DIY), menu |
| Solat | Terawih rakaat count (8 / 11 / 20 / 23) |
| Amenities | Coway dispenser, toilet cleanliness + floor condition |
| Extra | Tourist-friendly, tahfiz, library, kids area, family-friendly |

### Visit Tracking (Langkah)
- GPS check-in with geofencing (must be within 200m)
- Track prayer type: Subuh, Zohor, Asar, Maghrib, Isyak, Jumaat, Terawih, Iftar, Kuliah
- Prevent duplicate check-ins for same mosque + prayer + day
- Daily streak tracking (resets if you miss a day)

### Gamification
- **Reputation Points** earned via contributions:
  - Subuh check-in → 15 pts
  - Other prayers → 10 pts
  - Add facilities → 10 pts
  - Live update → 5 pts
  - Vote → 5 pts
- **Badges** for achievements:
  | Badge | Requirement |
  |---|---|
  | Subuh Warrior | 7-day streak |
  | Musafir Tegar | Visit mosques in 3 different states |
  | AJK Iftar | First to post an iftar menu update |
  | Kucing Lover | Update kucing info at 5 mosques |
  | Ramadan Champion | 20 terawih check-ins |
  | Masjid Hunter | 50 unique mosques visited |
- **Leaderboard** — top users by reputation, with your own rank shown

### Community Verification
- Upvote / downvote mosque submissions (toggle, cannot vote own submissions)
- Downvotes require a reason
- Auto-verify mosque at 3+ upvotes (database trigger)

### Live Crowdsourced Updates
- Post real-time conditions: saf status, parking, iftar menu, crowd level
- Auto-expire: 45 min for prayer/parking/crowd, 24h for iftar menu
- Active updates shown on mosque detail page

### Reports & Moderation
- Report mosque data issues: doesn't exist, wrong location, duplicate, inappropriate, wrong info
- Admin panel to review and resolve reports with notes

### Auth & Profile
- Email + password signup with 6-digit OTP email verification
- Forgot password via email reset link
- Edit profile (name, phone, gender)
- JWT-based sessions (30 min access token, 7-day refresh token)
- Account deletion (cascades all user data)

### Other
- Feedback form (floating button, always accessible)
- PWA — installable on mobile
- FAQ, Changelog, Privacy Policy, Terms pages
- Public homepage stats (total mosques, verified count, total visits)

---

## System Architecture

```mermaid
graph TD
    subgraph Client
        B[Browser / PWA]
    end

    subgraph Frontend
        FE["React + Vite\nport 5173 (dev)\nport 80 (prod via nginx)"]
    end

    subgraph Backend
        API["FastAPI\nport 8000 (dev)\nport 8080 (prod)"]
    end

    subgraph Supabase
        AUTH["Supabase Auth\n(email + OTP, JWT)"]
        DB["PostgreSQL + PostGIS\n(profiles, masjids, visits, etc.)"]
        RLS["Row-Level Security"]
    end

    B --> FE
    FE -- "REST /api/v1/*" --> API
    API -- "Supabase SDK" --> AUTH
    API -- "asyncpg / SQLAlchemy" --> DB
    DB --> RLS

    style Client fill:#fff8f0,stroke:#c9a96e
    style Frontend fill:#e8f5e9,stroke:#4caf50
    style Backend fill:#e3f2fd,stroke:#2196f3
    style Supabase fill:#fce4ec,stroke:#e91e63
```

### Docker Compose (Dev vs Prod)

```mermaid
graph LR
    subgraph Dev ["docker-compose.yml (dev)"]
        direction TB
        D1["frontend container\nVite dev server :5173\nwith hot reload"]
        D2["backend container\nFastAPI :8000\nwith --reload"]
        D1 -. "VITE_API_URL=http://localhost:8000" .-> D2
    end

    subgraph Prod ["docker-compose.prod.yml (prod)"]
        direction TB
        P1["frontend container\nnginx :80\nserves built static files"]
        P2["backend container\nFastAPI :8080\n(internal only)"]
        P1 -- "/api/* proxied" --> P2
    end

    Browser1["Browser"] --> D1
    Browser2["Browser"] --> P1
```

---

## Tech Stack

```mermaid
graph TD
    subgraph "Frontend"
        FW["React 18 + TypeScript"]
        VT["Vite 7"]
        RR["React Router v6"]
        TQ["TanStack Query v5"]
        UI["shadcn/ui + Radix UI"]
        TW["Tailwind CSS 3"]
        RHF["React Hook Form + Zod"]
        PWA["vite-plugin-pwa"]
        RC["Recharts"]
        NT["next-themes (dark mode)"]
    end

    subgraph "Backend"
        FA["FastAPI 0.115"]
        UV["Uvicorn"]
        SA["SQLAlchemy (async)"]
        AL["Alembic (migrations)"]
        PJ["python-jose (JWT)"]
        SB["Supabase Python SDK"]
        GEO["geopy + PostGIS"]
        SL["python-slugify"]
    end

    subgraph "Infrastructure"
        SBA["Supabase (Auth + DB)"]
        PG["PostgreSQL + PostGIS"]
        DK["Docker + Compose"]
        CB["Cloud Build (GCP)"]
        VE["Vercel (frontend deploy)"]
        CR["Cloud Run (backend deploy)"]
    end

    FW --> UI
    FW --> TQ
    FA --> SA --> PG
    FA --> SB --> SBA
    SBA --> PG
```

---

## Database Schema

```mermaid
erDiagram
    profiles {
        uuid id PK
        text full_name
        text phone_number
        text gender
        int reputation_points
        int streak_count
        int longest_streak
        timestamp last_checkin_at
        timestamp created_at
        timestamp deleted_at
    }

    masjids {
        uuid id PK
        text name
        text address
        geometry location
        text status
        int verification_count
        text description
        text slug
        uuid created_by FK
        timestamp created_at
        timestamp deleted_at
    }

    masjid_facilities {
        uuid id PK
        uuid masjid_id FK
        text cooling_system
        text kucing_count
        bool talam_gang
        bool has_iftar
        text iftar_type
        text terawih_rakaat
        text parking_level
        bool has_parking_oku
        bool has_parking_moto
        bool has_coway
        text toilet_cleanliness
        bool has_kids_area
        bool is_family_friendly
        uuid created_by FK
    }

    masjid_media {
        uuid id PK
        uuid masjid_id FK
        text media_type
        text url
        bool is_verified
        int verification_count
        uuid created_by FK
    }

    user_visits {
        uuid id PK
        uuid user_id FK
        uuid masjid_id FK
        text visit_type
        date visit_date
        geometry user_location
        numeric distance_meters
        timestamp created_at
    }

    verifications {
        uuid id PK
        uuid masjid_id FK
        uuid user_id FK
        text vote_type
        text reason
        timestamp created_at
    }

    live_updates {
        uuid id PK
        uuid masjid_id FK
        uuid user_id FK
        text update_type
        text value
        timestamp expires_at
        timestamp created_at
    }

    badges {
        uuid id PK
        text code
        text name
        text description
        text icon
        text requirement_type
        int requirement_value
    }

    user_badges {
        uuid id PK
        uuid user_id FK
        uuid badge_id FK
        timestamp earned_at
    }

    reports {
        uuid id PK
        uuid masjid_id FK
        uuid reporter_id FK
        text report_type
        text description
        text status
        text resolution_notes
        uuid resolved_by FK
        timestamp resolved_at
    }

    profiles ||--o{ user_visits : "has"
    profiles ||--o{ verifications : "casts"
    profiles ||--o{ live_updates : "posts"
    profiles ||--o{ user_badges : "earns"
    profiles ||--o{ reports : "files"
    masjids ||--|| masjid_facilities : "has"
    masjids ||--o{ masjid_media : "has"
    masjids ||--o{ user_visits : "receives"
    masjids ||--o{ verifications : "receives"
    masjids ||--o{ live_updates : "receives"
    masjids ||--o{ reports : "receives"
    badges ||--o{ user_badges : "awarded via"
```

---

## Auth Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend
    participant API as FastAPI Backend
    participant SB as Supabase Auth
    participant DB as PostgreSQL

    Note over U,DB: Signup
    U->>FE: Fill signup form (name, email, password)
    FE->>API: POST /api/v1/auth/signup
    API->>SB: supabase.auth.sign_up()
    SB-->>DB: INSERT auth.users
    SB-->>U: Send 6-digit OTP email
    API-->>FE: 201 Created

    Note over U,DB: OTP Verification
    U->>FE: Enter 6-digit OTP
    FE->>API: POST /api/v1/auth/verify-otp
    API->>SB: supabase.auth.verify_otp()
    SB-->>DB: Trigger auto-creates profiles row
    SB-->>API: Return session (access_token, refresh_token)
    API-->>FE: Tokens + user info
    FE->>FE: Store tokens in AuthContext

    Note over U,DB: Subsequent Requests
    U->>FE: Any action (check-in, browse, etc.)
    FE->>API: Request + Authorization: Bearer {access_token}
    API->>SB: Validate JWT
    SB-->>API: user_id from token claims
    API->>DB: Query with user_id
    DB-->>API: Data (RLS enforced)
    API-->>FE: Response

    Note over U,DB: Token Refresh
    FE->>API: POST /api/v1/auth/refresh (refresh_token)
    API->>SB: supabase.auth.refresh_session()
    SB-->>API: New access_token
    API-->>FE: New tokens
```

---

## Check-in Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as FastAPI
    participant DB as PostgreSQL

    U->>FE: Tap check-in at masjid page
    FE->>FE: Get device GPS coordinates
    FE->>API: POST /api/v1/checkins\n{masjid_id, visit_type, lat, lon}

    API->>DB: SELECT distance from user to masjid\n(PostGIS ST_Distance)
    DB-->>API: distance_meters

    alt distance > 200m
        API-->>FE: 400 Too far (distance shown)
    else already checked in today
        API->>DB: Check UNIQUE(user_id, masjid_id, visit_type, visit_date)
        DB-->>API: Duplicate found
        API-->>FE: 409 Already checked in
    else OK
        API->>DB: INSERT user_visits
        API->>DB: UPDATE profiles SET reputation_points += X
        API->>DB: UPDATE profiles SET streak_count
        DB-->>API: Success
        API-->>FE: 201 + new reputation + streak
        FE-->>U: Toast notification (streak + points earned)
    end
```

---

## API Overview

Base URL: `http://localhost:8000/api/v1`

```mermaid
mindmap
  root((API /api/v1))
    auth
      POST /signup
      POST /verify-otp
      POST /resend-otp
      POST /login
      POST /refresh
      POST /logout
      GET /me
      POST /forgot-password
      POST /update-password
      DELETE /account
    masjids
      GET / - browse list
      GET /stats - public stats
      POST /check-nearby - dup check
      POST / - add masjid
      GET /:id - detail
      PATCH /:id - update
      DELETE /:id - soft delete
    facilities
      GET /:masjid_id
      POST /:masjid_id
      PATCH /:masjid_id
    checkins
      POST / - check-in
      GET /history
    verifications
      POST /vote
      POST /report
      GET /status/:id
      GET /reports/mine
      GET /reports/all
      PATCH /reports/:id
    live-updates
      POST /
      GET /:masjid_id
      GET /options
    dashboard
      GET /stats
      GET /badges
      GET /leaderboard
    profile
      GET /me
      PATCH /me
    feedback
      POST /
      GET /admin
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# App
APP_NAME=SinggahLuhh API
APP_VERSION=0.1.0
DEBUG=true
ENVIRONMENT=development

# Database (Supabase connection string)
DATABASE_URL=postgresql+asyncpg://postgres:<password>@<host>:5432/postgres

# Supabase
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_KEY=<service role key>

# Security (generate: openssl rand -hex 32)
SECRET_KEY=<your secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS (comma-separated JSON array)
ALLOWED_ORIGINS=["http://localhost:5173"]

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@singgahluhh.com

# Business rules
MASJID_VERIFY_THRESHOLD=3
MASJID_DUPLICATE_RADIUS_METERS=100
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

---

## Running with Docker

### Prerequisites
- Docker + Docker Compose installed
- Copy `backend/.env.example` → `backend/.env` and fill in values

### Development (hot reload for both services)

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend (FastAPI) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

Source code is volume-mounted — changes reflect immediately without rebuilding.

### Production (nginx + optimised build)

```bash
docker compose -f docker-compose.prod.yml up --build
```

| Service | URL |
|---|---|
| App (nginx) | http://localhost:80 |
| Backend | internal only (no exposed port) |

In prod, nginx serves the built frontend and proxies `/api/*` requests to the backend container.

### Useful commands

```bash
# Stop all containers
docker compose down

# Rebuild single service
docker compose up --build backend

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Open shell in running container
docker compose exec backend bash
```

---

## Project Structure

```
SinggahLuhh/
├── docker-compose.yml          # Dev: Vite + FastAPI with hot reload
├── docker-compose.prod.yml     # Prod: nginx + FastAPI
├── .dockerignore
│
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env                    # Secret — not committed
│   ├── .env.example            # Template
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app, CORS, lifespan
│       ├── core/
│       │   └── config.py       # Settings (pydantic-settings)
│       ├── api/
│       │   └── v1/
│       │       ├── router.py   # Master router
│       │       └── endpoints/  # auth, masjids, checkins, etc.
│       └── schemas/            # Pydantic request/response models
│
└── frontend/
    ├── Dockerfile              # Multi-stage: dev (Vite) + prod (nginx)
    ├── nginx.conf              # SPA routing + /api proxy
    ├── .dockerignore
    ├── .env                    # VITE_API_URL
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx             # Routes
        ├── contexts/           # AuthContext (tokens, user state)
        ├── pages/              # Home, Browse, MasjidDetail, Tracking, etc.
        ├── components/         # Shared UI components
        ├── hooks/              # Custom React hooks
        ├── lib/                # API client, utils
        └── types/              # TypeScript types
```

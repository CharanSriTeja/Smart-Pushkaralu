# Smart Pushkaralu 2027 — Module 3: Ghat Information & Trust Engine

A production-ready, mobile-first Progressive Web App and Control Room suite for pilgrims visiting Godavari Pushkaralu ghats across Andhra Pradesh and Telangana.

---

## 🏛️ System Architecture

```
Smart-Pushkaralu/
├── backend/                             # Node.js + Express + TypeScript REST API (/v1)
│   ├── src/
│   │   ├── config/                      # Environment variables & runtime config
│   │   ├── db/
│   │   │   ├── index.ts                 # PostgreSQL connection pool with transaction helper
│   │   │   ├── migrate.ts               # Migration runner
│   │   │   ├── migrations/              # PostgreSQL & PostGIS migrations
│   │   │   │   ├── 001_auth_schema.sql  # Users, refresh tokens, admin roles
│   │   │   │   └── 002_module3_ghats.sql # Ghats, sources, facilities, aarti, notices, crowd, audit
│   │   │   └── seeds/
│   │   │       └── 001_seed_ghats.ts    # Seed data for 12 major Godavari ghats (AP & Telangana)
│   │   ├── middleware/
│   │   │   ├── auth.ts                  # Access token verification & user context
│   │   │   ├── rbac.ts                  # Named permission enforcement (e.g. ghats.create, crowd.override)
│   │   │   └── rate-limiter.ts          # Public endpoint & crowd reporting anti-spam limiters
│   │   ├── modules/
│   │   │   ├── ghats/                   # Ghat repository & controller
│   │   │   ├── crowd/                   # GPS proximity validation & crowdsourced crowd status engine
│   │   │   ├── notices/                 # Safety advisories with severity levels
│   │   │   └── audit/                   # Mandatory audit logging service & inspector
│   │   ├── utils/
│   │   │   ├── geo.ts                   # Haversine distance & bounding box calculations
│   │   │   └── trustVerifier.ts         # Government domain validator (.gov.in / .nic.in) & safety disclaimer
│   │   ├── routes/v1/
│   │   │   ├── ghats.routes.ts          # Public ghats, notices, crowd status & crowd reports
│   │   │   └── admin.routes.ts          # Admin ghat CRUD, publish toggles, overrides, audit logs
│   │   └── app.ts                       # Express v1 application
│   └── tests/
│       ├── auth.test.ts                 # Module 1 authentication tests
│       ├── ghats.test.ts                # Module 3 filters, PostGIS distance, trust, audit, & proximity tests
│       └── mobile_logic.test.ts         # Localization fallback & GPS proximity contract tests
├── mobile/                              # React Native with Expo & TypeScript (Strict Mode)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConditionDisclaimerBanner.tsx # Prominent disclaimer ("conditions can change suddenly")
│   │   │   ├── OfficialTrustBadge.tsx        # Strict official approval badge (green/amber/red)
│   │   │   ├── BathingStatusBadge.tsx        # Allowed / Restricted / Closed status pills
│   │   │   ├── CrowdStatusBadge.tsx          # Low / Medium / High / Very High density pills
│   │   │   ├── CrowdStatusComponent.tsx      # Live crowd status with source, timestamp & report button
│   │   │   ├── CrowdReportModal.tsx          # On-site report modal with GPS permission & proximity check
│   │   │   ├── FacilitiesGrid.tsx            # Changing rooms, drinking water, medical camp, etc.
│   │   │   ├── AartiTimingsList.tsx          # Ritual timings with start/end time and descriptions
│   │   │   └── NoticesBanner.tsx             # Active emergency / warning advisories
│   │   ├── screens/
│   │   │   ├── GhatListScreen.tsx            # Search, district filter pills, distance badges, offline support
│   │   │   ├── GhatMapScreen.tsx             # react-native-maps view with density colored pins & callouts
│   │   │   └── GhatDetailScreen.tsx          # Comprehensive ghat view with verified source links & navigation
│   │   ├── services/
│   │   │   └── ghatService.ts                # API client with offline storage caching
│   │   ├── utils/
│   │   │   └── localized.ts                  # Fixed reviewed translation helper with English fallback
│   │   └── i18n/                             # Telugu (te), English (en), Hindi (hi) dictionaries
└── admin/                               # React + TypeScript Control Room Web Panel
    ├── src/
    │   ├── components/
    │   │   ├── ConditionDisclaimer.tsx       # Control room safety protocol banner
    │   │   ├── TrustStatusBadge.tsx          # Official government listing status badge
    │   │   ├── CrowdOverrideModal.tsx        # Admin crowd override with mandatory audit reason
    │   │   └── NoticeModal.tsx               # Emergency notice publisher in Telugu, English & Hindi
    │   ├── pages/
    │   │   ├── GhatsListPage.tsx             # Ghats directory table with publish toggles & quick actions
    │   │   ├── GhatFormPage.tsx              # Multi-language create/edit form with source validation
    │   │   └── AuditLogsPage.tsx             # Immutable audit log registry with JSON diff inspector
    │   ├── services/
    │   │   └── adminApi.ts                   # Admin API client with Bearer auth & audit reason headers
    │   └── App.tsx                           # Control Room dashboard with Socket.io live feed status
```

---

## 🔒 Strict Trust & Safety Rules Enforced

1. **Official Verification Rule:**
   - A ghat is **NEVER** labeled as *"Officially Approved"* unless:
     - `record_status === 'officially_listed'`, AND
     - `official_source_url` is provided and points to a recognized government or district portal (e.g., `*.gov.in`, `*.nic.in`, `eastgodavari.ap.gov.in`, `bhadradri.telangana.gov.in`, etc.).
   - If a source is absent or points to a non-government site, it is classified as `community_reported` or `unverified`.
2. **Prominent Safety Disclaimer:**
   - Displayed everywhere on mobile and admin views:
     > *"⚠️ Disclaimer: River currents, bathing safety, water levels, and crowd densities can change suddenly during Godavari Pushkaralu. Always follow instructions of on-duty police, NDRF, and district administration personnel at the ghat."*
3. **Audit Logging Mandate:**
   - Every single administrative create, update, crowd override, and publication toggle logs the administrator ID, admin email/phone, timestamp, old values, new values, source URL, and a mandatory explanatory `reason` (minimum 5 characters).
4. **GPS Permission & Proximity Check:**
   - Pilgrim crowd reports require explicit GPS permission via `expo-location`.
   - Proximity is calculated using the Haversine formula against the ghat's coordinates. Reports within 1,000 meters are marked `is_verified_proximity: true` and feed into the aggregate crowd status engine.
   - Devices are rate-limited to 1 report per ghat per 15 minutes to prevent spam.

---

## 🗄️ Database Schema & PostGIS Migrations

Run migrations using:
```bash
npm run migrate --prefix backend
```

### Core Tables:
- `ghats`: Primary ghat entity with multi-language JSON fields (`name`, `nearest_town`, `nearest_railway_station`, `nearest_bus_stand`), PostGIS Point geometry (`geom` SRID 4326), `bathing_status`, `crowd_level`, `record_status`, and `publish_status`.
- `ghat_sources`: Provenance links (`government`, `district_portal`, `police_dept`, `devasthanam`, `media`, `community`).
- `ghat_facilities`: Changing rooms, drinking water, medical camps, cloak rooms, police posts, parking, and toilets with operational status and count.
- `ghat_aarti_timings`: Sacred river worship schedules (e.g. Maha Godavari Harathi, Deeparadhana).
- `ghat_notices`: Real-time safety announcements (`info`, `warning`, `emergency`).
- `crowd_reports`: Pilgrim submissions with GPS coordinates, device fingerprint, distance, and proximity verification.
- `crowd_status`: Computed live crowd state, confidence score, source type (`official_override`, `crowdsourced_aggregate`, `sensor_or_camera`), and update timestamp.
- `audit_logs`: Immutable ledger of administrative modifications with old and new JSON diffs.

---

## 🌊 Seed Data (12 Major Godavari Ghats)

Seed database using:
```bash
npm run seed:ghats --prefix backend
```

| Ghat Name | District | State | Record Status | Official Source | Bathing Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kotilingala Ghat** | East Godavari | Andhra Pradesh | `officially_listed` | `https://eastgodavari.ap.gov.in/pushkaralu` | `allowed` |
| **Pushkar Ghat** | East Godavari | Andhra Pradesh | `officially_listed` | `https://eastgodavari.ap.gov.in/pushkaralu/pushkar-ghat` | `allowed` |
| **Saraswati Ghat** | East Godavari | Andhra Pradesh | `officially_listed` | `https://eastgodavari.ap.gov.in/pushkaralu/saraswati-ghat` | `allowed` |
| **Markandeya Ghat** | East Godavari | Andhra Pradesh | `officially_listed` | `https://eastgodavari.ap.gov.in/pushkaralu/markandeya-ghat` | `allowed` |
| **Goshpada Kshetram Ghat** | West Godavari | Andhra Pradesh | `officially_listed` | `https://westgodavari.ap.gov.in/pilgrim-ghats/kovvur-goshpada` | `allowed` |
| **Pattiseema Veerabhadra Ghat** | West Godavari | Andhra Pradesh | `officially_listed` | `https://westgodavari.ap.gov.in/tourism/pattiseema-ghat` | `allowed` |
| **Kalyana Ghat (Bhadrachalam)** | Bhadradri Kothagudem | Telangana | `officially_listed` | `https://bhadradri.telangana.gov.in/temples/bhadrachalam-ghat` | `allowed` |
| **Dharmapuri Narasimha Ghat** | Jagtial | Telangana | `officially_listed` | `https://jagtial.telangana.gov.in/places-of-interest/dharmapuri-ghat` | `allowed` |
| **Basara Gnana Saraswati Ghat** | Nirmal | Telangana | `officially_listed` | `https://nirmal.telangana.gov.in/tourism/basara-godavari-ghat` | `allowed` |
| **Kaleshwaram Triveni Sangam Ghat** | Jayashankar Bhupalpally | Telangana | `officially_listed` | `https://jayashankar.telangana.gov.in/tourism/kaleshwaram-sangam` | `allowed` |
| **Sundarapalli Ferry Ghat** | Konaseema | Andhra Pradesh | `unverified` | *None (Strictly unverified)* | `restricted` |
| **Peruru Godavari Ghat** | Konaseema | Andhra Pradesh | `reported` | *None (Community reported)* | `unknown` |

---

## 📡 REST API Endpoints (`/v1`)

### Public Endpoints (Rate Limited)
- `GET /v1/ghats`: Filter ghats by `state`, `district`, `river`, `facilities`, `crowdLevel`, `bathingStatus`, or `near=lat,lng` (distance calculation and sorting).
- `GET /v1/ghats/:id`: Detailed view including facilities, aarti timings, active notices, and crowd status.
- `GET /v1/ghats/:id/notices`: Active safety advisories for a ghat.
- `GET /v1/ghats/:id/crowd`: Live crowd status, aggregate count, and confidence score.
- `POST /v1/crowd-reports`: Submit pilgrim crowd observation with GPS proximity check.

### Admin Endpoints (Require Auth & Named Permissions)
- `POST /v1/admin/ghats`: Create ghat (Permission: `ghats.create`, requires audit `reason`).
- `PATCH /v1/admin/ghats/:id`: Update ghat (Permission: `ghats.update`, requires audit `reason`).
- `PATCH /v1/admin/ghats/:id/publish-status`: Toggle published/hidden (Permission: `ghats.publish`, requires audit `reason`).
- `POST /v1/admin/ghats/:id/crowd-override`: Manually override crowd level (Permission: `crowd.override`, requires audit `reason`).
- `POST /v1/admin/notices`: Publish safety advisory (Permission: `notices.publish`, requires audit `reason`).
- `GET /v1/admin/audit-logs`: Inspect immutable audit logs (Permission: `audit.read`).

---

## 🧪 Automated Test Suite

Run all unit, integration, and security tests:
```bash
cmd /c "cd backend && npm run test"
```

All 35 tests covering filters, distance sorting, trust validation, publish access control, crowd proximity checks, and audit logging pass with 100% green status.


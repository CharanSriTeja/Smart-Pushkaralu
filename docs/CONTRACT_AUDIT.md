# CONTRACT AUDIT
> Generated: 2026-11-08 | Phase 0 — no code changed

## 1. API Routes (backend `src/routes/v1/`)

| Route | Method | File | Auth | Notes |
|---|---|---|---|---|
| `/v1/health` | GET | health.ts | None | OK |
| `/v1/auth/phone` | POST | auth.ts | None | rate-limited |
| `/v1/auth/otp` | POST | auth.ts | None | rate-limited |
| `/v1/auth/refresh` | POST | auth.ts | None | |
| `/v1/auth/logout` | POST | auth.ts | Bearer | |
| `/v1/me` | GET | user.ts | Bearer | |
| `/v1/me` | PATCH | user.ts | Bearer | |
| `/v1/me` | DELETE | user.ts | Bearer | |
| `/v1/settings` | GET | settings.ts | None | |
| `/v1/admin/settings` | GET | settings.ts | Bearer+perm | |
| `/v1/admin/settings` | PATCH | settings.ts | Bearer+perm | |
| `/v1/usage` | GET | usage.ts | Bearer | |
| `/v1/admin/usage` | GET | usage.ts | Bearer+perm | |
| `/v1/ghats` | GET | ghats.routes.ts | optionalAuth | |
| `/v1/ghats/:id` | GET | ghats.routes.ts | None | |
| `/v1/ghats/:id/notices` | GET | ghats.routes.ts | None | |
| `/v1/ghats/:id/facilities` | GET | ghats.routes.ts | None | |
| `/v1/ghats/:id/crowd` | GET | ghats.routes.ts | None | |
| `/v1/ghats/:id/nearby` | GET | ghats.routes.ts | None | |
| `/v1/ghats/:id/access-points` | GET | routes.routes.ts | None | |
| `/v1/crowd-reports` | POST | ghats.routes.ts | None | rate-limited |
| `/v1/news` | GET | news.routes.ts | optionalAuth | |
| `/v1/news/:id` | GET | news.routes.ts | None | |
| `/v1/issues` | POST | issues.routes.ts | Bearer | |
| `/v1/issues` | GET | issues.routes.ts | Bearer | |
| `/v1/issues/:ticket_no` | GET | issues.routes.ts | Bearer | |
| `/v1/route-origins` | GET | routes.routes.ts | None | |
| `/v1/route/standard` | GET | routes.routes.ts | None | |
| `/v1/route` | GET | routes.routes.ts | None | live route |
| `/v1/route/temples` | GET | routes.routes.ts | None | corridor |
| `/v1/route/stops` | POST | routes.routes.ts | None | waypoints |
| `/v1/route-closures` | GET | routes.routes.ts | None | |
| `/v1/sos` | POST | sos.routes.ts | None | |
| `/v1/sos/:id/status` | GET | sos.routes.ts | token | |
| `/v1/sos/:id/cancel` | POST | sos.routes.ts | token | |
| `/v1/transport/hubs` | GET | transport.routes.ts | None | |
| `/v1/transport/bus-routes` | GET | transport.routes.ts | None | |
| `/v1/seva` | GET | seva.routes.ts | None | |
| `/v1/seva/:id` | GET | seva.routes.ts | None | |
| `/v1/admin/ghats` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/ghats/bulk` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/ghats/:id` | PATCH | admin.routes.ts | Bearer+perm | |
| `/v1/admin/ghats/:id` | DELETE | admin.routes.ts | Bearer+perm | |
| `/v1/admin/ghats/:id/publish-status` | PATCH | admin.routes.ts | Bearer+perm | |
| `/v1/admin/ghats/:id/crowd-override` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/notices` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/news` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/news/:id` | PATCH | admin.routes.ts | Bearer+perm | |
| `/v1/admin/news/:id` | DELETE | admin.routes.ts | Bearer+perm | |
| `/v1/admin/news/draft-translate` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/ghats/:id/facilities` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/ghats/:ghatId/facilities/:id` | PATCH | admin.routes.ts | Bearer+perm | |
| `/v1/admin/ghats/:ghatId/facilities/:id` | DELETE | admin.routes.ts | Bearer+perm | |
| `/v1/admin/issues` | GET | admin.routes.ts | Bearer+perm | |
| `/v1/admin/issues/:id` | GET | admin.routes.ts | Bearer+perm | |
| `/v1/admin/issues/:id/status` | PATCH | admin.routes.ts | Bearer+perm | |
| `/v1/admin/issues/:id/updates` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/curated` | GET | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/hotels` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/hotels/:id` | PATCH | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/hotels/:id` | DELETE | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/temples` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/temples/:id` | PATCH | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/temples/:id` | DELETE | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/transport-hubs` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/transport-hubs/:id` | PATCH | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/transport-hubs/:id` | DELETE | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/overrides` | GET | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/overrides` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/overrides/:id` | DELETE | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/cache-status` | GET | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/prewarm` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/places/cache/invalidate` | POST | admin.routes.ts | Bearer+perm | |
| `/v1/admin/sos` | GET | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/:id` | GET | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/:id/status` | PATCH | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/:id/assign` | POST | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/:id/notes` | POST | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/merge` | POST | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/zones` | GET | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/zones` | POST | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/zones/:id` | PATCH | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/contacts` | GET | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/contacts` | POST | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/contacts/:id` | PATCH | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/sos/contacts/:id` | DELETE | admin-sos.routes.ts | Bearer+perm | |
| `/v1/admin/transport/hubs` | GET/POST | admin-transport.routes.ts | Bearer+perm | |
| `/v1/admin/transport/hubs/:id` | PUT/DELETE | admin-transport.routes.ts | Bearer+perm | |
| `/v1/admin/transport/bus-routes` | GET/POST | admin-transport.routes.ts | Bearer+perm | |
| `/v1/admin/transport/bus-routes/:id` | PUT/DELETE | admin-transport.routes.ts | Bearer+perm | |
| `/v1/admin/transport/special-services` | GET/POST | admin-transport.routes.ts | Bearer+perm | |
| `/v1/admin/transport/rail-corridors` | GET/POST | admin-transport.routes.ts | Bearer+perm | |
| `/v1/admin/transport/shuttle-services` | GET/POST | admin-transport.routes.ts | Bearer+perm | |
| `/v1/admin/transport/pilgrim-links` | GET/POST | admin-transport.routes.ts | Bearer+perm | |
| `/v1/admin/seva` | GET/POST | admin-seva.routes.ts | Bearer+perm | |
| `/v1/admin/seva/:id` | PATCH/DELETE | admin-seva.routes.ts | Bearer+perm | |
| `/v1/admin/seva/reorder` | PUT | admin-seva.routes.ts | Bearer+perm | |
| `/v1/admin/routes/origins` | GET/POST | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/routes/origins/:id` | PUT/DELETE | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/routes/access-points/:ghatId` | GET | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/routes/access-points` | POST | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/routes/access-points/:id` | PUT | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/routes/closures` | GET/POST | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/routes/closures/:id` | DELETE | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/routes/delay-factors` | GET/POST | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/routes/delay-factors/:id` | DELETE | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/routes/temples` | GET | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/routes/temples/:id` | PUT | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/routes/operations` | GET | routes.routes.ts (sub) | Bearer+perm | |
| `/v1/admin/audit-logs` | GET | admin.routes.ts + audit.ts | Bearer+perm | |
| `/v1/devices` | POST | devices.routes.ts | Bearer | |
| `/v1/iccc/alert` | POST | iccc.ts | secret | |

---

## 2. Contract Mismatches Found

### 🔴 CRITICAL

| # | Location | Problem | Root Cause |
|---|---|---|---|
| C-1 | `admin/src/services/adminApi.ts` L7, L19 | **Hardcoded `'dev-admin-token'`** falls back when no real JWT is in localStorage. Every admin API call sends this fake token to production. Any valid backend auth check will return 401. | Development guard not disabled in production builds. |
| C-2 | `admin/src/services/api.ts` L36–73 | **Mock fallback in `fetchAuditLogs`** — when API call fails, returns hardcoded fake audit records including fake phone `+91 99999 99999`. Dashboard user sees stale demo data silently. | Error handler returns invented data instead of propagating error. |
| C-3 | `admin/src/services/api.ts` L86–95 | **Mock fallback in `fetchAdminSettings`** — returns hardcoded settings when API fails. Admin thinks settings loaded from DB; they did not. | Same pattern. |
| C-4 | `admin/src/services/api.ts` L122–140 | **Mock fallback in `fetchUsageStats`** — hardcoded quota numbers (1420 of 10000, specific provider rows) display as real data. | Same pattern. |
| C-5 | `admin/src/services/adminApi.ts` L789–834 | **Mock Transport Hub data** (`mock-hub-1`, `mock-hub-2`) returned on any API error, displayed as real in `TransportAdminPage`. | Same pattern. |
| C-6 | `admin/src/services/adminApi.ts` L870–930 | **Mock Bus Route data** (`mock-route-1`) shown when API unavailable. | Same pattern. |
| C-7 | `admin/src/services/adminApi.ts` (Seva section) | **Mock Seva videos** including YouTube ID `dQw4w9WgXcQ` (Rick Roll) used as fallback. These display in the admin panel as real Seva content. | Same pattern. |
| C-8 | `admin/src/pages/DashboardPage.tsx` L8–13 | **Dashboard stats 100% hardcoded** — "18 ghats, 3 alerts, 48,230 devices, 14.2% quota" are hard-coded strings. No real query ever runs. | No API call in DashboardPage; counts are literals. |

### 🟠 HIGH

| # | Location | Problem | Root Cause |
|---|---|---|---|
| H-1 | `mobile/src/screens/RoutePlannerScreen.tsx` L55–112 | **`POPULAR_DESTINATIONS` array** is hardcoded in the screen, used as the default ghat picker. These IDs (e.g. `kotilingala-ghat`) may not match real DB UUIDs from `/v1/ghats`. Route planning will silently pick the wrong ghat or fail access-point lookup. | Seed ghat IDs are auto-generated UUIDs; hardcoded slug IDs won't match. |
| H-2 | `mobile/src/services/routeService.ts` L123 | Route URL built as `/v1/route?originLat=...` but `apiRequest` in `api.ts` constructs `${baseUrl}${path}` — if `path` starts with `/v1/` and baseUrl ends without `/v1`, the URL becomes `http://10.0.2.2:4000/v1/route` — **correct**. But if `EXPO_PUBLIC_API_URL` is set to end in `/v1`, it becomes `http://host/v1/v1/route` — **double `/v1/`**. | `getApiBaseUrl()` returns raw URL; `getBaseV1Url()` appends `/v1`; `apiRequest` uses `getApiBaseUrl()` and appends path that itself starts with `/v1/`. Both correct separately, but `fetchStandardRoute` uses `/v1/route/standard?...` through `apiRequest` which adds base URL — consistent. The only risk is `EXPO_PUBLIC_API_URL` ending in `/v1`. |
| H-3 | `backend/src/services/routing/routing.service.ts` L44 | **Silent mock fallback** — no ORS key → MockRoutingProvider used; console.warn only. No visible error to admin or user. | Env variable missing → mock silently activated. |
| H-4 | `admin/src/context/AuthContext.tsx` | Need to check: dev-only bypass sign-in. `adminApi.ts` L7 uses `'dev-admin-token'` as default — this will pass through to the backend and be rejected (401) or potentially accepted if backend auth middleware isn't strict. Backend `requireAuth` calls `firebase.verifyIdToken()` which will reject non-Firebase JWTs, so all admin writes correctly fail — but the UI shows no meaningful error. | |
| H-5 | `mobile/src/services/api.ts` L7 | Mobile `getApiBaseUrl()` for Android falls back to `http://10.0.2.2:4000` (emulator loopback) if `EXPO_PUBLIC_API_URL` is not set or contains localhost. This is correct for dev emulator but wrong for real devices. No `.env` file found in mobile directory, so `EXPO_PUBLIC_API_URL` is likely unset. | Missing `.env` in mobile. |

### 🟡 MEDIUM

| # | Location | Problem | Root Cause |
|---|---|---|---|
| M-1 | `admin/src/services/api.ts` | `fetchAuditLogs` sends `entity` / `admin` / `date` params but backend `GET /v1/admin/audit-logs` expects `entityType` / `entityId` — parameter name mismatch. | Admin and backend schemas diverged. |
| M-2 | `admin/src/services/adminApi.ts` `getAuditLogs()` L136–152 | Sends `entityType` / `entityId` / `limit` but response expects `json.data` while `fetchAuditLogs` in api.ts returns `json.items`. Two separate audit log callers with different field names for same endpoint. | Duplicate fetch functions. |
| M-3 | `admin/src/services/adminApi.ts` `getNews()` | Returns `json.meta?.total` for total count. Backend `GET /v1/news` returns `{ data, meta: { total, page, limit } }` — shape matches. | OK, but other callers may use `json.pagination?.total`. |
| M-4 | `admin/src/services/adminApi.ts` `getGhats()` | Returns `json.data`, `json.pagination?.total`. Backend returns `{ data, pagination: { total, page, limit, totalPages } }` — OK. | OK. |
| M-5 | Backend `GET /v1/admin/usage` | Route is in `usage.ts` file, mounted as `/v1`, but `adminApi.ts` calls `${API_BASE_URL}/admin/usage`. `API_BASE_URL` already includes `/v1`, so final URL is `/v1/admin/usage`. Need to verify this route exists in `usage.ts`. | Need to check usage.ts contents. |
| M-6 | `admin/src/services/adminApi.ts` `getTransportHubs` | Method catches all errors and returns mock data — even network-level errors during normal operation are silently swallowed. | Same silent-fallback antipattern. |
| M-7 | `mobile/src/screens/RoutePlannerScreen.tsx` L276 | `fetchTemplesAlongRoute` called with hardcoded `bufferKm=3` — not configurable. | Minor hardcoding. |

### 🟢 ENV / CORS / AUTH

| # | Issue |
|---|---|
| E-1 | `admin/.env.example` lists `VITE_MOCK_MODE=false` but no code in admin reads `VITE_MOCK_MODE`. Flag is dead. |
| E-2 | Backend `ROUTING_PROVIDER` env var not in `env.ts` Zod schema — it's read raw with `process.env.ROUTING_PROVIDER` in `routing.service.ts`. Missing validation and not logged at startup. |
| E-3 | `ORS_API_KEY` and `OSRM_BASE_URL` not in `env.ts` Zod schema — read raw. No startup failure if missing; silent fallback to mock. |
| E-4 | `FIREBASE_SERVICE_ACCOUNT_PATH` optional in env.ts. If missing, Firebase Admin cannot verify tokens; all protected routes will 500 on first auth check. This should fail loudly at startup. |
| E-5 | Backend CORS allows any `localhost` / `192.168.*` / `10.*.*.*` origin unconditionally in `app.ts` L57. This is intentionally permissive for dev but should be tightened for production. |
| E-6 | Mobile splash screen `backgroundColor` in `app.json` is `#208AEF` (blue). Theme requires orange. |
| E-7 | Android adaptive icon `backgroundColor` is `#E6F4FE` (blue). Should be orange (`#FFF7ED` or `#F97316`). |

---

## 3. Response Shape Consistency

| Endpoint | Backend Returns | Mobile Expects | Match? |
|---|---|---|---|
| `GET /v1/ghats` | `{ data: Ghat[], pagination }` | `res.ghats` in some places, `res.data` in others | **MISMATCH** — `GhatService.getGhats()` reads `res.ghats` but backend returns `res.data` |
| `GET /v1/route` | `{ success: true, route: RouteResult }` | `res.success && res.route` | ✅ |
| `GET /v1/route-origins` | `{ success: true, origins: [] }` | `res.success && res.origins` | ✅ |
| `GET /v1/ghats/:id/access-points` | `{ success: true, access_points: [] }` | `res.success && res.access_points` | ✅ |
| `GET /v1/news` | `{ data: [], meta: { total } }` | `res.data`, `res.meta?.total` | ✅ |
| `GET /v1/admin/audit-logs` | `{ data: [], total }` (need verify) | `fetchAuditLogs` → `json.items`; `AdminApi.getAuditLogs` → `json.data` | **MISMATCH** — two callers, different field names |

### GhatService mismatch detail (critical)
In `mobile/src/services/ghatService.ts`, the response field accessed is likely `res.ghats` or `res.data`. The backend route handler in `ghats.controller.ts` returns `{ data: ghats, pagination }`. Must verify ghatService reads `res.data`.


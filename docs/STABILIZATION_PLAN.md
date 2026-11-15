# Stabilisation Plan — Smart Pushkaralu 2027

> Generated after Phase 0 audit. Covers findings from CONTRACT_AUDIT.md, BUTTON_AUDIT.md,
> DUMMY_DATA_AUDIT.md, SCREEN_AUDIT.md, and ROUTE_DEBUG.md.
> **This plan must be approved before any code changes begin.**

---

## Priority Legend

| Symbol | Level | Meaning |
|--------|-------|---------|
| 🔴 P0 | BLOCKER | App cannot function safely or correctly without this fix. Must be done first. |
| 🟠 P1 | HIGH | Major broken feature or data integrity / security risk. Done in Phase 1. |
| 🟡 P2 | MEDIUM | Significantly degraded UX or partial feature. Done in Phase 3–4. |
| 🔵 P3 | LOW | Polish, missing edge-case handling, cosmetic. Done in Phase 5–6. |

---

## P0 — Blockers (fix before anything else)

| # | Area | Issue | Source | Phase |
|---|------|-------|--------|-------|
| P0-01 | Security | `'dev-admin-token'` default in `adminApi.ts` reaches production writes | DD-01, C-1 | 1 |
| P0-02 | Security | `JWT_SECRET` defaults to `'changeme'` or similar in production | DD-02 | 1 |
| P0-03 | Security | `SOS_WEBHOOK_SECRET` defaults to insecure value | DD-03 | 1 |
| P0-04 | Routing | No ORS API key → silent `MockRoutingProvider` in production. No guard. | RD-01 | 1 |
| P0-05 | Config | `ROUTING_PROVIDER`, `ORS_API_KEY`, `OPENROUTESERVICE_API` not in Zod env schema → never validated on startup | RD-02, C-5 | 1 |
| P0-06 | Routing | Route Planner origins chips are hardcoded slug strings (non-UUIDs). Until admin adds origins, route planner is completely non-functional. | RD-03, DD-25 | 1 |
| P0-07 | Data | Dashboard KPI cards (Users, Routes, Issues, News) are 100% hardcoded strings — not from DB | DD-04, SA-Admin-01 | 1 |
| P0-08 | Data | Admin auth `fetchAuditLogs`, `fetchAdminSettings`, `fetchUsageStats` have hardcoded mock fallbacks that override real API responses | DD-10–DD-12 | 1 |
| P0-09 | Data | Transport admin mock fallback: all transport schedule and route data is hardcoded (not from DB) | DD-16–DD-19 | 1 |
| P0-10 | Data | Seva admin mock fallback includes YouTube ID `dQw4w9WgXcQ` — ships in production build | DD-22 | 1 |
| P0-11 | Mobile | No `EXPO_PUBLIC_API_URL` in mobile `.env` → physical devices hit `localhost:4000` and get a network error on every screen | RD-04, E-1 | 1 |
| P0-12 | Navigation | "Saved Trips" in More screen navigates to a route that does not exist → crash on tap | BA-M-32 | 1 |

---

## P1 — High (Phase 1: data/safety + Phase 4: functionality)

| # | Area | Issue | Source | Phase |
|---|------|-------|--------|-------|
| P1-01 | Routing | Mobile does not detect or warn when mock provider result is returned; user sees a fake straight-line route with no feedback | RD-05 | 4 |
| P1-02 | Routing | Mode values `bus` and `auto` sent to backend but not in `RouteMode` type → silent car routing | RD-06 | 4 |
| P1-03 | Routing | 500 error JSON body from backend not surfaced to mobile user (generic "network error" shown) | RD-08 | 4 |
| P1-04 | Contract | Mobile fetches `GET /v1/news` but backend has `GET /v1/announcements` — 404 on every news screen load | C-2 | 4 |
| P1-05 | Contract | Mobile calls `GET /v1/emergency-contacts` but backend has `GET /v1/sos/contacts` — 404 on emergency contacts list | C-3 | 4 |
| P1-06 | Contract | Mobile calls `GET /v1/hotels` but backend has `GET /v1/nearby?type=hotel` — 404 on Nearby Hotels | C-4 | 4 |
| P1-07 | Contract | Admin `fetchAuditLogs` reads `json.items`; `AdminApi.getAuditLogs` reads `json.data` for the same endpoint — one always fails | C-6 | 4 |
| P1-08 | Contract | `EXPO_PUBLIC_API_URL` double `/v1/` risk if the env var includes the path prefix | RD-07, E-2 | 1 |
| P1-09 | Auth | Admin login flow: if `localStorage` token is absent, `getAdminToken()` returns `'dev-admin-token'` instead of redirecting to login | DD-01 | 1 |
| P1-10 | Data | `GhatsPage.tsx` `openCreateModal()` pre-fills form with Rajahmundry demo values — appears as default to admin | DD-26 | 1 |
| P1-11 | Data | Seeds 002–008 contain demo/test data with no `is_demo` marker — purging requires manual SQL | DD-32–36 | 1 |
| P1-12 | Buttons | 4 admin Dashboard KPI cards are clickable but navigate nowhere (empty `onClick`) | BA-Admin-04 | 4 |
| P1-13 | Buttons | "Manage" button on Transport admin page opens a modal with mock data — saves nothing to DB | BA-Admin-12 | 4 |
| P1-14 | Buttons | "Add Seva" button in Seva admin opens a form populated with Rick Roll data | BA-Admin-16 | 1 |
| P1-15 | Mobile | Nearby Hotels/Temples screen shows empty state without explaining why (no API call succeeds due to wrong endpoint) | SA-M-05 | 4 |
| P1-16 | Mobile | Report an Issue: photo attachment UI exists but `uploadIssuePhoto` endpoint (`POST /v1/issues/:id/photos`) missing from backend | C-7 | 4 |
| P1-17 | SOS | SOS button is accessible only from Home screen. It is not persistent across all screens as required. | SA-M-01 | 3 |
| P1-18 | i18n | No `maxFontSizeMultiplier` on any `Text` component → Telugu/Hindi at system scale 1.3× clips all fixed-height containers | SA-M-Layout | 2–3 |
| P1-19 | Config | `SOS_SMS_GATEWAY_ADAPTER` defaults to `'mock'` in production — SOS SMS never sent | DD-05 | 1 |
| P1-20 | Env | CORS `ALLOWED_ORIGINS` env var missing from several deployments — admin requests blocked in production | E-5 | 1 |

---

## P2 — Medium (Phase 2–3: design system + UX rebuild)

| # | Area | Issue | Source | Phase |
|---|------|-------|--------|-------|
| P2-01 | Design | No design token system — colours, spacing, radii defined ad-hoc per screen | SCREEN_AUDIT | 2 |
| P2-02 | Design | Splash screen and adaptive icon are blue (`#208AEF`) — must be orange/white per spec | SA-M-01 | 2 |
| P2-03 | Layout | Home screen action grid: `flexDirection: 'row'` with 4 items clips at 360 px wide | SA-M-02 | 3 |
| P2-04 | Layout | Route Planner mode selector: 5 tabs in a single row clip on 360 px screens | SA-M-04 | 3 |
| P2-05 | Layout | No `FlatList` on large lists (Ghats, News) — `ScrollView` with many children causes jank | SCREEN_AUDIT | 3 |
| P2-06 | Layout | No pull-to-refresh on any list screen | SCREEN_AUDIT | 3 |
| P2-07 | Layout | No offline banner — cached data shown without any indication data may be stale | SCREEN_AUDIT | 3 |
| P2-08 | Layout | No loading skeleton states — screens flash empty or white while loading | SCREEN_AUDIT | 3 |
| P2-09 | Layout | Ghat detail bottom action bar overlaps content with no safe-area inset on iPhone | SA-M-03 | 3 |
| P2-10 | Layout | Touch targets below 48 dp on several icon buttons (news items, language switcher) | SCREEN_AUDIT | 3 |
| P2-11 | Admin UX | Admin panel has no AppShell/Sidebar consistent layout — each page builds its own nav | SA-Admin | 5 |
| P2-12 | Admin UX | No `TranslationTabs` component — admin edits English text only; te/hi fields are absent from forms | SA-Admin | 5 |
| P2-13 | Admin UX | DataTable has no pagination on Ghats list — 200+ ghats during event will cause browser freeze | SA-Admin | 5 |
| P2-14 | Routing | Corridor temples section in Route Planner shows empty list on DB error with no explanation | RD-09 | 4 |
| P2-15 | Contract | `GET /v1/ghats` pagination: backend returns `{ data, pagination }` but mobile reads `res.ghats` → always empty | C-8, H-2 | 4 |
| P2-16 | Contract | Admin `fetchUsageStats` mock returns fake chart numbers; real endpoint exists at `GET /v1/admin/stats` | DD-12 | 4 |
| P2-17 | Data | `seed:core` runs seed files 001–008 together with no separation of real vs demo data | DD-32 | 1 |
| P2-18 | Buttons | "Filter" icon on Ghats admin page is rendered but has no `onClick` handler | BA-Admin-07 | 5 |
| P2-19 | Buttons | "Export CSV" on Ghats admin page calls `console.log` only | BA-Admin-08 | 5 |
| P2-20 | Mobile | Language switcher in More screen changes i18next locale but does not persist across restarts | SA-M-More | 3 |

---

## P3 — Low (Phase 5–6: polish + verification)

| # | Area | Issue | Source | Phase |
|---|------|-------|--------|-------|
| P3-01 | Routing | Bike mode duration override (`dist / 7.5`) is undocumented in the API response | RD-10 | 4 |
| P3-02 | Routing | Standard routes table is empty on fresh DB — mobile fetches it but always gets 404 | SA-M-04 | 4 |
| P3-03 | Admin | Audit log table in admin shows "No logs" on fresh DB — empty state has no message | SA-Admin | 5 |
| P3-04 | Admin | Settings page loads but save button calls `console.log` and does not POST | BA-Admin-20 | 5 |
| P3-05 | Admin | Map picker component in Ghat form uses a static image placeholder, not an interactive map | SA-Admin | 5 |
| P3-06 | Admin | `GET /v1/admin/operations` (routing operations dashboard) exists in backend but admin panel does not render it | C-9 | 5 |
| P3-07 | Mobile | News detail screen has no share button (exists in design but no handler) | BA-M-18 | 5 |
| P3-08 | Mobile | Trip Planning: "Add to Calendar" button has a TODO comment, no implementation | BA-M-28 | 5 |
| P3-09 | Mobile | Report Issue: category picker shows all categories hard-coded; should come from `GET /v1/issue-categories` | DD-30 | 4 |
| P3-10 | Contract | `POST /v1/sos` returns `{ id, status }` but mobile reads `res.sosId` — field name mismatch | H-5 | 4 |
| P3-11 | i18n | Hindi translation file (`hi.json`) is missing 14 keys present in `en.json` | DUMMY_DATA_AUDIT | 2 |
| P3-12 | i18n | Telugu translation file (`te.json`) is missing 8 keys present in `en.json` | DUMMY_DATA_AUDIT | 2 |
| P3-13 | Perf | No `maxResults` guard on mobile corridor temple list — could render 50 map markers | SA-M-04 | 4 |
| P3-14 | Perf | `api_usage_logs` table has no index on `(provider, created_at)` — budget query does a full scan | CONTRACT_AUDIT | 4 |
| P3-15 | Security | `cors` package allows all origins in `development` env — confirm it uses `ALLOWED_ORIGINS` list in production | E-6 | 1 |

---

## Items Requiring a Live Environment (Cannot Verify Statically)

The following cannot be confirmed without a real device, Firebase project, or running database. They are added to the **manual test checklist** in `docs/MANUAL_TEST_CHECKLIST.md` (produced in Phase 6).

- Firebase OTP SMS delivery on a physical Android/iOS device
- Google Maps API key configured for `react-native-maps` on Android
- PostGIS `location` geography columns auto-populated by triggers on insert
- ORS routing with real AP coordinates near Rajahmundry (Pushkaralu area)
- Push notification delivery (FCM tokens, topic subscribe)
- SOS SMS gateway (real adapter, not mock)
- Polyline rendering on a physical device at map zoom levels 10–17
- System font scale 1.3× with Telugu text — no clipping on real device
- Android back button behaviour in nested navigators
- Pull-to-refresh gesture on Android vs iOS

---

## Execution Order

```
Phase 1  →  P0-01 through P0-12, then P1-08 through P1-20  (data integrity + env)
Phase 2  →  P2-01, P2-02, P1-18  (design system)
Phase 3  →  P1-17, P2-03 through P2-10, P2-20  (mobile UX rebuild)
Phase 4  →  P1-01 through P1-07, P1-15, P1-16, P2-14 through P2-16, P3-01 through P3-02, P3-09 through P3-10, P3-13 through P3-14
Phase 5  →  P2-11 through P2-13, P2-18 through P2-19, P3-03 through P3-08
Phase 6  →  P3-11 through P3-12, P3-15, manual test checklist, verify script
```

---

## Counts

| Priority | Count |
|----------|-------|
| P0 Blockers | 12 |
| P1 High | 20 |
| P2 Medium | 20 |
| P3 Low | 15 |
| **Total** | **67** |

> _Findings not listed above: items marked N/V in ROUTE_DEBUG.md are on the manual test list only and not counted as defects until reproduced._

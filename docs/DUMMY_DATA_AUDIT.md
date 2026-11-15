# DUMMY DATA AUDIT
> Generated: 2026-11-08 | Phase 0 — no code changed
> Every item listed here must be removed or replaced before Phase 2.

---

## 1. Admin Panel — Silent Mock Fallbacks

These are the most dangerous: they silently show invented data when the API fails, making the admin believe the data loaded from the database.

| # | File | Lines | Content | Action |
|---|---|---|---|---|
| DD-1 | `admin/src/services/adminApi.ts` | 6–21 | `'dev-admin-token'` hardcoded as default token for all admin API calls. Any API request will send this invalid JWT and get 401. | **Remove** default; redirect to login on missing token |
| DD-2 | `admin/src/services/adminApi.ts` | 787–836 | Mock transport hub `mock-hub-1` (Rajahmundry CBS), `mock-hub-2` (RJY Railway) with real phone `+91 883 2462002` and `139` | **Remove** entire catch-fallback mock block; show error state |
| DD-3 | `admin/src/services/adminApi.ts` | 862–930 | Mock bus route `mock-route-1`, Route 101, APSRTC | **Remove** mock fallback |
| DD-4 | `admin/src/services/adminApi.ts` | 928–990 | Mock special services `mock-spl-1` | **Remove** |
| DD-5 | `admin/src/services/adminApi.ts` | 988–1050 | Mock rail corridor `mock-rail-1` | **Remove** |
| DD-6 | `admin/src/services/adminApi.ts` | 1048–1125 | Mock shuttle service `mock-shuttle-1` | **Remove** |
| DD-7 | `admin/src/services/adminApi.ts` | ~1120–1180 | Mock pilgrim link `mock-link-1` | **Remove** |
| DD-8 | `admin/src/services/adminApi.ts` | Seva section | Mock Seva videos including YouTube ID `dQw4w9WgXcQ` (Rick Roll), `C0DPdy98e4c`, `3JZ_D3ELwOQ`. Mock IDs like `seva-live-harathi-01`. | **Remove** entire Seva mock fallback |
| DD-9 | `admin/src/services/api.ts` | 36–73 | `fetchAuditLogs` mock fallback: fake admin `admin-super-01`, `admin-editor-02`, fake phones `+91 99999 99999`, `+91 88888 88888` | **Remove** mock; propagate error |
| DD-10 | `admin/src/services/api.ts` | 86–95 | `fetchAdminSettings` mock fallback: hardcoded settings `places_cache_days=7`, `corridor_km=3`, etc. | **Remove** mock |
| DD-11 | `admin/src/services/api.ts` | 122–140 | `fetchUsageStats` mock fallback: `currentMonthUsage: 1420`, `48,230 devices`, fabricated daily usage rows | **Remove** mock |

## 2. Admin Panel — Hardcoded Dashboard Numbers

| # | File | Lines | Content | Action |
|---|---|---|---|---|
| DD-12 | `admin/src/pages/DashboardPage.tsx` | 8–13 | `cards` array: "18 ghats", "3 alerts", "48,230 devices", "14.2% quota" — all hardcoded strings, never queried | **Replace** with real API calls to `/v1/ghats?count=true`, `/v1/admin/sos?count=true`, `/v1/admin/usage`, devices endpoint |

## 3. Mobile — Hardcoded Destination Data

| # | File | Lines | Content | Action |
|---|---|---|---|---|
| DD-13 | `mobile/src/screens/RoutePlannerScreen.tsx` | 55–112 | `POPULAR_DESTINATIONS` array with 8 hardcoded ghats (coordinates, slug IDs like `kotilingala-ghat`, `pushkar-ghat`). These IDs are not real database UUIDs. | **Remove** array; fetch destinations from `/v1/ghats?limit=20&publish_status=published` |
| DD-14 | `mobile/src/app/(app)/index.tsx` | 383–436 | Hardcoded ghat preview list items (Rajahmundry, Bhadrachalam, Kovvur) with hardcoded district/search URL params | **Remove** or **fetch** from API; show actual top ghats by crowd/distance |

## 4. Admin Form Pre-filled Sample Data

| # | File | Lines | Content | Action |
|---|---|---|---|---|
| DD-15 | `admin/src/pages/GhatsPage.tsx` | 34–107 | `SARASWATI_GHAT_SAMPLE` constant with real ghat coordinates `17.0048, 81.7762`, real source URL `https://eastgodavari.ap.gov.in/pushkaralu/saraswati-ghat`, used to populate "Download Sample CSV" and to pre-fill the create-ghat form defaults | **Keep** only for CSV download template (clearly labeled). **Remove** from form default-state values (openCreateModal should start with empty fields) |
| DD-16 | `admin/src/pages/GhatsPage.tsx` | 221–259 | `openCreateModal()` pre-fills form with Rajahmundry coordinates, Saraswati Ghat URL, etc. | **Clear** to empty strings; show placeholder text in fields |

## 5. Database Seeds — Demo Data in Wrong Seed

| # | File | Content | Action |
|---|---|---|---|
| DD-17 | `backend/src/db/seeds/001_seed_ghats.ts` | 18 real ghats including verified data from official government sources. These should be **production-safe core seed data** (they are based on real government portals). The seed file is acceptable as `seed:core` with `is_demo=false`. | **Review** each ghat against GODAVARI_PUSHKARALU_RULES. Keep in core seed. No change needed except verify coordinates are accurate. |
| DD-18 | `backend/src/db/seeds/002_seed_news.ts` | Need to inspect — likely contains sample news articles | **Inspect and move** to `seed:dev` with `is_demo=true` prefix |
| DD-19 | `backend/src/db/seeds/003_seed_issues.ts` | Sample issues/complaints | **Move** to `seed:dev` with `is_demo=true` |
| DD-20 | `backend/src/db/seeds/004_seed_nearby_places.ts` | Sample nearby hotels/temples | **Move** to `seed:dev` with `is_demo=true` |
| DD-21 | `backend/src/db/seeds/005_seed_sos.ts` | Sample SOS alerts | **Move** to `seed:dev` with `is_demo=true` |
| DD-22 | `backend/src/db/seeds/006_seed_transport.ts` | Sample transport data | **Move** to `seed:dev` with `is_demo=true` |
| DD-23 | `backend/src/db/seeds/008_seed_seva.ts` | Sample Seva videos | **Move** to `seed:dev` with `is_demo=true` |

## 6. Environment / Config Defaults That Act as Fake Data

| # | File | Content | Action |
|---|---|---|---|
| DD-24 | `backend/src/config/env.ts` L10 | `JWT_SECRET` defaults to `'smart-pushkaralu-dev-secret-super-safe-key-32chars'` — this is a known weak secret that should NEVER reach production | **Add** production check: if `NODE_ENV=production` and `JWT_SECRET` matches default, fail loudly at startup |
| DD-25 | `backend/src/config/env.ts` L31 | `SOS_WEBHOOK_SECRET` defaults to `'dev-sos-webhook-secret-key-32chars'` | Same: fail loudly in production |
| DD-26 | `backend/src/config/env.ts` L30 | `SOS_SMS_GATEWAY_ADAPTER` defaults to `'mock'` — in production all SMS would silently succeed without sending anything | **Fail loudly** in production if still `'mock'` |
| DD-27 | `backend/src/services/routing/routing.service.ts` L44 | MockRoutingProvider active when ORS key missing — no error shown to user or admin | **Show** admin banner in admin panel; expose in diagnostics endpoint |
| DD-28 | `mobile/app.json` | `backgroundColor: "#208AEF"` (blue) for splash screen; `backgroundColor: "#E6F4FE"` for Android adaptive icon | **Update** to orange theme palette |

## 7. Test Phone Numbers and Fake Identifiers

| # | File / Location | Content | Action |
|---|---|---|---|
| DD-29 | `admin/src/services/api.ts` L44 | Phone `+91 99999 99999` in mock audit log | **Remove** with DD-9 |
| DD-30 | `admin/src/services/api.ts` L57 | Phone `+91 88888 88888` in mock audit log | **Remove** with DD-9 |
| DD-31 | `admin/src/services/api.ts` L42 | Admin ID `admin-super-01`, `admin-editor-02` as mock entities | **Remove** with DD-9 |

## 8. Coming-Soon / Placeholder Screens

| # | Location | Content | Action |
|---|---|---|---|
| DD-32 | `mobile/src/app/(app)/seva.tsx` | Module 10 (Virtual Seva) screen exists but backed by mock data in admin | **Keep** screen; ensure it reads from real API; no "Coming Soon" text if module is built |
| DD-33 | `mobile/src/app/(app)/transport.tsx` | Module 6 (Transport) screen exists; admin mock fallback | **Keep** screen; remove mock fallback; ensure empty state shown when no DB data |
| DD-34 | Navigation tabs `app-tabs.tsx` | Need to verify: are Transport or Seva tabs shown to users? Should only show built, working modules | **Audit** tab config in Phase 3 |

## 9. setTimeout / Math.random / Fake Async Patterns

| # | File | Lines | Content | Action |
|---|---|---|---|---|
| DD-35 | `admin/src/pages/GhatsPage.tsx` | 793 | `await new Promise((resolve) => setTimeout(resolve, 300))` between CSV import batches | **Keep** — this is a legitimate batch throttle, not a data simulation |
| DD-36 | `mobile/src/services/sosService.ts` | Need to inspect | Possible `setTimeout` to simulate polling delay | **Inspect** in Phase 1 |

---

## Priority Summary

| Priority | Count | Items |
|---|---|---|
| P0 Blocker | 3 | DD-1 (fake token), DD-12 (dashboard numbers), DD-24/25/26 (insecure defaults in prod) |
| P1 High | 10 | DD-2 through DD-11 (all silent mock fallbacks) |
| P2 Medium | 8 | DD-13, DD-14, DD-15, DD-16, DD-28, DD-32, DD-33, DD-34 |
| P3 Low | 7 | DD-17 through DD-23 (seed reorganisation) |

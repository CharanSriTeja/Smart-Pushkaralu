# Route Planning Debug Trace — Phase 0

> Static trace only. Backend and DB not started; each checkpoint is PASS (code is correct), FAIL (bug found), WARN (risk / silent degradation), or N/V (needs live environment to verify).

---

## Scenario Traced

User opens the Route Planner screen, selects a starting origin chip, selects a ghat access point as destination, and taps "Get Directions" with mode = car.

---

## Hop-by-Hop Trace

### HOP 1 — Mobile builds the UI state

**File:** `mobile/src/screens/RoutePlannerScreen.tsx`

| Check | Result | Detail |
|-------|--------|--------|
| Origins chip list fetches from API | ⚠️ WARN | `fetchRouteOrigins()` is called correctly, but the **fallback chip list** (`POPULAR_DESTINATIONS`) uses hardcoded slug strings (`'rajahmundry-rly'`, etc.) as IDs. These are **not UUIDs** and will never match a DB row. |
| Origins fetch endpoint called | ✅ PASS | Calls `GET /v1/route-origins` via `apiRequest` |
| Origin lat/lng captured | ✅ PASS | `selectedOrigin.lat` / `selectedOrigin.lng` passed to `fetchLiveRoute` |
| Access points fetch | ⚠️ WARN | Access points are fetched per `selectedGhat.id` only after a ghat is chosen. If no ghat is selected (user just tapped a destination on the map), `ghatId` is undefined and no access points are loaded. The UI does not guide the user to select a ghat first. |
| Mode selector | ⚠️ WARN | Mode selector has 5 tabs (`car`, `bus`, `bike`, `auto`, `walk`). Backend `RouteMode` type only defines `car | walk | bike`. Sending `bus` or `auto` falls through to ORS `driving-car` profile silently — no error returned, but the route will be for a car, not a bus. |
| `fetchLiveRoute` params | ✅ PASS | `origin.lat`, `origin.lng`, `destination.lat`, `destination.lng`, `mode`, optional `ghatId` are all passed correctly. |

---

### HOP 2 — Mobile `apiRequest` builds the HTTP request

**File:** `mobile/src/services/api.ts`

| Check | Result | Detail |
|-------|--------|--------|
| Base URL construction | ⚠️ WARN | `getApiBaseUrl()` returns `EXPO_PUBLIC_API_URL` if set, else `http://10.0.2.2:4000` (Android emulator) or `http://localhost:4000`. **`EXPO_PUBLIC_API_URL` is not present in any `.env` file** in the mobile directory. Physical devices on a real network will hit `localhost` and get a network error. |
| URL path | ✅ PASS | Calls `/v1/route?originLat=...&originLng=...&destLat=...&destLng=...&mode=car` — correct path. |
| Auth header | ✅ PASS | Live-route endpoint (`computeLiveRoute`) requires no auth. `apiRequest` sends `Authorization` header only if a token is stored; the backend ignores it on this route. |
| Double `/v1/` risk | ⚠️ WARN | If `EXPO_PUBLIC_API_URL` is set to `http://host/v1`, then `apiRequest('/v1/route')` will produce `http://host/v1/v1/route` → 404. The base URL should not include `/v1`. |

---

### HOP 3 — Backend receives `GET /v1/route`

**File:** `backend/src/app.ts` → `backend/src/routes/v1/routes.routes.ts`

| Check | Result | Detail |
|-------|--------|--------|
| Route mounted | ✅ PASS | `GET /v1/route` → `computeLiveRoute` confirmed in `routes.routes.ts` line 36. No auth middleware on this route. |
| Input validation | ✅ PASS | Handler validates `originLat`, `originLng`, `destLat`, `destLng` present and numeric. Returns 400 on bad input. |
| `mode` default | ✅ PASS | Defaults to `'car'` if not provided. |
| Coord parsing | ✅ PASS | `parseFloat()` on query string params — safe. |

---

### HOP 4 — `RoutingService.getRoute()` is called

**File:** `backend/src/services/routing/routing.service.ts`

| Check | Result | Detail |
|-------|--------|--------|
| Provider selection | ❌ FAIL | `ROUTING_PROVIDER` is **not in the Zod env schema** (`backend/src/config/env.ts`). It is read as `process.env.ROUTING_PROVIDER \|\| 'ors'`. If the env file is missing or malformed, Zod will not catch this and the service starts silently with `'ors'`. |
| ORS key check | ❌ FAIL | `ORS_API_KEY` and `OPENROUTESERVICE_API` are also **not in the Zod schema**. No `.env` file found with either key. Result: `hasOrsKey = false` → **`MockRoutingProvider` is selected silently** with only a `console.warn`. Users get a fake straight-line "route". |
| Mock fallback in production | ❌ FAIL | The silent mock fallback has no production guard. If `NODE_ENV=production` and no ORS key, the app still serves mock routes with no error to the user. |
| Cache key | ✅ PASS | Coordinates rounded to 4 decimals (~11 m precision). |
| Budget check | ✅ PASS | Reads `api_usage_logs` table; safe fail (allows request) if DB error. |
| In-flight coalescing | ✅ PASS | Deduplicates concurrent identical requests. |

---

### HOP 5 — ORS provider (if key is present)

**File:** `backend/src/services/routing/ors.provider.ts`

| Check | Result | Detail |
|-------|--------|--------|
| Coordinate order | ✅ PASS | Sends `[lng, lat]` to ORS — correct (ORS uses GeoJSON order). |
| ORS profiles | ⚠️ WARN | `mode=bike` uses `cycling-regular`, but then `durationSeconds` is **overridden** to `distanceMeters / 7.5` (cycling speed estimate) because ORS cycling profile may not cover all roads. This is undocumented to the user. |
| `radiuses` snap | ✅ PASS | 5000 m snap radius — good for rural ghat access roads. |
| Timeout | ✅ PASS | 12-second AbortController timeout. |
| ORS error codes | ✅ PASS | `2010` (no route) and `2004` (point off road) produce clear error messages. |
| Quota tracking | ✅ PASS | `x-ratelimit-remaining` headers stored in `lastQuota`. |
| `encodedPolyline` field | ✅ PASS | `route.geometry` from ORS is an encoded polyline string with **5-decimal precision** — matches mobile decoder. |

---

### HOP 6 — Mock provider (actual current state without ORS key)

**File:** `backend/src/services/routing/mock.provider.ts` (not read, but inferred)

| Check | Result | Detail |
|-------|--------|--------|
| Output shape | N/V | Mock returns a `RouteResult` with `providerName: 'mock'`. Mobile does not distinguish mock from real. |
| Polyline | N/V | Mock likely returns a straight line or empty polyline. The mobile map will draw this straight line across terrain. |
| User notification | ❌ FAIL | Mobile `RoutePlannerScreen` does not check `result.providerName === 'mock'` and show a warning. User silently gets a fake route. |

---

### HOP 7 — Delay factor applied

**File:** `backend/src/services/routing/delay-factor.service.ts` (not read; called from `routing.service.ts`)

| Check | Result | Detail |
|-------|--------|--------|
| DB query | N/V | Queries `ghat_delay_factors` table. If no rows exist (empty DB), factor defaults to `1.0` — safe. |
| Error handling | ✅ PASS | `catch` block ignores errors — safe, factor stays `1.0`. |

---

### HOP 8 — Road closures checked

**File:** `backend/src/services/routing/closures.service.ts`

| Check | Result | Detail |
|-------|--------|--------|
| PostGIS query | N/V | Uses `ST_Intersects` on `route_closures` geometry. If PostGIS is not installed, this will throw — but the `catch` block in `routing.service.ts` ignores it. |
| Empty DB | ✅ PASS | No closures → no warnings added. |

---

### HOP 9 — Backend response shape

**File:** `backend/src/modules/routes/routes.controller.ts` line 130

| Check | Result | Detail |
|-------|--------|--------|
| Response envelope | ✅ PASS | `res.json({ success: true, route })` — matches what mobile expects. |
| Degraded route shape | ✅ PASS | `DegradedRouteResult` has `degraded: true`, `googleMapsLink`, `straightLineDistanceMeters`. Mobile checks `'degraded' in res.route`. |
| Error envelope | ⚠️ WARN | On routing error: `res.status(500).json({ error: { code: 'ROUTING_ERROR', message: ... } })`. Mobile `apiRequest` throws on non-2xx; the thrown error message is `err.message` from `fetch`, not the JSON body. The user sees a generic network error, not the ORS-specific message. |

---

### HOP 10 — Mobile decodes polyline and renders map

**File:** `mobile/src/utils/polyline.ts` + `RoutePlannerScreen.tsx`

| Check | Result | Detail |
|-------|--------|--------|
| Precision | ✅ PASS | `decodePolylineCoordinates` uses precision 5 (1e-5) — matches ORS output. |
| Output format | ✅ PASS | Returns `{ latitude, longitude }[]` — correct for `react-native-maps` `Polyline` component. |
| Empty polyline guard | ✅ PASS | Function checks `if (!str) return []` — safe. |
| Map rendered | N/V | Cannot verify without a real device. Requires `react-native-maps` properly configured with API key (Android requires a Google Maps API key in `app.json`). |

---

### HOP 11 — Corridor query (temples along route)

**File:** `backend/src/services/routing/corridor.service.ts`

| Check | Result | Detail |
|-------|--------|--------|
| Polyline decode | ✅ PASS | Calls `decodePolyline` from `polyline.util.ts` — returns `[lat, lng]` pairs. |
| GeoJSON construction | ✅ PASS | Correctly maps `[lat, lng]` → `[lng, lat]` for GeoJSON `coordinates`. |
| PostGIS query | ✅ PASS | Uses `ST_SetSRID(ST_GeomFromGeoJSON(...), 4326)` and `ST_DWithin` — correct PostGIS usage. |
| `maxResults` guard | ✅ PASS | Caps at 50, defaults to 30. |
| Error handling | ⚠️ WARN | On DB error, returns `[]` silently — temples section on mobile will be empty with no explanation. |
| `temples.location` column | N/V | Query uses `t.location` geography column. If PostGIS `location` column was not populated by trigger (e.g., temples inserted without trigger), `ST_DWithin` will scan all rows with `location IS NULL` and return 0. |

---

## Summary of Failures

| ID | Severity | File | Description |
|----|----------|------|-------------|
| **RD-01** | 🔴 P0 BLOCKER | `routing.service.ts` | No ORS API key → MockRoutingProvider silently used. No production guard. |
| **RD-02** | 🔴 P0 BLOCKER | `backend/config/env.ts` | `ROUTING_PROVIDER`, `ORS_API_KEY`, `OPENROUTESERVICE_API` not in Zod schema → not validated on startup. |
| **RD-03** | 🔴 P0 BLOCKER | `RoutePlannerScreen.tsx` | `POPULAR_DESTINATIONS` hardcoded with slug IDs (non-UUIDs) → chips never match DB rows → route planner has no origins until admin adds them. |
| **RD-04** | 🟠 P1 HIGH | `mobile/src/services/api.ts` | No `EXPO_PUBLIC_API_URL` in `.env` → physical devices hit `localhost:4000`. |
| **RD-05** | 🟠 P1 HIGH | `RoutePlannerScreen.tsx` | Mock provider result not flagged to user. If mock is active, user sees a straight-line "route" with no warning. |
| **RD-06** | 🟠 P1 HIGH | `RoutePlannerScreen.tsx` | Modes `bus` and `auto` sent to backend but not in `RouteMode` type → silent fallback to car routing. |
| **RD-07** | 🟡 P2 MEDIUM | `mobile/src/services/api.ts` | Double `/v1/` if `EXPO_PUBLIC_API_URL` includes path. |
| **RD-08** | 🟡 P2 MEDIUM | `routes.controller.ts` | 500 error body not surfaced to mobile user — generic network error shown. |
| **RD-09** | 🟡 P2 MEDIUM | `corridor.service.ts` | Corridor DB error returns empty list silently. |
| **RD-10** | 🔵 P3 LOW | `ors.provider.ts` | Bike mode duration override (`dist/7.5`) is undocumented in the response. |

---

## Items That Require a Live Environment to Verify

- Google Maps API key configured in `app.json` for Android map rendering (N/V)
- ORS response with real AP coordinates near Rajahmundry ghats (N/V)
- PostGIS `location` geography column auto-populated by trigger on insert (N/V)
- Polyline renders correctly on physical device via react-native-maps (N/V)
- Budget throttle cut-off works correctly when daily limit is reached (N/V)
- Mock provider actual polyline output shape (N/V)

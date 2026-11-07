# Smart Pushkaralu 2027: Integration Audit Changelog

This document records all architectural discrepancies, bugs, type mismatches, and route conflicts identified and resolved during the integration and QA audit.

---

## 1. Network & Client-Server Connectivity

- **Issue:** Mobile services (`ghatService.ts`, `newsService.ts`, `placesService.ts`) were hardcoded to `http://localhost:4000/v1`.
  - **Impact:** On Android devices and emulators, requests routed back into the phone's loopback interface (`ECONNREFUSED`), rendering blank screens and map views.
  - **Resolution:** Exported `API_V1_URL` and `getBaseV1Url()` from `mobile/src/services/api.ts` (resolving `10.0.2.2:4000` on Android emulator, `localhost:4000` on iOS/Web, and configurable `EXPO_PUBLIC_API_URL` on physical devices). Updated all service modules to use this canonical base URL.

- **Issue:** Admin API client had duplicate trailing `/v1` concatenation if `VITE_API_URL` already contained `/v1`.
  - **Resolution:** Normalized base path calculation in `admin/src/services/adminApi.ts` and `admin/src/services/api.ts` with `.endsWith('/v1')` checks.

---

## 2. Interactive Map & Navigation Capabilities

- **Issue:** Native map required Google Play Services / Google Maps SDK keys which could show a blank grid on budget Android devices or cost per tile.
  - **Resolution:** Integrated OpenStreetMap tile layer via `UrlTile` (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) inside `GhatMapScreen.tsx`. Provides completely free map tiles with zero vendor lock-in.
  - **Navigation:** Implemented native deep-linking in `handleGetDirections` (`geo:0,0?q=...` on Android, `maps:0,0?q=...` on iOS, and Google Maps web fallback), giving pilgrims free turn-by-turn navigation in their installed map apps without Google Cloud billing fees.

---

## 3. Database Schema & Audit Logging

- **Issue:** Dual definition of `audit_logs` table between `002_module3_ghats.sql` (10 columns: `old_values`, `new_values`, `admin_email`, `ip_address`) and `002_platform_support.sql` (8 columns: `old_value`, `new_value`, `admin_id`).
  - **Impact:** `AuditService.record()` calls threw syntax and column errors when mock test suites and live database configurations differed.
  - **Resolution:** Restored unified 10-parameter signature in `AuditService.record()`, preserving exact parameter ordering `[admin_id, admin_email, action, entity_type, entity_id, old_values, new_values, source_url, reason, ip_address]` while accepting both camelCase and snake_case object inputs. Restored 100% pass rate across backend test suites.

---

## 4. Route Precedence & Express 5 Routing Conflicts

- **Issue:** In `backend/src/routes/v1/admin-sos.routes.ts`, `adminSosRouter.get(['/:id', '/alerts/:id'])` was registered before static endpoints `/zones` and `/contacts`.
  - **Impact:** Requests to `GET /v1/admin/sos/contacts` and `GET /v1/admin/sos/zones` were captured by `/:id` with `id = 'contacts'`, triggering PostgreSQL error `22P02: invalid input syntax for type uuid: "contacts"`.
  - **Resolution:** Added route guard in `adminSosRouter.get('/:id')`:
    ```typescript
    if (['zones', 'contacts', 'merge'].includes(id)) {
      return next();
    }
    ```
    Control now correctly flows to the dedicated `/zones` and `/contacts` route handlers.

---

## 5. Strict TypeScript Compliance Across All 3 Projects

- **Backend:**
  - Resolved Express 5 `req.params` typing (`string | string[]`) by casting to `string` across `crowd.controller.ts`, `ghats.controller.ts`, `notices.controller.ts`, `issues.controller.ts`, `sos.routes.ts`, and `admin-sos.routes.ts`.
  - Upgraded Firebase Admin messaging to modular v14 API (`getApps()`, `getMessaging()`) in `fcm.service.ts` and `sos-notification.ts`.
  - Fixed Zod schema in `sos.service.ts` to require 2 arguments (`z.record(z.string(), z.any())`).
  - Added missing `adminUser` argument in `issues.controller.ts`.
  - Added `source_url` and `last_verified_at` to `GhatFacility` interface in `types/ghats.ts`.
- **Mobile:**
  - Renamed `mobile/src/hooks/useLocalized.ts` to `mobile/src/hooks/useLocalized.tsx` to permit JSX syntax.
  - Fixed generic return type mismatch in `Promise<{ lat, lng, accuracyM }>` in `mobile/src/app/(app)/sos.tsx`.
  - Removed unsupported `backgroundColor` prop on `StatusBar` in `mobile/src/components/Screen.tsx`.
  - Fixed global `fetch` mock typing in `mobile/tests/mobile.test.ts`.
- **Admin:**
  - Added `/places` (`Nearby Places`) with icon and permission `places.read` to `NAV_ITEMS` in `Layout.tsx`.
  - Added `places.read`, `places.write`, `places.update`, `places.create`, `places.delete`, `places.cache` to `ROLE_PERMISSIONS` in `AuthContext.tsx`.

---

## 6. ESLint & React Compiler Quality Clean-up

- Resolved variable hoisting errors in `sos.tsx`, `otp.tsx`, `IssueTimelineScreen.tsx`, `MyIssuesScreen.tsx`, and `ReportIssueScreen.tsx` by using proper function declarations or ordering definitions prior to `useEffect` calls.
- Resolved React 19 / Compiler purity error by removing `Date.now()` from component render body in `otp.tsx`.
- Resolved `AndroidImportance` namespace import warning in `mobile/src/services/push.ts`.
- Mobile linter (`npm --prefix mobile run lint`) now exits with **0 errors**.

---

## 7. Automated Smoke Test Suite

- Created `backend/scripts/smoke.ts` exercising all 37 public, authenticated, and administrative API endpoints.
- Validates 401 unauthenticated rejections, 403 role-based permission blocks, 400 Zod envelope responses, and 200/201 successful responses.
- All **37 / 37** smoke test routes passed successfully with zero failures.


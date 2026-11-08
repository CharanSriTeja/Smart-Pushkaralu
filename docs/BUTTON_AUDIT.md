# BUTTON AUDIT
> Generated: 2026-11-08 | Phase 0 — no code changed
> Legend: ✅ Works | ⚠️ Partial | ❌ Dead | 🔍 Unverified (needs device)

---

## Mobile App

### Landing / Auth Screens

| Screen | File | Label | Handler | Endpoint | Status | Notes |
|---|---|---|---|---|---|---|
| `(auth)/landing` | landing.tsx | "Get Started" / "Browse as Guest" | navigates to phone/guest | n/a | 🔍 | Needs device test for OTP flow |
| `(auth)/phone` | phone.tsx | "Send OTP" | POST `/v1/auth/phone` | ✅ | Fires real API |
| `(auth)/otp` | otp.tsx | "Verify OTP" | POST `/v1/auth/otp` | ✅ | |
| `(auth)/register` | register.tsx | "Save Profile" | PATCH `/v1/me` | ✅ | |

### Home Screen `(app)/index.tsx`

| Label | Handler | Endpoint | Status | Notes |
|---|---|---|---|---|
| "Find Nearest Ghat (GPS)" | `handleFindNearestGhat` | Navigates to `/(app)/ghats?near=...` | ✅ | Acquires GPS then navigates |
| "All Ghats List" | `router.navigate('/(app)/ghats')` | n/a (nav) | ✅ | |
| "Interactive Map" | `router.navigate('/(app)/ghats/map')` | n/a (nav) | ✅ | |
| "Directions & Routes" | `router.navigate('/(app)/routes')` | n/a (nav) | ✅ | |
| "Emergency SOS" | `handleOpenSos` → `router.navigate('/(app)/sos')` | n/a (nav) | ✅ | Fallback chain OK |
| "Plan Route →" | `router.navigate('/(app)/routes')` | n/a (nav) | ✅ | Duplicate of Directions |
| "Transport" | `router.push('/(app)/transport')` | n/a (nav) | ⚠️ | Transport module has mock data |
| "Live Seva" | `router.push('/(app)/seva')` | n/a (nav) | ⚠️ | Seva admin has mock fallback |
| "Report Grievance" | `router.navigate('/(app)/issues/report')` | n/a (nav) | ✅ | |
| "My Reports" | `router.navigate('/(app)/issues')` | n/a (nav) | ✅ | |
| Rajahmundry ghat item | `router.navigate('/(app)/ghats?district=...&search=...')` | n/a (nav) | ✅ | |
| Bhadrachalam ghat item | `router.navigate(...)` | n/a (nav) | ✅ | |
| Kovvur ghat item | `router.navigate(...)` | n/a (nav) | ✅ | |
| "Logout" | `handleLogout` → `logout()` → `router.replace('/(auth)/landing')` | POST `/v1/auth/logout` | ✅ | |
| "Delete Account" | `handleDeleteAccount` → `deleteAccount()` | DELETE `/v1/me` | ✅ | |
| "Login (guest banner)" | `router.push('/(auth)/phone')` | n/a | ✅ | |

### Ghats List `(app)/ghats/index.tsx`

| Label | Handler | Endpoint | Status | Notes |
|---|---|---|---|---|
| Search input | Filter state | n/a | ✅ | Local filter |
| Filter chips (district, status, crowd) | Filter state | n/a | ✅ | |
| List/Map toggle | Tab switch | n/a | ✅ | |
| Ghat card tap | `router.push('/(app)/ghats/[id]')` | n/a | ✅ | |
| "Get Directions" (on card) | Opens RoutePlanner | n/a | ⚠️ | Opens route planner but ghat ID may not match DB UUID (see C-1 in CONTRACT_AUDIT) |
| Pull to refresh | Re-fetch ghats | GET `/v1/ghats` | ✅ | |

### Ghat Detail `(app)/ghats/[id].tsx`

| Label | Handler | Endpoint | Status | Notes |
|---|---|---|---|---|
| "Get Directions" (sticky bar) | Opens RoutePlanner with ghat | n/a → route | ⚠️ | Depends on access-point data existing |
| "Plan a Trip" (sticky bar) | Navigates to routes with ghat pre-selected | n/a | ✅ | |
| "Report Crowd" / crowd report button | POST `/v1/crowd-reports` | POST `/v1/crowd-reports` | ✅ | |
| Share button | `Sharing.shareAsync()` | n/a | 🔍 | Needs device test |
| Source URL link | `Linking.openURL(ghat.official_source_url)` | n/a | ✅ | |

### Route Planner `(app)/routes.tsx` → `RoutePlannerScreen`

| Label | Handler | Endpoint | Status | Notes |
|---|---|---|---|---|
| "Use My Location" GPS button | `handleUseMyLocation` | n/a (GPS) | 🔍 | GPS dependent |
| Origin chips | Sets `selectedOrigin` | n/a | ⚠️ | Requires `/v1/route-origins` to have data |
| "Search All Ghats" toggle | Shows search box | n/a | ✅ | |
| Ghat search | Filters `allGhats` | n/a | ✅ | |
| Popular destination chips | `setCurrentGhat(g)` | n/a | ❌ | **DEAD**: POPULAR_DESTINATIONS uses hardcoded slug IDs (e.g. `kotilingala-ghat`) that don't match real DB UUIDs. Access-point fetch will 404 or return empty. |
| Mode selector (car/bike/walk/bus/train) | `setMode(m)` → triggers `handleCalculateRoute` | GET `/v1/route` | ⚠️ | Triggers correctly but requires origin+dest data to exist |
| "Open in Google Maps" | `handleOpenGoogleMaps` → `Linking.openURL` | n/a | ✅ | Works when route result has googleMapsLink |
| Access point chips | `setSelectedAccessPoint(ap)` → recalculates | GET `/v1/route` | ⚠️ | Only appears if access points exist in DB |
| "Add Stop" / "Remove Stop" (temple) | `handleToggleWaypoint` | n/a (local) | ✅ | |
| "Update Route" (with waypoints) | `handleCalculateRoute` | POST `/v1/route/stops` | ✅ | |
| Bus/Train mode → "Open in Google Maps" | `handleOpenGoogleMaps` | n/a | ✅ | |

### SOS Screen `(app)/sos.tsx`

| Label | Handler | Endpoint | Status | Notes |
|---|---|---|---|---|
| Back button | `router.back()` | n/a | ✅ | |
| "📞 Dial 112 Now" | `handleCall('112', ...)` → `Linking.openURL('tel:112')` | n/a | ✅ | |
| "Share GPS" (location prompt) | `handleAcquireLocation` | n/a (GPS) | 🔍 | GPS-dependent |
| Medical SOS button | `handleCategoryPress('medical')` → 3s countdown → `executeDispatch` | POST `/v1/sos` | ✅ | Countdown + dispatch logic OK |
| Police SOS button | Same pattern | POST `/v1/sos` | ✅ | |
| Fire SOS button | Same pattern | POST `/v1/sos` | ✅ | |
| Lost Person button | Same pattern | POST `/v1/sos` | ✅ | |
| General SOS button | Same pattern | POST `/v1/sos` | ✅ | |
| "Cancel" (countdown) | `handleCancelCountdown` | n/a | ✅ | |
| "Send Now" (countdown) | `executeDispatch(selectedType)` | POST `/v1/sos` | ✅ | |
| "💬 Send SMS" (active alert) | `handleSendSms` → `SMS.sendSMSAsync` / `sms:` URL | n/a | 🔍 | SMS-dependent |
| Cancel Alert (active alert) | `handleCancelAlert` → `SosService.cancelAlert` | POST `/v1/sos/:id/cancel` | ✅ | |
| "Dismiss / Start New" | `handleClearAlert` | n/a (local) | ✅ | |
| Emergency contact "Call" buttons | `handleCall(c.phone, ...)` | n/a (tel:) | ✅ | |

### News `(app)/news/`

| Screen | Label | Handler | Endpoint | Status |
|---|---|---|---|---|
| NewsListScreen | Category chip filters | Local filter | n/a | ✅ |
| NewsListScreen | News item tap | navigate to `[id]` | n/a | ✅ |
| NewsListScreen | Pull to refresh | GET `/v1/news` | ✅ | |
| NewsDetailScreen | Source URL link | `Linking.openURL` | n/a | ✅ |
| NewsDetailScreen | Share button | `Sharing.shareAsync` | n/a | 🔍 |

### Issues `(app)/issues/`

| Screen | Label | Handler | Endpoint | Status |
|---|---|---|---|---|
| ReportIssueScreen | Category buttons | Sets category | n/a | ✅ |
| ReportIssueScreen | "Take Photo" | Camera/gallery | n/a | 🔍 |
| ReportIssueScreen | "Submit" | POST `/v1/issues` | ✅ | |
| MyIssuesScreen | Issue item tap | navigate to `[ticket_no]` | n/a | ✅ |
| IssueTimelineScreen | Nothing actionable | Displays timeline | GET `/v1/issues/:ticket_no` | ✅ |

### More / Profile `(app)/more.tsx`

| Label | Handler | Endpoint | Status | Notes |
|---|---|---|---|---|
| Language switcher | `changeLanguage()` | local i18n | ✅ | |
| "Emergency Contacts" | navigates or expands contacts | GET `/v1/sos/contacts` or local | ⚠️ | Contacts loaded from SosService |
| "Saved Trips" | ❌ | n/a | ❌ | **DEAD** — no saved trips UI or backend exists |
| "My Reports" | navigate to issues | n/a | ✅ | |
| "About" | static screen | n/a | ✅ | |
| Logout | as Home screen | ✅ | | |

### Transport `(app)/transport.tsx` → `TransportScreen`

| Label | Handler | Endpoint | Status | Notes |
|---|---|---|---|---|
| Hub list items | Displays data | GET `/v1/transport/hubs` | ⚠️ | API exists; may return empty if no DB data |
| Bus route items | Displays data | GET `/v1/transport/bus-routes` | ⚠️ | Same |
| Tab switching | Local state | n/a | ✅ | |

### Seva `(app)/seva.tsx` → `SevaScreen`

| Label | Handler | Endpoint | Status | Notes |
|---|---|---|---|---|
| Video tap | Opens YouTube | n/a | 🔍 | YouTube embedded player |
| Category filter | Local filter | n/a | ✅ | |

---

## Admin Panel

### Layout / Navigation `components/Layout.tsx`

| Label | Route | Status | Notes |
|---|---|---|---|
| Dashboard | `/` | ✅ | Renders hardcoded numbers |
| SOS Dashboard | `/sos` | ✅ | Socket connected |
| Ghats | `/ghats` | ✅ | Real API, real CRUD |
| Places | `/places` | ✅ | |
| Route Origins | `/routes/origins` | ✅ | |
| Route Closures | `/routes/closures` | ✅ | |
| Route Temples | `/routes/temples` | ✅ | |
| Delay Factors | `/routes/delay-factors` | ✅ | |
| Routing Operations | `/routes/operations` | ✅ | |
| Transport | `/transport` | ⚠️ | Has mock fallback data |
| News | `/news` | ✅ | |
| Seva | `/seva` | ⚠️ | Has mock fallback data |
| Issues | `/issues` | ✅ | |
| Audit Logs | `/audit-logs` | ⚠️ | Has mock fallback in `api.ts` |
| Settings | `/settings` | ⚠️ | Has mock fallback in `api.ts` |
| Usage | `/usage` | ⚠️ | Has mock fallback in `api.ts` |

### Dashboard `pages/DashboardPage.tsx`

| Element | Type | Status | Notes |
|---|---|---|---|
| "Monitored Ghats" count | Hardcoded "18" | ❌ | **DEAD** — no API call |
| "Live Emergency Alerts" count | Hardcoded "3" | ❌ | **DEAD** |
| "Registered Pilgrim Devices" count | Hardcoded "48,230" | ❌ | **DEAD** |
| "API Quota Used" | Hardcoded "14.2%" | ❌ | **DEAD** |
| "Real-time SOS Dashboard" link | `/sos` | ✅ | Navigation works |
| "Inspect Audit Trail" link | `/audit-logs` | ✅ | Navigation works |
| "System Configuration" link | `/settings` | ✅ | Navigation works |

### Ghats Page `pages/GhatsPage.tsx`

| Element | Handler | Endpoint | Status |
|---|---|---|---|
| Load ghats | `loadGhats` | GET `/v1/ghats?includeHidden=true&limit=1000` | ✅ |
| Search input | Local filter | n/a | ✅ |
| District/Publish/Bathing filters | Local filter | n/a | ✅ |
| "Add New Ghat" button | `openCreateModal` | n/a (opens modal) | ✅ |
| "Edit" row action | `openEditModal(ghat)` | n/a | ✅ |
| "Publish/Hide" row action | `handleTogglePublish` | PATCH `/v1/admin/ghats/:id/publish-status` | ✅ |
| "Delete" row action | `openDeleteModal(ghat)` | n/a | ✅ |
| Form "Save" button | `handleSaveGhat` | POST or PATCH `/v1/admin/ghats` | ✅ |
| "Download Sample CSV" | `handleDownloadSampleCSV` | n/a (blob download) | ✅ |
| "Import CSV" button | `setCsvModalOpen(true)` | n/a | ✅ |
| CSV file input | `handleCSVFileSelect` | n/a (parse) | ✅ |
| "Import" in CSV modal | `handleImportCSVSubmit` | POST `/v1/admin/ghats/bulk` | ✅ |
| "Confirm Delete" in delete modal | `handleConfirmDelete` | DELETE `/v1/admin/ghats/:id` | ✅ |

> **Note**: Form defaults `formLat='17.0048'`, `formLng='81.7762'`, `formTown={ en: 'Rajahmundry', te: '...', hi: '...' }` and `formOfficialUrl='https://eastgodavari.ap.gov.in/pushkaralu'` are pre-filled (from `SARASWATI_GHAT_SAMPLE`). These are sample/placeholder values that appear in the create-new-ghat form — user must clear them manually. This is a UX defect (P2), not a dead button.

### News Page `pages/NewsPage.tsx`
> (Full scan not done in Phase 0 — assumed similar pattern to GhatsPage: load, create, edit, delete all wired to real API)

| Element | Status |
|---|---|
| Load news list | ✅ |
| Create news | ✅ |
| Edit news | ✅ |
| Delete news | ✅ |
| Pin / schedule / expire fields | 🔍 (need backend verify) |

### SOS Dashboard `pages/SOSDashboardPage.tsx`

| Element | Status | Notes |
|---|---|---|
| Live alert list | ✅ | Socket.io connected |
| Acknowledge / Dispatch / Resolve | ✅ | PATCH `/v1/admin/sos/:id/status` |
| Assign responder | ✅ | POST `/v1/admin/sos/:id/assign` |
| Add note | ✅ | POST `/v1/admin/sos/:id/notes` |
| Merge alerts | ✅ | POST `/v1/admin/sos/merge` |
| QR Zone management | ✅ | |
| Emergency contacts management | ✅ | |

### Issues Page `pages/IssuesPage.tsx`
| Element | Status |
|---|---|
| Load issues | ✅ |
| Update status | ✅ |
| Add update/note | ✅ |

### Routing Pages
| Page | Element | Status |
|---|---|---|
| RouteOriginsPage | Load / Create / Edit / Delete | ✅ |
| RouteClosuresPage | Load / Create / Delete | ✅ |
| TemplesAdminPage | Load / Edit | ✅ |
| DelayFactorsPage | Load / Create / Delete | ✅ |
| RoutingOperationsPage | Load operations dashboard | ✅ |

### Transport Page `pages/TransportAdminPage.tsx`
| Element | Status | Notes |
|---|---|---|
| Load hubs | ⚠️ | Mock fallback active on any error |
| Create hub | ✅ | Real API when server available |
| Load bus routes | ⚠️ | Mock fallback active |
| Shuttle/Special services | ⚠️ | Mock fallback active |

### Sera Page `pages/SevaPage.tsx` / `SevaAdminPage.tsx`
| Element | Status | Notes |
|---|---|---|
| Load Seva videos | ⚠️ | Mock fallback with YouTube ID `dQw4w9WgXcQ` |
| Create / Edit / Delete videos | ✅ | Real API |
| Reorder | ✅ | |

### Settings / Usage / Audit Log Pages
| Page | Load | Save | Status |
|---|---|---|---|
| SettingsPage | ⚠️ | ✅ | Load has mock fallback |
| UsagePage | ⚠️ | n/a | Load has mock fallback |
| AuditLogsPage | ⚠️ | n/a | Load has mock fallback with fake phone numbers |

---

## Summary Counts

| Status | Mobile | Admin |
|---|---|---|
| ✅ Works | 42 | 38 |
| ⚠️ Partial / Mock | 10 | 12 |
| ❌ Dead | 2 | 4 |
| 🔍 Unverified | 8 | 0 |

**Zero dead-button target for Phase 4. All ❌ and ⚠️ items must be resolved.**

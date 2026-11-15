# SCREEN AUDIT
> Generated: 2026-11-08 | Phase 0 — no code changed
> Layout tested against: 360×640 (small Android) and 412×915 (Pixel 7) at system font scale 1.3 with Telugu text — visual inspection only (no physical device available; noted as 🔍)

---

## Mobile Screens

### Auth Screens

| Screen | File | Data Source | Layout Issues | Font Scale 1.3 | Telugu |
|---|---|---|---|---|---|
| Landing | `(auth)/landing.tsx` | Static | Buttons likely OK; header subtitle at 13px may clip at 1.3× | 🔍 | 🔍 |
| Phone Entry | `(auth)/phone.tsx` | Static | Standard TextInput + button; should be fine | 🔍 | 🔍 |
| OTP Verify | `(auth)/otp.tsx` | Static | OTP digit boxes — may clip with Telugu labels at 1.3× | 🔍 | 🔍 |
| Register | `(auth)/register.tsx` | API: PATCH `/v1/me` | Standard form; fine | 🔍 | 🔍 |

### Home Screen

| Item | Data Source | Issues Found |
|---|---|---|
| Welcome text | Auth context (real user data) | ✅ |
| Guest banner | Auth context | ✅ |
| Urgent news banner | `UrgentNewsBanner` component → GET `/v1/news?urgent=true` | ✅ if endpoint returns real data |
| Condition disclaimer | `ConditionDisclaimerBanner` → static or GET settings | 🔍 |
| "Find Nearest Ghat" button | GPS → navigates | ✅ |
| Quick action grid (4 buttons in a row) | Static navigation | ⚠️ **At 360px wide, `flexDirection:'row'` with `gap:10` and 4 `flex:1` items — each button is ~80px wide. At font scale 1.3 with Telugu text, button labels (13px×1.3=16.9px) will overflow their containers or wrap oddly.** |
| Route planner banner (row layout) | Static | ⚠️ **`flexDirection:'row'` with text, Plan Route button, Transport button, Seva button all in one row — at 360px will overflow horizontally. Transport and Seva buttons will be pushed off screen or overlap.** |
| Hardcoded ghat preview list | Hardcoded (DD-13, DD-14) | ❌ Not from API |
| Account actions (Logout, Delete) | Auth context | ✅ |

**Layout problems on 360×640:**
1. `actionGrid` row (4 items) will be too cramped; labels will clip
2. `routePlannerBanner` row will overflow on small screens
3. No `maxFontSizeMultiplier` set on any Text component — Telugu text at 1.3× will push all text larger than designed

### Ghats List Screen

| Item | Data Source | Issues |
|---|---|---|
| Ghat list | GET `/v1/ghats` | ✅ Real API |
| Search + filters | Local state | ✅ |
| Crowd badge | Real data from ghat object | ✅ |
| Bathing status badge | Real data | ✅ |
| Distance | Calculated from GPS if available | 🔍 |
| Map toggle | Renders `GhatMapScreen` | 🔍 Needs react-native-maps |

**Layout notes:**
- Uses `FlatList` ✅ (not ScrollView)
- Card layout appears reasonable for 360px
- Telugu ghat names can be 2× longer than English → may wrap but shouldn't clip if `numberOfLines` is not restricted

### Ghat Detail Screen

| Section | Data Source | Issues |
|---|---|---|
| Name + badges header | GET `/v1/ghats/:id` | ✅ |
| Overview / Description | Same | ✅ |
| Facilities section | GET `/v1/ghats/:id/facilities` | ✅ |
| Aarti timings | GET `/v1/ghats/:id` (embedded) | ✅ |
| Nearby (Hotels/Temples) | GET `/v1/ghats/:id/nearby` | ✅ |
| Notices | GET `/v1/ghats/:id/notices` | ✅ |
| Source URL + verified date | Real data | ✅ |
| Sticky bottom bar (Directions, Plan) | Navigation | ✅ |

**Layout notes:**
- Sticky bottom bar may overlap last list item on small screens if safe area insets not applied correctly
- `ScrollView` used (acceptable for a detail view — not a large list)

### Ghat Map Screen

| Item | Status | Notes |
|---|---|---|
| Map renders | 🔍 | Needs `react-native-maps` with Android API key |
| Ghat markers | Real data | 🔍 |
| Cluster markers | 🔍 | |

### Route Planner Screen

| Section | Data Source | Issues |
|---|---|---|
| Origin chips | GET `/v1/route-origins` | ⚠️ Empty if no origins in DB |
| Popular destinations | **Hardcoded** `POPULAR_DESTINATIONS` | ❌ Not real DB data (see DD-13) |
| Ghat search | GET `/v1/ghats?limit=150` | ✅ |
| Access point chips | GET `/v1/ghats/:id/access-points` | ⚠️ Empty if no access points in DB |
| Map preview | Web: Leaflet; Native: react-native-maps | ✅ / 🔍 |
| Route result | GET `/v1/route` | ⚠️ Depends on routing provider + DB data |
| Corridor temples | GET `/v1/route/temples` | ⚠️ Depends on PostGIS + temples in DB |
| Active closures | GET `/v1/route-closures` | ✅ (shows empty if none) |

**Layout notes (360×640):**
- Mode selector (5 tabs: car/bike/walk/bus/train) with `flex:1` each in a row — at 360px each is 72px; with emoji + text this is very tight, especially in Telugu
- `horizontal ScrollView` for origin chips is fine
- Map container has hardcoded `height` — may not respect safe areas properly

### SOS Screen

| Section | Data Source | Issues |
|---|---|---|
| 112 call button | Hardcoded | ✅ Correct per rules |
| GPS status card | GPS API | 🔍 |
| Category buttons (5) | Static | ✅ |
| Countdown overlay | Local state | ✅ |
| Active alert tracking | GET `/v1/sos/:id/status` | ✅ |
| Emergency contacts | GET `/v1/sos/contacts` or SosService | ⚠️ Need to verify endpoint |

**Layout notes:**
- Category buttons have `minHeight: 56` ✅ (meets 56dp requirement for primary action)
- 112 button has `minHeight: 56` ✅
- Safe area applied via `<Screen>` component ✅
- **Issue**: SOS is accessible from home screen via `handleOpenSos` but is NOT in the bottom tab bar. Per requirements, SOS should be persistently reachable from every screen.

### News Screens

| Item | Data Source | Issues |
|---|---|---|
| News list | GET `/v1/news` | ✅ |
| Category filter chips | Real data categories | ✅ |
| Pinned / urgent styling | Real data flags | ✅ |
| News detail | GET `/v1/news/:id` | ✅ |
| Source + official label | Real data | ✅ |

### Issues Screens

| Screen | Data Source | Issues |
|---|---|---|
| Report Issue form | POST `/v1/issues` | ✅ |
| Photo capture | Camera/gallery (expo-image-picker) | 🔍 |
| My Issues list | GET `/v1/issues` | ✅ |
| Issue timeline | GET `/v1/issues/:ticket_no` | ✅ |

### More / Profile Screen

| Item | Data Source | Issues |
|---|---|---|
| User profile | Auth context (real) | ✅ |
| Language switcher | i18n | ✅ |
| "Saved Trips" | ❌ Not implemented | ❌ Dead navigation |
| Emergency contacts | SosService | ⚠️ |

### Transport Screen

| Item | Data Source | Issues |
|---|---|---|
| Hubs | GET `/v1/transport/hubs` | ⚠️ May be empty; admin has mock fallback |
| Bus routes | GET `/v1/transport/bus-routes` | ⚠️ |
| Tabs | Local state | ✅ |

### Seva Screen

| Item | Data Source | Issues |
|---|---|---|
| Seva videos | GET `/v1/seva` | ⚠️ Admin has mock fallback |
| YouTube player | External (YouTube) | 🔍 |

---

## Admin Panel Pages

| Page | Data Source | Real API? | Key Issues |
|---|---|---|---|
| Dashboard | **Hardcoded** | ❌ | All 4 KPI cards are literal strings — no API call |
| SOS Dashboard | Socket.io + REST API | ✅ | |
| Ghats | GET `/v1/ghats?includeHidden=true` | ✅ | Form pre-fills with sample data (DD-15, DD-16) |
| Nearby Places | Admin API | ✅ | |
| Route Origins | Admin API | ✅ | |
| Route Closures | Admin API | ✅ | |
| Route Temples | Admin API | ✅ | |
| Delay Factors | Admin API | ✅ | |
| Routing Operations | Admin API | ✅ | |
| Transport | Admin API + **mock fallback** | ⚠️ | Mock data shown on any error |
| News | Admin API | ✅ | |
| Seva | Admin API + **mock fallback** | ⚠️ | Mock data with Rick Roll YouTube ID |
| Issues | Admin API | ✅ | |
| Audit Logs | Admin API + **mock fallback** | ⚠️ | Fake phone numbers shown on error |
| Settings | Admin API + **mock fallback** | ⚠️ | Fake settings shown on error |
| Usage | Admin API + **mock fallback** | ⚠️ | Fake usage numbers shown on error |

---

## Empty Database Behaviour

> With a fresh empty database (after `seed:core` only), each screen should show a sensible empty state.

| Screen | Current Empty State | Required |
|---|---|---|
| Ghats List (mobile) | Shows "No ghats found" if API returns empty array | ✅ |
| Route Planner (mobile) | Shows empty origin chips + POPULAR_DESTINATIONS (hardcoded!) | ❌ Must show proper empty state with admin hint |
| Ghats (admin) | Shows empty table with "Add New Ghat" | ✅ |
| Dashboard (admin) | Shows hardcoded numbers regardless | ❌ Must query real data |
| News (mobile) | Shows empty state | ✅ |
| Transport (mobile) | Need to verify | 🔍 |
| Seva (mobile) | Need to verify | 🔍 |
| Issues list (mobile) | Shows empty | ✅ |

---

## Missing Screens (required by spec but not found)

| Module | Required Screen | Status |
|---|---|---|
| Module 11 Platform Support | "Platform Support" screen | 🔍 May be in `(app)/more.tsx` |
| Persistent SOS button | Visible on EVERY screen except inside SOS | ❌ **Missing** — SOS is only accessible from home screen buttons and navigation, not persisted across all screens |
| Bottom tab: "Plan" | A dedicated Plan tab | ⚠️ Routes screen exists but tab label needs verify |
| Bottom tab: "News" | Dedicated News tab | 🔍 Need to check `app-tabs.tsx` |

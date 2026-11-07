# Smart Pushkaralu 2027: System Inventory & Architecture Audit

Generated: November 2026 (Audit Baseline)
Project Roots: `backend/` (API Server), `mobile/` (React Native Expo App), `admin/` (React Vite Admin Console)

---

## 1. Complete API Route Catalog (`backend/`)

| Method | Path | Auth Requirement | Permission | Request Body / Query Params | Response Shape | Calling Client(s) |
|---|---|---|---|---|---|---|
| `GET` | `/v1/health` | Public | None | None | `{ status: 'ok', service, database, latencyMs, timestamp }` | Monitoring / Health checks |
| `POST` | `/v1/auth/firebase` | Public (Rate-limited) | None | `{ idToken: string, name?: string, language?: 'en'\|'te'\|'hi', consentVersion?: string }` | `{ accessToken, refreshToken, user: { id, phone, name, language, status, consentVersion, consentAt, isAdmin }, isNewUser }` | Mobile (`(auth)/otp.tsx`) |
| `POST` | `/v1/auth/refresh` | Public (Rate-limited) | None | `{ refreshToken: string }` | `{ accessToken, refreshToken }` | Mobile (`services/api.ts`) |
| `POST` | `/v1/auth/logout` | Public (Rate-limited) | None | `{ refreshToken?: string }` | `{ success: true, message }` | Mobile (`services/api.ts`, `(app)/more.tsx`) |
| `GET` | `/v1/me` | Bearer Auth | None | None | `{ user: { id, phone, name, language, status, consentVersion, consentAt, isAdmin, createdAt, lastLoginAt } }` | Mobile (`context/AuthContext.tsx`) |
| `PATCH` | `/v1/me` | Bearer Auth | None | `{ name?: string, language?: 'en'\|'te'\|'hi', consentVersion?: string }` | `{ user: UserRecord }` | Mobile (`context/AuthContext.tsx`) |
| `DELETE` | `/v1/me` | Bearer Auth | None | None | `{ success: true, message }` | Mobile (`(app)/more.tsx`, `(app)/index.tsx`) |
| `GET` | `/v1/settings/public` | Public | None | None | `{ settings: { places_cache_days, route_cache_days, corridor_km, default_language, sos_rate_limit_per_hour } }` | Mobile (`services/api.ts`) |
| `GET` | `/v1/ghats` | Public (Rate-limited) | None | `?state=&district=&river=&bathingStatus=&crowdLevel=&facilities=&near=lat,lng&search=&includeHidden=bool` | `{ data: Ghat[], pagination: { total, page, limit } }` | Mobile (`services/ghatService.ts`), Admin (`services/adminApi.ts`) |
| `GET` | `/v1/ghats/:id` | Public (Rate-limited) | None | Param: `:id` | `{ data: Ghat }` | Mobile (`services/ghatService.ts`), Admin (`services/adminApi.ts`) |
| `GET` | `/v1/ghats/:id/notices` | Public (Rate-limited) | None | Param: `:id` | `{ data: GhatNotice[] }` | Mobile (`services/ghatService.ts`) |
| `GET` | `/v1/ghats/:id/facilities` | Public (Rate-limited) | None | Param: `:id` | `{ data: GhatFacility[] }` | Mobile (`services/ghatService.ts`), Admin (`services/adminApi.ts`) |
| `GET` | `/v1/ghats/:id/crowd` | Public (Rate-limited) | None | Param: `:id` | `{ data: CrowdStatus }` | Mobile (`services/ghatService.ts`) |
| `GET` | `/v1/ghats/:id/nearby` | Public (Rate-limited) | None | Param: `:id`, Query: `?type=&radius=&lang=` | `{ data: NearbyPlace[], meta: { fromCache, totalPlaces } }` | Mobile (`services/placesService.ts`) |
| `POST` | `/v1/crowd-reports` | Public (Rate-limited) | None | `{ ghat_id: string, reported_crowd_level: string, lat: number, lng: number, device_fingerprint: string }` | `{ success: true, data: CrowdReport }` | Mobile (`components/CrowdReportModal.tsx`) |
| `GET` | `/v1/news` | Public (Rate-limited) | None | `?ghat=&category=&lang=&page=&limit=` | `{ data: NewsPost[], pagination: { total, page, limit } }` | Mobile (`services/newsService.ts`), Admin (`services/adminApi.ts`) |
| `GET` | `/v1/news/:id` | Public (Rate-limited) | None | Param: `:id` | `{ data: NewsPost }` | Mobile (`services/newsService.ts`), Admin (`services/adminApi.ts`) |
| `POST` | `/v1/devices` | Public / Optional Auth (Rate-limited) | None | `{ fcmToken \| token, language, topics?, ghat_topics?, platform? }` | `{ success: true, message, device }` | Mobile (`services/push.ts`, `services/api.ts`) |
| `GET` | `/v1/devices/:token` | Public | None | Param: `:token` | `{ data: DeviceTokenRecord }` | Mobile (`services/push.ts`) |
| `POST` | `/v1/issues` | Public / Optional Auth (Rate-limited) | None | `{ category, description, photo_url?, location_type, lat, lng, qr_zone_id?, ghat_id?, reporter_phone?, device_fingerprint?, client_metadata? }` | `{ success: true, data: IssueReport }` | Mobile (`services/issueService.ts`) |
| `GET` | `/v1/issues/mine` | Public / Optional Auth | None | `?device_fingerprint=` or Bearer token | `{ data: IssueReport[] }` | Mobile (`services/issueService.ts`) |
| `GET` | `/v1/issues/:ticket_no` | Public | None | Param: `:ticket_no` | `{ data: { issue: IssueReport, timeline: IssueUpdate[] } }` | Mobile (`services/issueService.ts`) |
| `POST` | `/v1/issues/upload-url` | Public (Rate-limited) | None | `{ filename: string, mimeType: string, fileSize: number }` | `{ uploadUrl, token, key, expiresAt, maxSizeBytes }` | Mobile (`services/issueService.ts`) |
| `PUT` | `/v1/issues/upload/storage/:token` | Public | None | Param: `:token`, Body: Binary Image Buffer (max 6MB) | `{ photoUrl, key, size, format }` | Mobile (`services/issueService.ts`) |
| `POST` | `/v1/issues/upload` | Public (Rate-limited) | None | Multipart Form (`photo` file) | `{ photoUrl, key, size, format }` | Mobile fallback / Web preview |
| `POST` | `/v1/sos` | Public / Optional Auth (Rate-limited) | None | `{ type, channel?, lat?, lng?, accuracy_m?, zoneCode?, phone?, deviceId?, language?, metadata? }` | `{ success: true, data: { id, status, severity, type, channel, statusToken, trackingUrl, createdAt, isDuplicate }, message }` | Mobile (`services/sosService.ts`), Web QR SOS (`public/sos/index.html`) |
| `GET` | `/v1/sos/:id/status` | Public | None | Param: `:id`, Query: `?token=<status_token>` or Header: `x-status-token` | `{ success: true, data: { alert, updates } }` | Mobile (`services/sosService.ts`), Web QR SOS (`public/sos/index.html`) |
| `POST` | `/v1/sos/:id/cancel` | Public | None | Param: `:id`, Body: `{ token: string, reason?: string }` | `{ success: true, message }` | Mobile (`services/sosService.ts`), Web QR SOS (`public/sos/index.html`) |
| `GET` | `/v1/emergency-contacts` | Public | None | `?ghatId=` | `{ success: true, data: EmergencyContact[] }` | Mobile (`services/sosService.ts`), Web QR SOS (`public/sos/index.html`) |
| `POST` | `/v1/sos/sms-webhook` | Webhook (Signature verified) | None | Gateway-dependent SMS payload (`From`, `Body`) | `{ success: true, alertId, status }` | Telecom SMS Gateway / Twilio / Karix |
| `POST` | `/v1/integrations/iccc/webhook` | Webhook (Feature flag `ICCC_ENABLED`) | None | `{ alertId, eventType, timestamp, location, severity, payload }` | `{ status: 'received', alertId, receivedAt }` | District ICCC Integration Gateway |
| `GET` | `/v1/integrations/iccc/export` | Admin Auth (`ICCC_ENABLED`) | Admin | None | `{ status: 'ok', exportedAt, issues, alerts }` | District ICCC Integration Gateway |
| `GET` | `/v1/admin/settings` | Admin Auth | `settings.write` | None | `{ settings: SettingRecord[] }` | Admin (`pages/SettingsPage.tsx`) |
| `PATCH` | `/v1/admin/settings` | Admin Auth | `settings.write` | `{ key, value, reason? }` or `{ settings: { [key]: value }, reason? }` | `{ message, updated: SettingRecord[] }` | Admin (`pages/SettingsPage.tsx`) |
| `GET` | `/v1/admin/audit-logs` | Admin Auth | `audit.read` | `?page=&limit=&entity=&admin=&date=&startDate=&endDate=` | `{ items, total, page, limit, totalPages }` | Admin (`pages/AuditLogsPage.tsx`) |
| `GET` | `/v1/admin/usage` | Admin Auth | Admin | None | `{ monthlyQuota, currentMonthUsage, currentMonthCost, quotaRemaining, quotaPercentUsed, providers, dailyUsage }` | Admin (`pages/UsagePage.tsx`) |
| `POST` | `/v1/admin/ghats` | Admin Auth | `ghats.create` | `{ name, district, state, lat, lng, nearest_town, nearest_railway_station, nearest_bus_stand, official_source_url?, verified_at?, bathing_status?, crowd_level?, publish_status?, description?, max_capacity?, sources?, facilities?, aarti_timings? }` | `{ data: Ghat }` | Admin (`pages/GhatsPage.tsx`) |
| `PATCH` | `/v1/admin/ghats/:id` | Admin Auth | `ghats.update` | Param: `:id`, Partial Ghat fields | `{ data: Ghat }` | Admin (`pages/GhatsPage.tsx`) |
| `PATCH` | `/v1/admin/ghats/:id/publish-status` | Admin Auth | `ghats.publish` | Param: `:id`, Body: `{ publish_status: 'draft'\|'published'\|'hidden', reason?: string }` | `{ data: Ghat }` | Admin (`pages/GhatsPage.tsx`) |
| `POST` | `/v1/admin/ghats/:id/crowd-override` | Admin Auth | `crowd.override` | Param: `:id`, Body: `{ level: string, reason: string, note?: LocalizedText }` | `{ data: CrowdStatus }` | Admin (`pages/GhatsPage.tsx`) |
| `POST` | `/v1/admin/notices` | Admin Auth | `notices.publish` | `{ ghat_id: string, title: LocalizedText, message: LocalizedText, severity: 'info'\|'warning'\|'emergency', starts_at?: string, ends_at?: string }` | `{ data: GhatNotice }` | Admin (`pages/GhatsPage.tsx`) |
| `POST` | `/v1/admin/news` | Admin Auth | `news.publish` | `{ title: LocalizedText, content: LocalizedText, summary?: LocalizedText, category, priority, ghat_ids?: string[], source_url?, is_official?, is_pinned?, publish_status, expires_at?, notify_immediately? }` | `{ data: NewsPost }` | Admin (`pages/NewsPage.tsx`) |
| `PATCH` | `/v1/admin/news/:id` | Admin Auth | `news.publish` | Param: `:id`, Partial NewsPost fields | `{ data: NewsPost }` | Admin (`pages/NewsPage.tsx`) |
| `DELETE` | `/v1/admin/news/:id` | Admin Auth | `news.delete` | Param: `:id` | `{ success: true, message }` | Admin (`pages/NewsPage.tsx`) |
| `POST` | `/v1/admin/news/draft-translate` | Admin Auth | `news.publish` | `{ text: string, targetLanguage: 'te'\|'hi' }` | `{ translatedText: string }` | Admin (`pages/NewsPage.tsx`) |
| `POST` | `/v1/admin/ghats/:id/facilities` | Admin Auth | `ghats.update` | Param: `:id`, `{ facility_type, details: LocalizedText, is_operational?, count?, source_url? }` | `{ data: GhatFacility }` | Admin (`pages/GhatsPage.tsx`) |
| `PATCH` | `/v1/admin/ghats/:ghatId/facilities/:facilityId` | Admin Auth | `ghats.update` | Params: `:ghatId`, `:facilityId`, Partial fields | `{ data: GhatFacility }` | Admin (`pages/GhatsPage.tsx`) |
| `DELETE` | `/v1/admin/ghats/:ghatId/facilities/:facilityId` | Admin Auth | `ghats.update` | Params: `:ghatId`, `:facilityId` | `{ success: true, message }` | Admin (`pages/GhatsPage.tsx`) |
| `GET` | `/v1/admin/issues` | Admin Auth | `issues.read` | `?status=&category=&priority=&ghat_id=&page=&limit=` | `{ data: IssueReport[], total, page, limit }` | Admin (`pages/IssuesPage.tsx`) |
| `GET` | `/v1/admin/issues/:id` | Admin Auth | `issues.read` | Param: `:id` | `{ data: { issue: IssueReport, timeline: IssueUpdate[] } }` | Admin (`pages/IssuesPage.tsx`) |
| `PATCH` | `/v1/admin/issues/:id/status` | Admin Auth | `issues.update` | Param: `:id`, Body: `{ status, public_note?, internal_note?, resolution_photo_url? }` | `{ data: IssueReport }` | Admin (`pages/IssuesPage.tsx`) |
| `POST` | `/v1/admin/issues/:id/updates` | Admin Auth | `issues.update` | Param: `:id`, Body: `{ status, public_note?, internal_note?, resolution_photo_url? }` | `{ data: IssueUpdate }` | Admin (`pages/IssuesPage.tsx`) |
| `GET` | `/v1/admin/places/curated` | Admin Auth | `places.read` | `?type=all\|hotel\|temple\|transport_hub` | `{ data: { hotels, temples, transport_hubs } }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `POST` | `/v1/admin/places/hotels` | Admin Auth | `places.create` | Hotel creation payload | `{ data: Hotel }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `PATCH` | `/v1/admin/places/hotels/:id` | Admin Auth | `places.update` | Param: `:id`, Partial Hotel | `{ data: Hotel }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `DELETE` | `/v1/admin/places/hotels/:id` | Admin Auth | `places.delete` | Param: `:id` | `{ success: true }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `POST` | `/v1/admin/places/temples` | Admin Auth | `places.create` | Temple creation payload | `{ data: Temple }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `PATCH` | `/v1/admin/places/temples/:id` | Admin Auth | `places.update` | Param: `:id`, Partial Temple | `{ data: Temple }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `DELETE` | `/v1/admin/places/temples/:id` | Admin Auth | `places.delete` | Param: `:id` | `{ success: true }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `POST` | `/v1/admin/places/transport-hubs` | Admin Auth | `places.create` | Hub creation payload | `{ data: TransportHub }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `PATCH` | `/v1/admin/places/transport-hubs/:id` | Admin Auth | `places.update` | Param: `:id`, Partial Hub | `{ data: TransportHub }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `DELETE` | `/v1/admin/places/transport-hubs/:id` | Admin Auth | `places.delete` | Param: `:id` | `{ success: true }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `GET` | `/v1/admin/places/overrides` | Admin Auth | `places.read` | None | `{ data: PlaceOverride[] }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `POST` | `/v1/admin/places/overrides` | Admin Auth | `places.update` | `{ place_id, name_override?, phone_override?, address_override?, custom_notes?, is_hidden? }` | `{ data: PlaceOverride }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `DELETE` | `/v1/admin/places/overrides/:id` | Admin Auth | `places.delete` | Param: `:id` | `{ success: true }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `GET` | `/v1/admin/places/cache-status` | Admin Auth | `places.cache` | None | `{ data: { cachedEntries, expiredEntries, totalCachedPlaces, usageToday } }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `POST` | `/v1/admin/places/prewarm` | Admin Auth | `places.cache` | `{ radiusM?: number }` | `{ success: true, message, prewarmedCount }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `POST` | `/v1/admin/places/cache/invalidate` | Admin Auth | `places.cache` | `{ ghatId?: string }` | `{ success: true, message, deletedRows }` | Admin (`pages/NearbyPlacesAdminPage.tsx`) |
| `GET` | `/v1/admin/sos` | Admin Auth | `sos.read` | `?status=&type=&ghatId=&page=&limit=` | `{ success: true, data: SosAlertAdminRecord[], total, page, limit, totalPages }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `GET` | `/v1/admin/sos/:id` | Admin Auth | `sos.read` | Param: `:id` | `{ success: true, data: { alert, updates, duplicates } }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `PATCH` | `/v1/admin/sos/:id/status` | Admin Auth | `sos.update` | Param: `:id`, Body: `{ status, note, isPublic?: boolean }` | `{ success: true, data: SosAlertAdminRecord, message }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `POST` | `/v1/admin/sos/:id/assign` | Admin Auth | `sos.update` | Param: `:id`, Body: `{ assignedToName, assignedToPhone, note? }` | `{ success: true, data: SosAlertAdminRecord, message }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `POST` | `/v1/admin/sos/:id/notes` | Admin Auth | `sos.update` | Param: `:id`, Body: `{ note, isPublic?: boolean }` | `{ success: true, data: SosUpdateRecord, message }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `POST` | `/v1/admin/sos/merge` | Admin Auth | `sos.update` | Body: `{ sourceAlertId, targetAlertId, reason }` | `{ success: true, message }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `GET` | `/v1/admin/sos/zones/:zoneCode/poster` | Admin Auth | `sos.read` | Param: `:zoneCode` | Printable HTML Document | Admin / Print QR Station |
| `GET` | `/v1/admin/sos/zones` | Admin Auth | `sos.read` | None | `{ success: true, data: QrZoneRecord[] }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `POST` | `/v1/admin/sos/zones` | Admin Auth | `sos.update` | Body: `{ zoneCode, label: LocalizedText, ghatId?, lat?, lng? }` | `{ success: true, data: QrZoneRecord }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `PATCH` | `/v1/admin/sos/zones/:id` | Admin Auth | `sos.update` | Param: `:id`, Partial Zone fields | `{ success: true, data: QrZoneRecord }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `GET` | `/v1/admin/sos/contacts` | Admin Auth | `sos.read` | None | `{ success: true, data: EmergencyContactRecord[] }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `POST` | `/v1/admin/sos/contacts` | Admin Auth | `sos.update` | Body: `{ label: LocalizedText, phone, kind, ghatId?, sortOrder? }` | `{ success: true, data: EmergencyContactRecord }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `PATCH` | `/v1/admin/sos/contacts/:id` | Admin Auth | `sos.update` | Param: `:id`, Partial Contact fields | `{ success: true, data: EmergencyContactRecord }` | Admin (`pages/SOSDashboardPage.tsx`) |
| `DELETE` | `/v1/admin/sos/contacts/:id` | Admin Auth | `sos.update` | Param: `:id` | `{ success: true, message }` | Admin (`pages/SOSDashboardPage.tsx`) |

---

## 2. Complete Database Table Catalog (`PostgreSQL` / `PostGIS`)

| Table Name | Owning Module | Primary Key | Columns & Data Types | Foreign Keys | Key Indexes |
|---|---|---|---|---|---|
| `users` | Module 1 (Auth) | `id UUID` | `id, firebase_uid VARCHAR(128) UNIQUE, phone VARCHAR(20) UNIQUE, name VARCHAR(100), language VARCHAR(10), status VARCHAR(20), consent_version VARCHAR(50), consent_at TIMESTAMPTZ, created_at TIMESTAMPTZ, last_login_at TIMESTAMPTZ` | None | `idx_users_phone`, `idx_users_firebase_uid` |
| `refresh_tokens` | Module 1 (Auth) | `id UUID` | `id, user_id UUID, token_hash VARCHAR(64) UNIQUE, expires_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE CASCADE` | `idx_refresh_tokens_hash`, `idx_refresh_tokens_user_id` |
| `admins` | Module 11 (Platform) | `id UUID` | `id, user_id UUID UNIQUE, role VARCHAR(50), permissions JSONB, role_id UUID, created_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE CASCADE`, `role_id -> roles(id) ON DELETE CASCADE` | `user_id` unique constraint |
| `roles` | Module 11 (Platform) | `id UUID` | `id, name TEXT UNIQUE` | None | `name` unique |
| `permissions` | Module 11 (Platform) | `id UUID` | `id, name TEXT UNIQUE` | None | `name` unique |
| `role_permissions` | Module 11 (Platform) | `(role_id, permission_id)` | `role_id UUID, permission_id UUID` | `role_id -> roles(id) ON DELETE CASCADE`, `permission_id -> permissions(id) ON DELETE CASCADE` | Composite PK |
| `settings` | Module 11 (Platform) | `key TEXT` | `key TEXT, value JSONB, updated_by UUID, updated_at TIMESTAMPTZ` | `updated_by -> users(id) ON DELETE SET NULL` | PK on `key` |
| `audit_logs` | Module 11 (Platform) | `id UUID` | `id, admin_id UUID, action TEXT, entity_type TEXT, entity_id TEXT, old_value JSONB, new_value JSONB, source_url TEXT, reason TEXT, created_at TIMESTAMPTZ` | `admin_id -> users(id) ON DELETE SET NULL` | `idx_audit_logs_entity`, `idx_audit_logs_created_at`, `idx_audit_logs_admin_id` |
| `api_usage_logs` | Module 11 (Platform) | `id UUID` | `id, provider TEXT, endpoint TEXT, status INTEGER, cost_estimate NUMERIC(10,4), created_at TIMESTAMPTZ` | None | `idx_api_usage_provider_date` |
| `device_tokens` | Module 9 & 11 (Push) | `id UUID` | `id, token TEXT UNIQUE, fcm_token TEXT UNIQUE, user_id UUID, language VARCHAR(10), topics TEXT[], ghat_topics TEXT[], platform TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE SET NULL` | `idx_device_tokens_token`, `idx_device_tokens_fcm`, `idx_device_tokens_language`, `idx_device_tokens_ghats GIN` |
| `ghats` | Module 3 (Ghats) | `id UUID` | `id, name JSONB, river VARCHAR(100), district VARCHAR(100), state VARCHAR(100), lat NUMERIC(10,7), lng NUMERIC(10,7), geom geometry(Point,4326), nearest_town JSONB, nearest_railway_station JSONB, nearest_bus_stand JSONB, official_source_url TEXT, verified_at TIMESTAMPTZ, record_status VARCHAR(30), bathing_status VARCHAR(20), crowd_level VARCHAR(20), publish_status VARCHAR(20), description JSONB, max_capacity INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | None | `idx_ghats_state_district`, `idx_ghats_publish_status`, `idx_ghats_bathing_status`, `idx_ghats_crowd_level`, `idx_ghats_lat_lng`, `idx_ghats_geom GIST` |
| `ghat_sources` | Module 3 (Ghats) | `id UUID` | `id, ghat_id UUID, source_url TEXT, source_name VARCHAR(255), source_type VARCHAR(50), is_official BOOLEAN, last_verified_at TIMESTAMPTZ, notes TEXT, created_at TIMESTAMPTZ` | `ghat_id -> ghats(id) ON DELETE CASCADE` | `idx_ghat_sources_ghat_id` |
| `ghat_facilities` | Module 3 & 9 (Facilities) | `id UUID` | `id, ghat_id UUID, facility_type VARCHAR(50), details JSONB, is_operational BOOLEAN, count INTEGER, source_url TEXT, last_verified_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | `ghat_id -> ghats(id) ON DELETE CASCADE` | `idx_ghat_facilities_ghat_id`, `idx_ghat_facilities_type` |
| `ghat_aarti_timings` | Module 3 (Ghats) | `id UUID` | `id, ghat_id UUID, name JSONB, time_start TIME, time_end TIME, description JSONB, days_of_week VARCHAR(50), created_at TIMESTAMPTZ` | `ghat_id -> ghats(id) ON DELETE CASCADE` | `idx_ghat_aarti_ghat_id` |
| `ghat_notices` | Module 3 (Ghats) | `id UUID` | `id, ghat_id UUID, title JSONB, message JSONB, severity VARCHAR(20), is_active BOOLEAN, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | `ghat_id -> ghats(id) ON DELETE CASCADE` | `idx_ghat_notices_ghat_id`, `idx_ghat_notices_active` |
| `crowd_reports` | Module 3 (Crowd) | `id UUID` | `id, ghat_id UUID, user_id VARCHAR(128), device_fingerprint VARCHAR(128), reported_crowd_level VARCHAR(20), reported_lat NUMERIC(10,7), reported_lng NUMERIC(10,7), distance_meters NUMERIC(10,2), is_verified_proximity BOOLEAN, ip_address VARCHAR(45), created_at TIMESTAMPTZ` | `ghat_id -> ghats(id) ON DELETE CASCADE` | `idx_crowd_reports_ghat_created`, `idx_crowd_reports_device_rate` |
| `crowd_status` | Module 3 (Crowd) | `id UUID` | `id, ghat_id UUID UNIQUE, current_level VARCHAR(20), source_type VARCHAR(50), override_by_admin_id VARCHAR(128), confidence_score NUMERIC(3,2), recent_report_count INTEGER, note JSONB, updated_at TIMESTAMPTZ` | `ghat_id -> ghats(id) ON DELETE CASCADE` | `idx_crowd_status_ghat_id` |
| `news_posts` | Module 9 (News) | `id UUID` | `id, title JSONB, content JSONB, summary JSONB, category VARCHAR(50), priority VARCHAR(20), ghat_ids UUID[], source_url TEXT, is_official BOOLEAN, is_pinned BOOLEAN, publish_status VARCHAR(20), published_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, notify_sent BOOLEAN, created_by VARCHAR(128), created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | None | `idx_news_posts_publish_status`, `idx_news_posts_category`, `idx_news_posts_is_pinned`, `idx_news_posts_expires_at`, `idx_news_posts_published_at`, `idx_news_posts_ghat_ids GIN` |
| `issue_reports` | Module 8 (Issues) | `id UUID` | `id, ticket_no VARCHAR(32) UNIQUE, category VARCHAR(30), description TEXT, photo_url TEXT, location_type VARCHAR(20), lat NUMERIC(10,7), lng NUMERIC(10,7), geom geometry(Point,4326), qr_zone_id VARCHAR(100), ghat_id UUID, status VARCHAR(30), priority VARCHAR(20), reporter_id UUID, reporter_phone VARCHAR(20), reporter_device_token TEXT, device_fingerprint VARCHAR(128), is_duplicate BOOLEAN, duplicate_of_ticket_no VARCHAR(32), duplicate_count INTEGER, client_metadata JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | `ghat_id -> ghats(id) ON DELETE SET NULL`, `reporter_id -> users(id) ON DELETE SET NULL` | `idx_issue_reports_ticket_no`, `idx_issue_reports_status`, `idx_issue_reports_category`, `idx_issue_reports_reporter_id`, `idx_issue_reports_lat_lng`, `idx_issue_reports_geom GIST` |
| `issue_updates` | Module 8 (Issues) | `id UUID` | `id, issue_id UUID, status VARCHAR(30), public_note TEXT, internal_note TEXT, resolution_photo_url TEXT, updated_by_admin_id VARCHAR(128), created_at TIMESTAMPTZ` | `issue_id -> issue_reports(id) ON DELETE CASCADE` | `idx_issue_updates_issue_id`, `idx_issue_updates_status` |
| `nearby_places_cache` | Module 5 (Places) | `id UUID` | `id, ghat_id UUID, type VARCHAR(50), radius_m INTEGER, results JSONB, fetched_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, CONSTRAINT uq_nearby_cache UNIQUE (ghat_id, type, radius_m)` | `ghat_id -> ghats(id) ON DELETE CASCADE` | `idx_nearby_cache_lookup`, `idx_nearby_cache_expires` |
| `hotels` | Module 5 (Places) | `id UUID` | `id, name JSONB, description JSONB, address JSONB, phone VARCHAR(50), lat NUMERIC(10,7), lng NUMERIC(10,7), geom geometry(Point,4326), rating NUMERIC(3,2), price_range VARCHAR(50), room_types JSONB, photo_url TEXT, website_url TEXT, is_verified BOOLEAN, is_hidden BOOLEAN, source_url TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | None | `idx_hotels_lat_lng`, `idx_hotels_is_hidden`, `idx_hotels_geom GIST` |
| `temples` | Module 5 (Places) | `id UUID` | `id, name JSONB, description JSONB, address JSONB, phone VARCHAR(50), lat NUMERIC(10,7), lng NUMERIC(10,7), geom geometry(Point,4326), deity JSONB, darshan_timings JSONB, special_entry_info JSONB, photo_url TEXT, website_url TEXT, is_verified BOOLEAN, is_hidden BOOLEAN, source_url TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | None | `idx_temples_lat_lng`, `idx_temples_is_hidden`, `idx_temples_geom GIST` |
| `transport_hubs` | Module 5 (Places) | `id UUID` | `id, name JSONB, description JSONB, hub_type VARCHAR(50), address JSONB, phone VARCHAR(50), lat NUMERIC(10,7), lng NUMERIC(10,7), geom geometry(Point,4326), operating_hours JSONB, is_hidden BOOLEAN, source_url TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | None | `idx_transport_hubs_lat_lng`, `idx_transport_hubs_hub_type`, `idx_transport_hubs_is_hidden`, `idx_transport_hubs_geom GIST` |
| `place_overrides` | Module 5 (Places) | `id UUID` | `id, place_id VARCHAR(255) UNIQUE, name_override JSONB, phone_override VARCHAR(50), address_override JSONB, custom_notes JSONB, is_hidden BOOLEAN, verified_by_admin_id VARCHAR(128), created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | None | `idx_place_overrides_place_id`, `idx_place_overrides_is_hidden` |
| `places_api_usage` | Module 5 (Places) | `id UUID` | `id, usage_date DATE, call_count INTEGER, endpoint VARCHAR(100), last_called_at TIMESTAMPTZ, created_at TIMESTAMPTZ, CONSTRAINT uq_places_api_usage UNIQUE (usage_date, endpoint)` | None | `idx_places_api_usage_date` |
| `qr_zones` | Module 7 (SOS) | `id UUID` | `id, zone_code VARCHAR(50) UNIQUE, ghat_id UUID, label JSONB, lat NUMERIC(10,7), lng NUMERIC(10,7), geom geometry(Point,4326), active BOOLEAN, created_at TIMESTAMPTZ` | `ghat_id -> ghats(id) ON DELETE SET NULL` | `zone_code` unique, `qr_zones.geom GIST` |
| `emergency_contacts` | Module 7 (SOS) | `id UUID` | `id, label JSONB, phone VARCHAR(30), kind VARCHAR(30), ghat_id UUID, sort_order INTEGER, active BOOLEAN, created_at TIMESTAMPTZ` | `ghat_id -> ghats(id) ON DELETE SET NULL` | `idx_emergency_contacts_ghat_id` |
| `sos_alerts` | Module 7 (SOS) | `id UUID` | `id, user_id UUID, phone VARCHAR(30), channel VARCHAR(20), type VARCHAR(30), lat NUMERIC(10,7), lng NUMERIC(10,7), geom geometry(Point,4326), accuracy_m NUMERIC(10,2), ghat_id UUID, zone_id UUID, zone_code VARCHAR(50), language VARCHAR(10), status VARCHAR(30), severity INTEGER, assigned_to_name VARCHAR(150), assigned_to_phone VARCHAR(30), device_id VARCHAR(150), idempotency_key VARCHAR(150), status_token VARCHAR(100), merged_into_id UUID, metadata JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | `user_id -> users(id) ON DELETE SET NULL`, `ghat_id -> ghats(id) ON DELETE SET NULL`, `zone_id -> qr_zones(id) ON DELETE SET NULL`, `merged_into_id -> sos_alerts(id) ON DELETE SET NULL` | `idx_sos_alerts_status_severity`, `idx_sos_alerts_device_id`, `idx_sos_alerts_phone`, `idx_sos_alerts_status_token`, `idx_sos_alerts_idempotency_key`, `idx_sos_alerts_geom GIST` |
| `sos_updates` | Module 7 (SOS) | `id UUID` | `id, alert_id UUID, admin_id UUID, status VARCHAR(30), note TEXT, is_public BOOLEAN, created_at TIMESTAMPTZ` | `alert_id -> sos_alerts(id) ON DELETE CASCADE`, `admin_id -> users(id) ON DELETE SET NULL` | `idx_sos_updates_alert_id` |

---

## 3. UI Screens and Admin Pages Catalog

### Mobile Screens (`mobile/src/app`)

| Screen File / Route | Component | Purpose | Endpoints Called |
|---|---|---|---|
| `(auth)/landing.tsx` | LandingScreen | Welcome, language selection, guest browse vs login | None directly (uses AuthContext, sets guest mode) |
| `(auth)/phone.tsx` | PhoneScreen | Input mobile number, initiate Firebase OTP | Firebase Client SDK (`signInWithPhoneNumber`) |
| `(auth)/otp.tsx` | OTPScreen | Verify 6-digit OTP, exchange Firebase token | `POST /v1/auth/firebase` |
| `(auth)/register.tsx` | RegisterScreen | Complete pilgrim profile name & language | `PATCH /v1/me` |
| `(app)/index.tsx` | AppHomeScreen | Dashboard, urgent advisory banner, quick actions | `GET /v1/news` (via banner), `GET /v1/ghats` (via nearest GPS search), `POST /v1/auth/logout`, `DELETE /v1/me` |
| `(app)/ghats/index.tsx` | GhatListScreen | Searchable, filterable ghats list with offline cache | `GET /v1/ghats` |
| `(app)/ghats/map.tsx` | GhatMapScreen | Map visualization of ghats with crowd status pins | `GET /v1/ghats`, `GET /v1/ghats/:id/crowd` |
| `(app)/ghats/[id].tsx` | GhatDetailScreen | Full ghat info, facilities, aarti times, directions | `GET /v1/ghats/:id`, `GET /v1/ghats/:id/crowd`, `GET /v1/ghats/:id/notices`, `POST /v1/crowd-reports` |
| `(app)/ghats/nearby.tsx` | NearbyPlacesScreen | Hotels, temples, transport hubs around selected ghat | `GET /v1/ghats/:id/nearby` |
| `(app)/news/index.tsx` | NewsListScreen | Official advisory and news feed with offline cache | `GET /v1/news` |
| `(app)/news/[id].tsx` | NewsDetailScreen | Full news article view with verified source links | `GET /v1/news/:id` |
| `(app)/issues/index.tsx` | MyIssuesScreen | Pilgrim's reported grievances and tracking list | `GET /v1/issues/mine` |
| `(app)/issues/report.tsx` | ReportIssueScreen | Submit issue with camera photo & GPS location | `POST /v1/issues/upload-url`, `PUT /v1/issues/upload/storage/:token`, `POST /v1/issues` |
| `(app)/issues/[ticket_no].tsx` | IssueTimelineScreen | Track grievance timeline and status notes | `GET /v1/issues/:ticket_no` |
| `(app)/sos.tsx` | SOSScreen | One-tap Emergency SOS, offline SMS & 112 trigger | `POST /v1/sos`, `GET /v1/sos/:id/status`, `POST /v1/sos/:id/cancel`, `GET /v1/emergency-contacts` |
| `(app)/seva.tsx` | SevaScreen | Virtual Seva / volunteer assistance (Placeholder) | None (Static sample list, Module 10 placeholder) |
| `(app)/more.tsx` | MoreScreen | Settings, language switcher, clear cache, logout | `POST /v1/auth/logout`, `DELETE /v1/me` |

### Admin Console Pages (`admin/src/pages`)

| Page File / Route | Component | Purpose | Endpoints & Socket Events |
|---|---|---|---|
| `/` | `DashboardPage.tsx` | Control room overview metrics & live counts | `GET /v1/ghats`, `GET /v1/admin/issues`, `GET /v1/admin/sos` |
| `/sos` | `SOSDashboardPage.tsx` | Live emergency dispatch console, sound alert, map | `GET /v1/admin/sos`, `PATCH /v1/admin/sos/:id/status`, `POST /v1/admin/sos/:id/assign`, `POST /v1/admin/sos/:id/notes`, `POST /v1/admin/sos/merge`, `GET/POST/PATCH /v1/admin/sos/zones`, `GET/POST/PATCH/DELETE /v1/admin/sos/contacts`, WebSocket `sos:new_alert`, `sos:status_updated`, `sos:cluster_alert` |
| `/ghats` | `GhatsPage.tsx` | Ghat directory, facilities, notices, crowd override | `GET /v1/ghats`, `POST /v1/admin/ghats`, `PATCH /v1/admin/ghats/:id`, `PATCH /v1/admin/ghats/:id/publish-status`, `POST /v1/admin/ghats/:id/crowd-override`, `POST /v1/admin/notices`, `GET/POST/PATCH/DELETE /v1/admin/ghats/:id/facilities` |
| `/places` | `NearbyPlacesAdminPage.tsx` | Curated hotels, temples, transport hubs, overrides, cache | `GET /v1/admin/places/curated`, `POST/PATCH/DELETE /v1/admin/places/hotels`, `POST/PATCH/DELETE /v1/admin/places/temples`, `POST/PATCH/DELETE /v1/admin/places/transport-hubs`, `GET/POST/DELETE /v1/admin/places/overrides`, `GET /v1/admin/places/cache-status`, `POST /v1/admin/places/prewarm`, `POST /v1/admin/places/cache/invalidate` |
| `/news` | `NewsPage.tsx` | Draft, translate, publish, and broadcast news | `GET /v1/news`, `POST /v1/admin/news`, `PATCH /v1/admin/news/:id`, `DELETE /v1/admin/news/:id`, `POST /v1/admin/news/draft-translate` |
| `/issues` | `IssuesPage.tsx` | Grievance resolution, dispatch response, timeline | `GET /v1/admin/issues`, `GET /v1/admin/issues/:id`, `PATCH /v1/admin/issues/:id/status`, `POST /v1/admin/issues/:id/updates` |
| `/audit-logs` | `AuditLogsPage.tsx` | Immutable audit trail viewer with old/new diffs | `GET /v1/admin/audit-logs` |
| `/settings` | `SettingsPage.tsx` | Dynamic configuration (cache days, limits, quotas) | `GET /v1/admin/settings`, `PATCH /v1/admin/settings` |
| `/usage` | `UsagePage.tsx` | External API quota consumption and cost tracker | `GET /v1/admin/usage` |
| `/seva` | `SevaPage.tsx` | Virtual Seva / volunteer requests (Placeholder) | Module 10 placeholder |

---

## 4. Environment Variables Audit

### Backend (`backend/`)

| Variable | Documented in `.env.example`? | Required / Optional | Default Value | Notes |
|---|---|---|---|---|
| `PORT` | Yes | Optional | `4000` | Port HTTP server binds to |
| `NODE_ENV` | Yes | Optional | `development` | `development`, `production`, `test` |
| `DATABASE_URL` | Yes | Required | `postgresql://postgres:postgres@localhost:5432/smart_pushkaralu` | Connection string for PostgreSQL / Neon |
| `JWT_SECRET` | Yes | Required | Development fallback string | Used for signing user access tokens |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Yes | Optional | `undefined` | Path to JSON key for Firebase Admin Auth & FCM |
| `ADMIN_PHONES` | Yes | Optional | `""` | Comma-separated allowlist of super admin phones |
| `CORS_ORIGINS` | Yes | Optional | `http://localhost:5173,http://localhost:8081,http://localhost:3000` | CORS allowlist |
| `ICCC_ENABLED` | Yes | Optional | `false` | Feature flag for ICCC integration |
| `MONTHLY_API_FREE_QUOTA` | Yes | Optional | `10000` | API call quota threshold |
| `SENTRY_DSN` | Yes | Optional | `""` | Error monitoring |
| `LOG_LEVEL` | Yes | Optional | `info` | Pino log level |
| `GOOGLE_PLACES_API_KEY` | **NO (Missing from .env.example)** | Optional | `""` | Used for Places API (New) nearby search |
| `PLACES_CACHE_EXPIRY_DAYS` | **NO (Missing from .env.example)** | Optional | `7` | Days before cached nearby places expire |
| `PLACES_API_DAILY_LIMIT` | **NO (Missing from .env.example)** | Optional | `500` | Daily Places API budget guard ceiling |
| `SPEED_FACTOR_DRIVING_KMH` | **NO (Missing from .env.example)** | Optional | `15` | Crowd-adjusted driving speed estimate |
| `SPEED_FACTOR_WALKING_KMH` | **NO (Missing from .env.example)** | Optional | `4.5` | Crowd-adjusted walking speed estimate |
| `SOS_DEFAULT_NUMBER` | Yes | Optional | `112` | Emergency fallback number |
| `SOS_SMS_GATEWAY_ADAPTER` | Yes | Optional | `mock` | `mock` or `generic` gateway adapter |
| `SOS_WEBHOOK_SECRET` | Yes | Optional | Development fallback key | Secret for validating inbound SMS webhook |
| `SOS_WEB_BASE_URL` | Yes | Optional | `http://localhost:4000` | Public URL for QR poster links |
| `SOS_BACKUP_NOTIFY_PHONE` | Yes | Optional | `""` | Escalation SMS backup recipient |
| `SOS_RATE_LIMIT_PER_HOUR` | Yes | Optional | `10` | SOS rate limit per IP/device |
| `SOS_DEDUP_WINDOW_MINUTES` | Yes | Optional | `5` | Window for merging rapid duplicate alerts |
| `SOS_CLUSTER_THRESHOLD` | Yes | Optional | `5` | Incident cluster count threshold |
| `SOS_CLUSTER_WINDOW_MINUTES` | Yes | Optional | `10` | Incident cluster time window |

### Mobile (`mobile/`)

| Variable | Documented in `.env.example`? | Required / Optional | Default / Fallback | Notes |
|---|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | Yes | Required | `http://10.0.2.2:4000` (Android) / `http://localhost:4000` | Points to backend server API root |
| `EXPO_PUBLIC_SENTRY_DSN` | Yes | Optional | `""` | Sentry crash reporting for React Native |

### Admin (`admin/`)

| Variable | Documented in `.env.example`? | Required / Optional | Default / Fallback | Notes |
|---|---|---|---|---|
| `VITE_API_URL` | Yes | Required | `http://localhost:4000` | Base URL for backend API |
| `VITE_SOCKET_URL` | Yes | Required | `http://localhost:4000` | Base URL for Socket.io WebSocket server |
| `VITE_MOCK_MODE` | Yes | Optional | `false` | Mock mode toggle |

---

## 5. Third-Party Integrations Inventory

| Service | Category | Implementation Location | Calling Points | Purpose | Fallback / Mock Behavior |
|---|---|---|---|---|---|
| **Firebase Auth** | Authentication | `backend/src/services/firebase.ts`, `mobile/src/services/api.ts` | `POST /v1/auth/firebase`, `mobile/(auth)/phone.tsx`, `mobile/(auth)/otp.tsx` | Phone number OTP authentication for pilgrims | In development/test mode, allows test tokens (`test-id-token:<phone>`) when service account is absent. Guest browsing requires no authentication. |
| **Firebase Cloud Messaging (FCM)** | Push Notifications | `backend/src/lib/push.ts`, `backend/src/services/fcm.service.ts`, `mobile/src/services/push.ts` | News publish (`POST /v1/admin/news`), SOS cluster alerts, Issue updates (`PATCH /v1/admin/issues/:id/status`) | Multilingual broadcast notifications tagged by language (`lang-en`, `lang-te`, `lang-hi`) and ghat IDs (`ghat-<uuid>`) | When Firebase service account is omitted, logs message payloads safely without crashing or dropping user requests. |
| **Google Places API (New)** | Nearby POIs | `backend/src/services/places-api.service.ts` | `GET /v1/ghats/:id/nearby` | Fetches hotels, temples, and transport facilities near ghats | If `GOOGLE_PLACES_API_KEY` is not provided or budget guard is tripped (`> PLACES_API_DAILY_LIMIT`), seamlessly serves curated database places and cached records. |
| **SMS Gateway Adapter** | Emergency Ingestion & Alerts | `backend/src/services/sms-gateway.ts` | `POST /v1/sos/sms-webhook`, `SosService.createAlert` | Ingests emergency SMS / missed calls from pilgrims without smartphones; sends SMS confirmation | Built-in `MockSmsGatewayAdapter` logs SMS transmissions and parses simulated webhooks without external carrier credentials. |
| **Sentry** | Error Tracking | `backend/src/lib/sentry.ts`, `mobile/src/services/sentry.ts` | Backend request lifecycle (`app.ts`), mobile app root (`_layout.tsx`) | Production exception telemetry and performance tracing | Disabled automatically when DSN is empty or in local test environment. |
| **Sharp & Local Object Storage** | Media Processing | `backend/src/services/upload.service.ts` | `POST /v1/issues/upload`, `PUT /v1/issues/upload/storage/:token` | Sanitizes citizen photos (strips EXIF location metadata, compresses image to WebP/JPEG, enforces 5MB limit) | Local disk storage mounted at `/uploads/issues` with static file serving. |

---

## 6. Module Dependency Graph

```
                                 +-----------------------+
                                 |  Module 11: Platform  |
                                 |  (RBAC, Audit, Settings)
                                 +-----------+-----------+
                                             |
                      +----------------------+----------------------+
                      |                      |                      |
                      v                      v                      v
            +-------------------+  +-------------------+  +-------------------+
            |  Module 1: Auth   |  | Module 3: Ghats   |  |   Push / Devices  |
            | (Firebase, Users) |  |   (PostGIS Hub)   |  |    (Topics)       |
            +---------+---------+  +---------+---------+  +---------+---------+
                      |                      |                      |
         +------------+--------+-------------+-------------+        |
         |                     |                           |        |
         v                     v                           v        v
+-----------------+   +------------------+       +---------------------+
| Module 7: SOS   |   | Module 8: Issues |       | Module 9: News/Advisory
| (Alerts, Zones) |   | (Grievances, Exif)       | (Multilingual push) |
+-----------------+   +------------------+       +---------------------+
         |                     |                           |
         +---------------------+-------------+             |
                               |             |             |
                               v             v             v
                     +-------------------+  +-------------------+
                     | Module 5: Nearby  |  |    Admin Panel    |
                     | (Hotels, Temples) |  | (Command Console) |
                     +-------------------+  +-------------------+
```

### Dependency Notes:
1. **Module 3 (Ghats) is the central spatial hub**:
   - `sos_alerts.ghat_id` references `ghats.id`
   - `qr_zones.ghat_id` references `ghats.id`
   - `emergency_contacts.ghat_id` references `ghats.id`
   - `issue_reports.ghat_id` references `ghats.id`
   - `nearby_places_cache.ghat_id` references `ghats.id`
   - `news_posts.ghat_ids` array references `ghats.id`
2. **Module 1 (Users & Auth)**:
   - All admin writes across all modules attach `admin_id -> users(id)` and log to `audit_logs`
   - Citizen grievance submissions and SOS alerts optionally reference `user_id -> users(id)`
3. **Module 11 (Platform)**:
   - Enforces RBAC permissions (`can('ghats.write')`, `can('sos.update')`, etc.)
   - Manages configuration settings that govern cache TTL and rate limits

---

## 7. Audit of Placeholders, Mocks, and Development Flags

1. **Development Admin Bypass (`dev-admin-token`)**:
   - Found in `backend/src/middleware/auth.ts`, `backend/src/services/sos-socket.ts`, `admin/src/services/adminApi.ts`, `admin/src/services/socket.ts`.
   - Allows control room UI simulation in `NODE_ENV !== 'production'`. In production, strict JWT verification is enforced.
2. **Test ID Token Bypass (`test-id-token:<phone>`)**:
   - Found in `backend/src/routes/v1/auth.ts`.
   - Allows automated integration tests and browser development to authenticate without consuming real Firebase SMS OTP quota. Restricted to non-production.
3. **SMS Gateway Adapter (`MockSmsGatewayAdapter`)**:
   - Found in `backend/src/services/sms-gateway.ts`.
   - Activated when `SOS_SMS_GATEWAY_ADAPTER=mock`. Simulates carrier delivery and stores sent SMS records in memory for assertions.
4. **Mock Places Generator (`generateMockNearbyPlaces`)**:
   - Found in `backend/src/services/places-api.service.ts`.
   - Provides deterministic test places if `GOOGLE_PLACES_API_KEY` is not supplied, allowing offline and cost-free execution.
5. **Admin Mock Role Switcher (`AuthContext.tsx`)**:
   - Found in `admin/src/context/AuthContext.tsx`.
   - Allows rapid UI testing of different permission roles (`super_admin`, `control_room_operator`, `ghat_incharge`, `news_editor`).
6. **Unbuilt Modules Placeholders**:
   - **Module 10 (Virtual Seva)**: `mobile/src/app/(app)/seva.tsx` and `admin/src/pages/SevaPage.tsx`. Contains sample UI with inactive actions. Needs explicit "Coming Soon" badge.
   - **Module 2 (Route Optimisation)**, **Module 4 (Trip Planning)**, **Module 6 (Transport & Shuttles)**: Not built; no dangling references or broken imports exist.
7. **Client API URL Discrepancies**:
   - `mobile/src/services/ghatService.ts`, `newsService.ts`, and `placesService.ts` hardcoded fallback `http://localhost:4000/v1`, breaking on Android emulators where `10.0.2.2:4000` is required.
   - `admin/src/services/adminApi.ts` defaulted to `http://localhost:4000/v1` whereas `admin/src/services/api.ts` used `http://localhost:4000` and manually appended `/v1/admin/...`.


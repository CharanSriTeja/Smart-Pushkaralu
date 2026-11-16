# Database Migrations & Rollback Notes

This document provides rollback procedures for every schema migration in `backend/src/db/migrations/`.
All migrations are forward-only in automated pipelines. Rollbacks must be executed manually and cautiously with a direct database connection (`MIGRATION_DATABASE_URL`).

---

### Migration 001: `001_initial_auth.sql` & `001_auth_schema.sql`
- **Purpose:** Creates `users`, `refresh_tokens`, `admins`, `roles`, `permissions`, `role_permissions`.
- **Forward:** Creates user authentication and RBAC tables.
- **Rollback SQL:**
  ```sql
  DROP TABLE IF EXISTS role_permissions CASCADE;
  DROP TABLE IF EXISTS permissions CASCADE;
  DROP TABLE IF EXISTS admins CASCADE;
  DROP TABLE IF EXISTS refresh_tokens CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  DROP TABLE IF EXISTS roles CASCADE;
  DELETE FROM _migrations WHERE name IN ('001_initial_auth.sql', '001_auth_schema.sql');
  ```

---

### Migration 002: `002_module3_ghats.sql` & `002_platform_support.sql`
- **Purpose:** Enables PostGIS extension, creates `ghats`, `ghat_facilities`, `audit_logs`, `app_settings`.
- **Forward:** Spatial ghat directory and platform governance settings.
- **Rollback SQL:**
  ```sql
  DROP TABLE IF EXISTS ghat_facilities CASCADE;
  DROP TABLE IF EXISTS ghats CASCADE;
  DROP TABLE IF EXISTS audit_logs CASCADE;
  DROP TABLE IF EXISTS app_settings CASCADE;
  DELETE FROM _migrations WHERE name IN ('002_module3_ghats.sql', '002_platform_support.sql');
  ```

---

### Migration 003: `003_module9_news_facilities.sql`
- **Purpose:** Creates `news_posts`, `emergency_contacts`, `helplines`.
- **Forward:** News announcements and helpline directory.
- **Rollback SQL:**
  ```sql
  DROP TABLE IF EXISTS news_posts CASCADE;
  DROP TABLE IF EXISTS helplines CASCADE;
  DROP TABLE IF EXISTS emergency_contacts CASCADE;
  DELETE FROM _migrations WHERE name = '003_module9_news_facilities.sql';
  ```

---

### Migration 004: `004_module8_issues.sql`
- **Purpose:** Creates `citizen_issues`, `issue_comments`, `issue_photos`.
- **Forward:** Citizen issue reporting and resolution tracking.
- **Rollback SQL:**
  ```sql
  DROP TABLE IF EXISTS issue_photos CASCADE;
  DROP TABLE IF EXISTS issue_comments CASCADE;
  DROP TABLE IF EXISTS citizen_issues CASCADE;
  DELETE FROM _migrations WHERE name = '004_module8_issues.sql';
  ```

---

### Migration 005: `005_module5_nearby_places.sql`
- **Purpose:** Creates `nearby_places` and places cache tables.
- **Forward:** Curated temples, accommodation, and medical amenities near ghats.
- **Rollback SQL:**
  ```sql
  DROP TABLE IF EXISTS nearby_places CASCADE;
  DELETE FROM _migrations WHERE name = '005_module5_nearby_places.sql';
  ```

---

### Migration 006: `006_module7_emergency_sos.sql`
- **Purpose:** Creates `sos_alerts`, `sos_audit_events`, `sos_sms_logs`.
- **Forward:** Rapid emergency dispatch and SMS gateway tracking.
- **Rollback SQL:**
  ```sql
  DROP TABLE IF EXISTS sos_sms_logs CASCADE;
  DROP TABLE IF EXISTS sos_audit_events CASCADE;
  DROP TABLE IF EXISTS sos_alerts CASCADE;
  DELETE FROM _migrations WHERE name = '006_module7_emergency_sos.sql';
  ```

---

### Migration 007: `007_module2_routes.sql` & `007_module6_transport_shuttles.sql`
- **Purpose:** Creates routing origins, corridors, closures, transport hubs, shuttle routes, vehicle schedules.
- **Forward:** Smart route optimization and multi-modal transit coordination.
- **Rollback SQL:**
  ```sql
  DROP TABLE IF EXISTS shuttle_schedules CASCADE;
  DROP TABLE IF EXISTS shuttle_routes CASCADE;
  DROP TABLE IF EXISTS transport_hubs CASCADE;
  DROP TABLE IF EXISTS route_closures CASCADE;
  DROP TABLE IF EXISTS route_corridors CASCADE;
  DROP TABLE IF EXISTS route_origins CASCADE;
  DELETE FROM _migrations WHERE name IN ('007_module2_routes.sql', '007_module6_transport_shuttles.sql');
  ```

---

### Migration 008: `008_module10_virtual_seva.sql`
- **Purpose:** Creates `virtual_seva_bookings`, `seva_types`, `e_hundi_transactions`.
- **Forward:** Virtual seva booking and devotional contributions.
- **Rollback SQL:**
  ```sql
  DROP TABLE IF EXISTS e_hundi_transactions CASCADE;
  DROP TABLE IF EXISTS virtual_seva_bookings CASCADE;
  DROP TABLE IF EXISTS seva_types CASCADE;
  DELETE FROM _migrations WHERE name = '008_module10_virtual_seva.sql';
  ```

---

### Migration 009: `009_demo_flag.sql`
- **Purpose:** Adds `is_demo BOOLEAN DEFAULT FALSE` column to content tables.
- **Forward:** Allows isolation and purging of synthetic UI demo records.
- **Rollback SQL:**
  ```sql
  ALTER TABLE ghats DROP COLUMN IF EXISTS is_demo;
  ALTER TABLE news_posts DROP COLUMN IF EXISTS is_demo;
  ALTER TABLE citizen_issues DROP COLUMN IF EXISTS is_demo;
  ALTER TABLE sos_alerts DROP COLUMN IF EXISTS is_demo;
  DELETE FROM _migrations WHERE name = '009_demo_flag.sql';
  ```

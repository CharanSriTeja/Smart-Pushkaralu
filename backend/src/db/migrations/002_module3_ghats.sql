-- Migration 002: Module 3 - Ghat Information Schema with PostGIS support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Try enabling postgis extension if available in PostgreSQL environment
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS extension not available in this environment, falling back to standard lat/lng columns';
END $$;

-- 1. GHATS TABLE
CREATE TABLE IF NOT EXISTS ghats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  river VARCHAR(100) NOT NULL DEFAULT 'Godavari',
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  nearest_town JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  nearest_railway_station JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  nearest_bus_stand JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  official_source_url TEXT NULL,
  verified_at TIMESTAMPTZ NULL,
  record_status VARCHAR(30) NOT NULL CHECK (record_status IN ('officially_listed', 'reported', 'unverified')) DEFAULT 'unverified',
  bathing_status VARCHAR(20) NOT NULL CHECK (bathing_status IN ('allowed', 'restricted', 'closed', 'unknown')) DEFAULT 'unknown',
  crowd_level VARCHAR(20) NOT NULL CHECK (crowd_level IN ('low', 'medium', 'high', 'very_high', 'unknown')) DEFAULT 'unknown',
  publish_status VARCHAR(20) NOT NULL CHECK (publish_status IN ('draft', 'published', 'hidden')) DEFAULT 'draft',
  description JSONB NULL,
  max_capacity INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add geometry column conditionally if PostGIS is present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ghats' AND column_name = 'geom'
    ) THEN
      ALTER TABLE ghats ADD COLUMN geom geometry(Point, 4326);
    END IF;
  END IF;
END $$;

-- Trigger to sync PostGIS geom column with lat/lng
CREATE OR REPLACE FUNCTION sync_ghat_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  END IF;
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_ghat_geom ON ghats;
CREATE TRIGGER trg_sync_ghat_geom
BEFORE INSERT OR UPDATE ON ghats
FOR EACH ROW EXECUTE FUNCTION sync_ghat_geom();

-- Indexes for performance on ghats
CREATE INDEX IF NOT EXISTS idx_ghats_state_district ON ghats(state, district);
CREATE INDEX IF NOT EXISTS idx_ghats_publish_status ON ghats(publish_status);
CREATE INDEX IF NOT EXISTS idx_ghats_bathing_status ON ghats(bathing_status);
CREATE INDEX IF NOT EXISTS idx_ghats_crowd_level ON ghats(crowd_level);
CREATE INDEX IF NOT EXISTS idx_ghats_river ON ghats(river);
CREATE INDEX IF NOT EXISTS idx_ghats_lat_lng ON ghats(lat, lng);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    CREATE INDEX IF NOT EXISTS idx_ghats_geom ON ghats USING GIST (geom);
  END IF;
END $$;


-- 2. GHAT SOURCES TABLE
CREATE TABLE IF NOT EXISTS ghat_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ghat_id UUID NOT NULL REFERENCES ghats(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_name VARCHAR(255) NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('government', 'district_portal', 'police_dept', 'devasthanam', 'media', 'community', 'other')) DEFAULT 'government',
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  last_verified_at TIMESTAMPTZ NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ghat_sources_ghat_id ON ghat_sources(ghat_id);


-- 3. GHAT FACILITIES TABLE
CREATE TABLE IF NOT EXISTS ghat_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ghat_id UUID NOT NULL REFERENCES ghats(id) ON DELETE CASCADE,
  facility_type VARCHAR(50) NOT NULL, -- changing_room, drinking_water, toilet, medical_camp, parking, police_post, cloak_room, prasad_counter, etc.
  details JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  is_operational BOOLEAN NOT NULL DEFAULT TRUE,
  count INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ghat_facilities_ghat_id ON ghat_facilities(ghat_id);
CREATE INDEX IF NOT EXISTS idx_ghat_facilities_type ON ghat_facilities(facility_type);


-- 4. GHAT AARTI TIMINGS TABLE
CREATE TABLE IF NOT EXISTS ghat_aarti_timings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ghat_id UUID NOT NULL REFERENCES ghats(id) ON DELETE CASCADE,
  name JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  description JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  days_of_week VARCHAR(50) DEFAULT 'Daily',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ghat_aarti_ghat_id ON ghat_aarti_timings(ghat_id);


-- 5. GHAT NOTICES TABLE
CREATE TABLE IF NOT EXISTS ghat_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ghat_id UUID NOT NULL REFERENCES ghats(id) ON DELETE CASCADE,
  title JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  message JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'emergency')) DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ghat_notices_ghat_id ON ghat_notices(ghat_id);
CREATE INDEX IF NOT EXISTS idx_ghat_notices_active ON ghat_notices(is_active, severity);


-- 6. CROWD REPORTS TABLE
CREATE TABLE IF NOT EXISTS crowd_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ghat_id UUID NOT NULL REFERENCES ghats(id) ON DELETE CASCADE,
  user_id VARCHAR(128) NULL,
  device_fingerprint VARCHAR(128) NOT NULL,
  reported_crowd_level VARCHAR(20) NOT NULL CHECK (reported_crowd_level IN ('low', 'medium', 'high', 'very_high')),
  reported_lat NUMERIC(10, 7) NOT NULL,
  reported_lng NUMERIC(10, 7) NOT NULL,
  distance_meters NUMERIC(10, 2) NOT NULL,
  is_verified_proximity BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_crowd_reports_ghat_created ON crowd_reports(ghat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crowd_reports_device_rate ON crowd_reports(device_fingerprint, ghat_id, created_at DESC);


-- 7. CROWD STATUS TABLE
CREATE TABLE IF NOT EXISTS crowd_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ghat_id UUID UNIQUE NOT NULL REFERENCES ghats(id) ON DELETE CASCADE,
  current_level VARCHAR(20) NOT NULL CHECK (current_level IN ('low', 'medium', 'high', 'very_high', 'unknown')) DEFAULT 'unknown',
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('official_override', 'crowdsourced_aggregate', 'sensor_or_camera', 'default')) DEFAULT 'default',
  override_by_admin_id VARCHAR(128) NULL,
  confidence_score NUMERIC(3, 2) DEFAULT 0.00,
  recent_report_count INTEGER DEFAULT 0,
  note JSONB NULL, -- { "en": "...", "te": "...", "hi": "..." }
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_crowd_status_ghat_id ON crowd_status(ghat_id);


-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id VARCHAR(128) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  old_values JSONB NULL,
  new_values JSONB NULL,
  source_url TEXT NULL,
  reason TEXT NOT NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);


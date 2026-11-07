-- Migration 006: Module 7 - Emergency SOS, QR Zones, and Emergency Contacts Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Try enabling postgis extension if available in PostgreSQL environment
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS extension not available in this environment, falling back to standard lat/lng columns';
END $$;

-- 1. QR ZONES TABLE
CREATE TABLE IF NOT EXISTS qr_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_code VARCHAR(50) UNIQUE NOT NULL,
  ghat_id UUID NULL REFERENCES ghats(id) ON DELETE SET NULL,
  label JSONB NOT NULL, -- { "en": "Zone A - South Gate", "te": "...", "hi": "..." }
  lat NUMERIC(10, 7) NULL,
  lng NUMERIC(10, 7) NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. EMERGENCY CONTACTS TABLE
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label JSONB NOT NULL, -- { "en": "Police Helpline 112", "te": "...", "hi": "..." }
  phone VARCHAR(30) NOT NULL,
  kind VARCHAR(30) NOT NULL CHECK (kind IN ('ambulance', 'police', 'fire', 'control_room', 'temple_office', 'other')),
  ghat_id UUID NULL REFERENCES ghats(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. SOS ALERTS TABLE
CREATE TABLE IF NOT EXISTS sos_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  phone VARCHAR(30) NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('app', 'sms', 'qr', 'call')),
  type VARCHAR(30) NOT NULL CHECK (type IN ('medical', 'police', 'fire', 'lost_person', 'other', 'general')),
  lat NUMERIC(10, 7) NULL,
  lng NUMERIC(10, 7) NULL,
  accuracy_m NUMERIC(10, 2) NULL,
  ghat_id UUID NULL REFERENCES ghats(id) ON DELETE SET NULL,
  zone_id UUID NULL REFERENCES qr_zones(id) ON DELETE SET NULL,
  zone_code VARCHAR(50) NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  status VARCHAR(30) NOT NULL CHECK (status IN ('new', 'acknowledged', 'dispatched', 'resolved', 'false_alarm')) DEFAULT 'new',
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3) DEFAULT 2,
  assigned_to_name VARCHAR(150) NULL,
  assigned_to_phone VARCHAR(30) NULL,
  device_id VARCHAR(150) NULL,
  idempotency_key VARCHAR(150) NULL,
  status_token VARCHAR(100) NOT NULL,
  merged_into_id UUID NULL REFERENCES sos_alerts(id) ON DELETE SET NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. SOS UPDATES TABLE
CREATE TABLE IF NOT EXISTS sos_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  admin_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(30) NULL,
  note TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Conditionally add PostGIS columns and spatial indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'qr_zones' AND column_name = 'geom'
    ) THEN
      ALTER TABLE qr_zones ADD COLUMN geom geometry(Point, 4326);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'sos_alerts' AND column_name = 'geom'
    ) THEN
      ALTER TABLE sos_alerts ADD COLUMN geom geometry(Point, 4326);
    END IF;
  END IF;
END $$;

-- Indexes for performance and high-throughput queries
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status_severity ON sos_alerts (status, severity DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_device_id ON sos_alerts (device_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_phone ON sos_alerts (phone);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status_token ON sos_alerts (status_token);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_idempotency_key ON sos_alerts (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_ghat_id ON sos_alerts (ghat_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_zone_code ON sos_alerts (zone_code);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_created_at ON sos_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_updates_alert_id ON sos_updates (alert_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_qr_zones_zone_code ON qr_zones (zone_code);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_ghat ON emergency_contacts (ghat_id, active, sort_order);

-- Spatial GIST indexes conditionally
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sos_alerts_geom ON sos_alerts USING GIST (geom)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_qr_zones_geom ON qr_zones USING GIST (geom)';
  END IF;
END $$;


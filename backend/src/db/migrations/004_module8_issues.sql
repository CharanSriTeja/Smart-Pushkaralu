-- Migration 004: Module 8 - Report an Issue (Grievances & Issue Management)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ISSUE REPORTS TABLE
CREATE TABLE IF NOT EXISTS issue_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_no VARCHAR(32) UNIQUE NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('sanitation', 'road', 'water', 'lighting', 'crowd', 'other')),
  description TEXT NOT NULL,
  photo_url TEXT NULL,
  location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('gps', 'map_pin', 'qr_zone')) DEFAULT 'gps',
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  qr_zone_id VARCHAR(100) NULL,
  ghat_id UUID NULL REFERENCES ghats(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected')) DEFAULT 'submitted',
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  reporter_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  reporter_phone VARCHAR(20) NULL,
  reporter_device_token TEXT NULL,
  device_fingerprint VARCHAR(128) NULL,
  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  duplicate_of_ticket_no VARCHAR(32) NULL,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  client_metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add PostGIS geometry column conditionally
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'issue_reports' AND column_name = 'geom'
    ) THEN
      ALTER TABLE issue_reports ADD COLUMN geom geometry(Point, 4326);
    END IF;
  END IF;
END $$;

-- Trigger to sync PostGIS geom column with lat/lng
CREATE OR REPLACE FUNCTION sync_issue_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  END IF;
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_issue_geom ON issue_reports;
CREATE TRIGGER trg_sync_issue_geom
BEFORE INSERT OR UPDATE ON issue_reports
FOR EACH ROW EXECUTE FUNCTION sync_issue_geom();

-- Indexes for performance & query optimization
CREATE INDEX IF NOT EXISTS idx_issue_reports_ticket_no ON issue_reports(ticket_no);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_issue_reports_category ON issue_reports(category);
CREATE INDEX IF NOT EXISTS idx_issue_reports_reporter_id ON issue_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_device_token ON issue_reports(reporter_device_token);
CREATE INDEX IF NOT EXISTS idx_issue_reports_device_fingerprint ON issue_reports(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_issue_reports_created_at ON issue_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_reports_lat_lng ON issue_reports(lat, lng);
CREATE INDEX IF NOT EXISTS idx_issue_reports_dup_check ON issue_reports(category, status, created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    CREATE INDEX IF NOT EXISTS idx_issue_reports_geom ON issue_reports USING GIST (geom);
  END IF;
END $$;

-- 2. ISSUE UPDATES (TIMELINE) TABLE
CREATE TABLE IF NOT EXISTS issue_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issue_reports(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL CHECK (status IN ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected')),
  public_note TEXT NULL,
  internal_note TEXT NULL,
  resolution_photo_url TEXT NULL,
  updated_by_admin_id VARCHAR(128) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_issue_updates_issue_id ON issue_updates(issue_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_issue_updates_status ON issue_updates(status);


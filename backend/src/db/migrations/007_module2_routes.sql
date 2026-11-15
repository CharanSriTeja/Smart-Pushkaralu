-- Migration 007: Module 2 - Route Optimisation & Access Points

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure PostGIS is active
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS extension load notice';
END $$;

-- 1. GHAT ACCESS POINTS TABLE
-- Access points define parking, drop-off, gates and entry points for ghats.
-- Exactly one default access point per ghat.
CREATE TABLE IF NOT EXISTS ghat_access_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ghat_id UUID NOT NULL REFERENCES ghats(id) ON DELETE CASCADE,
  kind VARCHAR(30) NOT NULL CHECK (kind IN ('parking', 'drop_off', 'entry_gate', 'main')),
  name JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  location GEOGRAPHY(Point, 4326),
  coordinates_precision VARCHAR(30) NOT NULL CHECK (coordinates_precision IN ('access_verified', 'approximate', 'village_centre', 'none')) DEFAULT 'approximate',
  notes JSONB NULL, -- { "en": "...", "te": "...", "hi": "..." }
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  source_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ghat_access_points_ghat_id ON ghat_access_points(ghat_id);
CREATE INDEX IF NOT EXISTS idx_ghat_access_points_active ON ghat_access_points(active);
CREATE INDEX IF NOT EXISTS idx_ghat_access_points_loc ON ghat_access_points USING GIST(location);

-- Enforce exactly one active default access point per ghat
CREATE UNIQUE INDEX IF NOT EXISTS uq_ghat_default_access_point 
  ON ghat_access_points(ghat_id) 
  WHERE is_default = true AND active = true;

-- Trigger to sync location geography
CREATE OR REPLACE FUNCTION sync_access_point_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_access_point_location ON ghat_access_points;
CREATE TRIGGER trg_sync_access_point_location
BEFORE INSERT OR UPDATE OF lat, lng ON ghat_access_points
FOR EACH ROW EXECUTE FUNCTION sync_access_point_location();


-- 2. ROUTE ORIGINS TABLE
-- Major entry cities, transport hubs and pilgrim origins
CREATE TABLE IF NOT EXISTS route_origins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  kind VARCHAR(30) NOT NULL CHECK (kind IN ('city', 'railway_station', 'bus_stand', 'other')),
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  location GEOGRAPHY(Point, 4326),
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL DEFAULT 'Andhra Pradesh',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_route_origins_active ON route_origins(active);
CREATE INDEX IF NOT EXISTS idx_route_origins_loc ON route_origins USING GIST(location);

-- Trigger to sync route_origins location geography
CREATE OR REPLACE FUNCTION sync_route_origin_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_route_origin_location ON route_origins;
CREATE TRIGGER trg_sync_route_origin_location
BEFORE INSERT OR UPDATE OF lat, lng ON route_origins
FOR EACH ROW EXECUTE FUNCTION sync_route_origin_location();


-- 3. STANDARD ROUTES TABLE
-- Pre-computed routes between major origins and ghat access points
CREATE TABLE IF NOT EXISTS standard_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_id UUID NOT NULL REFERENCES route_origins(id) ON DELETE CASCADE,
  access_point_id UUID NOT NULL REFERENCES ghat_access_points(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('car', 'walk')),
  distance_m INTEGER NOT NULL,
  duration_s INTEGER NOT NULL,
  polyline TEXT NOT NULL,
  provider TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  stale BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_standard_route UNIQUE (origin_id, access_point_id, mode)
);

CREATE INDEX IF NOT EXISTS idx_standard_routes_lookup ON standard_routes(origin_id, access_point_id, mode);
CREATE INDEX IF NOT EXISTS idx_standard_routes_stale ON standard_routes(stale);


-- 4. EXTEND TEMPLES TABLE (Module 5 temples schema)
-- Ensure all required Module 2 columns, spatial index and coordinates_precision exist
DO $$
BEGIN
  -- Add location geography if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temples' AND column_name = 'location') THEN
    ALTER TABLE temples ADD COLUMN location GEOGRAPHY(Point, 4326);
  END IF;

  -- Add district if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temples' AND column_name = 'district') THEN
    ALTER TABLE temples ADD COLUMN district VARCHAR(100) DEFAULT 'East Godavari';
  END IF;

  -- Add state if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temples' AND column_name = 'state') THEN
    ALTER TABLE temples ADD COLUMN state VARCHAR(100) DEFAULT 'Andhra Pradesh';
  END IF;

  -- Add coordinates_precision if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temples' AND column_name = 'coordinates_precision') THEN
    ALTER TABLE temples ADD COLUMN coordinates_precision VARCHAR(30) DEFAULT 'approximate';
  END IF;

  -- Add source if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temples' AND column_name = 'source') THEN
    ALTER TABLE temples ADD COLUMN source VARCHAR(30) DEFAULT 'admin';
  END IF;

  -- Add osm_id if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temples' AND column_name = 'osm_id') THEN
    ALTER TABLE temples ADD COLUMN osm_id VARCHAR(100) NULL;
  END IF;

  -- Add verified if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temples' AND column_name = 'verified') THEN
    ALTER TABLE temples ADD COLUMN verified BOOLEAN DEFAULT false;
  END IF;

  -- Add active if not present
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temples' AND column_name = 'active') THEN
    ALTER TABLE temples ADD COLUMN active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Populate location geography for existing rows
UPDATE temples 
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE location IS NULL AND lat IS NOT NULL AND lng IS NOT NULL;

-- Sync verified with is_verified and active with is_hidden
UPDATE temples 
SET verified = COALESCE(is_verified, false),
    active = NOT COALESCE(is_hidden, false)
WHERE verified IS NULL OR active IS NULL;

CREATE INDEX IF NOT EXISTS idx_temples_location ON temples USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_temples_active ON temples(active);
CREATE INDEX IF NOT EXISTS idx_temples_osm_id ON temples(osm_id);

-- Trigger to sync temple location geography
CREATE OR REPLACE FUNCTION sync_temple_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lng IS NOT NULL AND NEW.lat IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_temple_location ON temples;
CREATE TRIGGER trg_sync_temple_location
BEFORE INSERT OR UPDATE OF lat, lng ON temples
FOR EACH ROW EXECUTE FUNCTION sync_temple_location();


-- 5. ROUTE CLOSURES TABLE
-- Police and festival authority diversions, road blocks and closures
CREATE TABLE IF NOT EXISTS route_closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  description JSONB NULL, -- { "en": "...", "te": "...", "hi": "..." }
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'blocked')) DEFAULT 'warning',
  geometry GEOGRAPHY NOT NULL, -- LineString or Polygon
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  source_name VARCHAR(150) NOT NULL,
  source_url TEXT NULL,
  created_by VARCHAR(100) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_route_closures_geom ON route_closures USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_route_closures_active ON route_closures(active, starts_at, ends_at);


-- 6. GHAT DELAY FACTORS TABLE
-- Administrative festival congestion and peak crowd multipliers (default 1.0)
CREATE TABLE IF NOT EXISTS ghat_delay_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ghat_id UUID NULL REFERENCES ghats(id) ON DELETE CASCADE, -- NULL means global factor
  factor NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  label JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by VARCHAR(100) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ghat_delay_factors_ghat ON ghat_delay_factors(ghat_id, active);
CREATE INDEX IF NOT EXISTS idx_ghat_delay_factors_times ON ghat_delay_factors(starts_at, ends_at);


-- 7. SETTINGS DEFAULTS FOR MODULE 2
INSERT INTO settings (key, value, updated_at)
VALUES
  ('provider_daily_limit', '1800'::jsonb, CURRENT_TIMESTAMP),
  ('provider_per_minute_limit', '30'::jsonb, CURRENT_TIMESTAMP),
  ('routes_per_user_per_hour', '15'::jsonb, CURRENT_TIMESTAMP),
  ('corridor_km_default', '3'::jsonb, CURRENT_TIMESTAMP),
  ('corridor_km_min', '2'::jsonb, CURRENT_TIMESTAMP),
  ('corridor_km_max', '5'::jsonb, CURRENT_TIMESTAMP),
  ('max_stops', '8'::jsonb, CURRENT_TIMESTAMP),
  ('alternatives_enabled', 'true'::jsonb, CURRENT_TIMESTAMP),
  ('place_search_enabled', 'false'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;


-- 8. INITIAL SEED DATA: Route Origins (Pilgrim Entry Points)
INSERT INTO route_origins (id, name, kind, lat, lng, district, state, sort_order, active)
VALUES
  ('a1111111-1111-1111-1111-111111111101', '{"en": "Rajahmundry Railway Station (RJY)", "te": "రాజమండ్రి రైల్వే స్టేషన్", "hi": "राजमंड्री रेलवे स्टेशन"}'::jsonb, 'railway_station', 17.0040, 81.7770, 'East Godavari', 'Andhra Pradesh', 1, true),
  ('a1111111-1111-1111-1111-111111111102', '{"en": "Kotipalli Bus Stand, Rajahmundry", "te": "కోటిపల్లి బస్ స్టాండ్", "hi": "कोटिपल्ली बस स्टैंड"}'::jsonb, 'bus_stand', 16.9920, 81.7790, 'East Godavari', 'Andhra Pradesh', 2, true),
  ('a1111111-1111-1111-1111-111111111103', '{"en": "Rajahmundry Airport (Madhurapudi)", "te": "రాజమండ్రి విమానాశ్రయం", "hi": "राजमंड्री हवाई अड्डा"}'::jsonb, 'other', 17.1105, 81.8190, 'East Godavari', 'Andhra Pradesh', 3, true),
  ('a1111111-1111-1111-1111-111111111104', '{"en": "Vijayawada City Center", "te": "విజయవాడ నగర కేంద్రం", "hi": "विजयवाड़ा शहर केंद्र"}'::jsonb, 'city', 16.5062, 80.6480, 'NTR', 'Andhra Pradesh', 4, true),
  ('a1111111-1111-1111-1111-111111111105', '{"en": "Visakhapatnam City Center", "te": "విశాఖపట్నం నగర కేంద్రం", "hi": "विशाखापट्टनम शहर केंद्र"}'::jsonb, 'city', 17.6868, 83.2185, 'Visakhapatnam', 'Andhra Pradesh', 5, true),
  ('a1111111-1111-1111-1111-111111111106', '{"en": "Hyderabad MGBS (Mahatma Gandhi Bus Station)", "te": "హైదరాబాద్ ఎంజీబీఎస్", "hi": "हैदराबाद एमजीबीएस"}'::jsonb, 'bus_stand', 17.3780, 78.4810, 'Hyderabad', 'Telangana', 6, true),
  ('a1111111-1111-1111-1111-111111111107', '{"en": "Kakinada Town", "te": "కాకినాడ పట్టణం", "hi": "काकीनाडा टाउन"}'::jsonb, 'city', 16.9891, 82.2475, 'Kakinada', 'Andhra Pradesh', 7, true),
  ('a1111111-1111-1111-1111-111111111108', '{"en": "Bhadrachalam Temple Town", "te": "భద్రాచలం పట్టణం", "hi": "भद्राचलम शहर"}'::jsonb, 'city', 17.6690, 80.8870, 'Bhadradri Kothagudem', 'Telangana', 8, true)
ON CONFLICT (id) DO NOTHING;

-- Populate default access points for existing ghats if none exist
INSERT INTO ghat_access_points (ghat_id, kind, name, lat, lng, coordinates_precision, notes, is_default, active)
SELECT 
  g.id,
  'main',
  jsonb_build_object(
    'en', (g.name->>'en') || ' - Main Entrance Gate',
    'te', COALESCE(g.name->>'te', '') || ' - ప్రధాన ప్రవేశ ద్వారం',
    'hi', COALESCE(g.name->>'hi', '') || ' - मुख्य प्रवेश द्वार'
  ),
  g.lat,
  g.lng,
  'access_verified',
  '{"en": "Official main entrance gate for holy bathing.", "te": "పుణ్యస్నానాలకు ప్రధాన ప్రవేశ ద్వారం.", "hi": "पवित्र स्नान के लिए मुख्य प्रवेश द्वार।"}'::jsonb,
  true,
  true
FROM ghats g
WHERE NOT EXISTS (
  SELECT 1 FROM ghat_access_points ap WHERE ap.ghat_id = g.id AND ap.is_default = true
);


-- Migration 005: Module 5 - Nearby Hotels, Temples, Transport Hubs, Cache and Overrides
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. NEARBY PLACES CACHE TABLE
CREATE TABLE IF NOT EXISTS nearby_places_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ghat_id UUID NOT NULL REFERENCES ghats(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'all', 'hotel', 'temple', 'transport_hub'
  radius_m INTEGER NOT NULL, -- 1000, 3000, 5000, 10000
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_nearby_cache UNIQUE (ghat_id, type, radius_m)
);

CREATE INDEX IF NOT EXISTS idx_nearby_cache_lookup ON nearby_places_cache(ghat_id, type, radius_m);
CREATE INDEX IF NOT EXISTS idx_nearby_cache_expires ON nearby_places_cache(expires_at);

-- 2. CURATED HOTELS TABLE
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  description JSONB NULL,
  address JSONB NULL,
  phone VARCHAR(50) NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  rating NUMERIC(3, 2) NULL,
  price_range VARCHAR(50) NULL DEFAULT 'mid_range', -- 'budget', 'mid_range', 'luxury', 'dharamshala', 'free'
  room_types JSONB NULL, -- ["AC Room", "Non-AC", "Dormitory"]
  photo_url TEXT NULL,
  website_url TEXT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  source_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hotels_lat_lng ON hotels(lat, lng);
CREATE INDEX IF NOT EXISTS idx_hotels_is_hidden ON hotels(is_hidden);

-- 3. CURATED TEMPLES TABLE
CREATE TABLE IF NOT EXISTS temples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  description JSONB NULL,
  address JSONB NULL,
  phone VARCHAR(50) NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  deity JSONB NULL, -- { "en": "...", "te": "...", "hi": "..." }
  darshan_timings JSONB NULL, -- { "en": "...", "te": "...", "hi": "..." }
  special_entry_info JSONB NULL, -- { "en": "...", "te": "...", "hi": "..." }
  photo_url TEXT NULL,
  website_url TEXT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  source_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_temples_lat_lng ON temples(lat, lng);
CREATE INDEX IF NOT EXISTS idx_temples_is_hidden ON temples(is_hidden);

-- 4. CURATED TRANSPORT HUBS TABLE
CREATE TABLE IF NOT EXISTS transport_hubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  description JSONB NULL,
  hub_type VARCHAR(50) NOT NULL CHECK (hub_type IN ('railway_station', 'bus_stand', 'airport', 'boat_point', 'auto_stand', 'parking')),
  address JSONB NULL,
  phone VARCHAR(50) NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  operating_hours JSONB NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  source_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transport_hubs_lat_lng ON transport_hubs(lat, lng);
CREATE INDEX IF NOT EXISTS idx_transport_hubs_hub_type ON transport_hubs(hub_type);
CREATE INDEX IF NOT EXISTS idx_transport_hubs_is_hidden ON transport_hubs(is_hidden);

-- 5. PLACE OVERRIDES TABLE
CREATE TABLE IF NOT EXISTS place_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id VARCHAR(255) UNIQUE NOT NULL, -- Third-party Google Place ID or internal place ID
  name_override JSONB NULL,
  phone_override VARCHAR(50) NULL,
  address_override JSONB NULL,
  custom_notes JSONB NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by_admin_id VARCHAR(128) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_place_overrides_place_id ON place_overrides(place_id);
CREATE INDEX IF NOT EXISTS idx_place_overrides_is_hidden ON place_overrides(is_hidden);

-- 6. PLACES API USAGE LOGGING & DAILY BUDGET GUARD TABLE
CREATE TABLE IF NOT EXISTS places_api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  call_count INTEGER NOT NULL DEFAULT 1,
  endpoint VARCHAR(100) NOT NULL DEFAULT 'places_nearby',
  last_called_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_places_api_usage UNIQUE (usage_date, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_places_api_usage_date ON places_api_usage(usage_date);

-- Conditional PostGIS columns and triggers for spatial indexing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    -- Hotels geom
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotels' AND column_name = 'geom') THEN
      ALTER TABLE hotels ADD COLUMN geom geometry(Point, 4326);
    END IF;
    -- Temples geom
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temples' AND column_name = 'geom') THEN
      ALTER TABLE temples ADD COLUMN geom geometry(Point, 4326);
    END IF;
    -- Transport hubs geom
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transport_hubs' AND column_name = 'geom') THEN
      ALTER TABLE transport_hubs ADD COLUMN geom geometry(Point, 4326);
    END IF;
  END IF;
END $$;

-- Spatial Triggers
CREATE OR REPLACE FUNCTION sync_place_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  END IF;
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_hotel_geom ON hotels;
CREATE TRIGGER trg_sync_hotel_geom
BEFORE INSERT OR UPDATE ON hotels
FOR EACH ROW EXECUTE FUNCTION sync_place_geom();

DROP TRIGGER IF EXISTS trg_sync_temple_geom ON temples;
CREATE TRIGGER trg_sync_temple_geom
BEFORE INSERT OR UPDATE ON temples
FOR EACH ROW EXECUTE FUNCTION sync_place_geom();

DROP TRIGGER IF EXISTS trg_sync_transport_geom ON transport_hubs;
CREATE TRIGGER trg_sync_transport_geom
BEFORE INSERT OR UPDATE ON transport_hubs
FOR EACH ROW EXECUTE FUNCTION sync_place_geom();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    CREATE INDEX IF NOT EXISTS idx_hotels_geom ON hotels USING GIST (geom);
    CREATE INDEX IF NOT EXISTS idx_temples_geom ON temples USING GIST (geom);
    CREATE INDEX IF NOT EXISTS idx_transport_hubs_geom ON transport_hubs USING GIST (geom);
  END IF;
END $$;

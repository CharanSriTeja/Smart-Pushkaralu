-- Migration 007: Module 6 - Transport and Shuttles Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENHANCE OR CREATE TRANSPORT HUBS TABLE
CREATE TABLE IF NOT EXISTS transport_hubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  description JSONB NULL,
  hub_type VARCHAR(50) NOT NULL CHECK (hub_type IN ('railway_station', 'bus_stand', 'airport', 'boat_point', 'auto_stand', 'parking')),
  operator VARCHAR(100) NULL, -- 'APSRTC', 'TGSRTC', 'Indian Railways', 'District Collectorate'
  code VARCHAR(50) NULL, -- 'RJY-CBS', 'KVR-BS'
  address JSONB NULL,
  phone VARCHAR(50) NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  operating_hours JSONB NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  source_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE transport_hubs ADD COLUMN IF NOT EXISTS operator VARCHAR(100) NULL;
ALTER TABLE transport_hubs ADD COLUMN IF NOT EXISTS code VARCHAR(50) NULL;
ALTER TABLE transport_hubs ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_transport_hubs_lat_lng ON transport_hubs(lat, lng);
CREATE INDEX IF NOT EXISTS idx_transport_hubs_hub_type ON transport_hubs(hub_type);
CREATE INDEX IF NOT EXISTS idx_transport_hubs_is_active ON transport_hubs(is_active);

-- 2. BUS ROUTES TABLE
CREATE TABLE IF NOT EXISTS bus_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_number VARCHAR(50) NOT NULL,
  operator VARCHAR(50) NOT NULL CHECK (operator IN ('APSRTC', 'TGSRTC', 'CITY_BUS', 'SPECIAL_RTC', 'OTHER')),
  origin JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  destination JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  origin_hub_id UUID NULL REFERENCES transport_hubs(id) ON DELETE SET NULL,
  destination_hub_id UUID NULL REFERENCES transport_hubs(id) ON DELETE SET NULL,
  via_stops JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings or stop objects
  first_bus_time VARCHAR(20) NULL, -- e.g. "04:30"
  last_bus_time VARCHAR(20) NULL,  -- e.g. "23:30"
  frequency_minutes INTEGER NULL,  -- e.g. 15
  fare_range JSONB NULL,          -- { "min": 20, "max": 100, "currency": "INR" }
  bus_type VARCHAR(50) NOT NULL DEFAULT 'ordinary', -- 'ordinary', 'express', 'deluxe', 'super_luxury', 'ac'
  connected_ghat_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of ghat UUIDs
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bus_routes_operator ON bus_routes(operator);
CREATE INDEX IF NOT EXISTS idx_bus_routes_is_active ON bus_routes(is_active);

-- 3. BUS SPECIAL SERVICES TABLE (Pushkaralu Specials)
CREATE TABLE IF NOT EXISTS bus_special_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_code VARCHAR(100) NOT NULL UNIQUE,
  service_title JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  operator VARCHAR(50) NOT NULL CHECK (operator IN ('APSRTC', 'TGSRTC', 'JOINT_RTC')),
  origin_city JSONB NOT NULL,   -- { "en": "Hyderabad (MGBS)", "te": "...", "hi": "..." }
  destination_ghat_id UUID NULL REFERENCES ghats(id) ON DELETE SET NULL,
  destination_town JSONB NOT NULL, -- { "en": "Rajahmundry", "te": "...", "hi": "..." }
  operating_dates JSONB NOT NULL,  -- { "start_date": "2027-07-14", "end_date": "2027-07-25" }
  timings_description JSONB NULL,  -- { "en": "Every 30 minutes 24x7 during Pushkaralu", ... }
  booking_url TEXT NULL,           -- Official reservation URL
  emergency_helpline VARCHAR(50) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bus_special_operator ON bus_special_services(operator);
CREATE INDEX IF NOT EXISTS idx_bus_special_ghat_id ON bus_special_services(destination_ghat_id);
CREATE INDEX IF NOT EXISTS idx_bus_special_is_active ON bus_special_services(is_active);

-- 4. RAIL STATIONS TABLE
CREATE TABLE IF NOT EXISTS rail_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hub_id UUID NULL REFERENCES transport_hubs(id) ON DELETE SET NULL,
  station_code VARCHAR(20) NOT NULL UNIQUE, -- 'RJY', 'GVN', 'KVR', 'BDCR'
  station_name JSONB NOT NULL,             -- { "en": "Rajahmundry", "te": "రాజమండ్రి", "hi": "राजमंड्री" }
  division VARCHAR(50) NULL,               -- 'Vijayawada (BZA)', 'Secunderabad (SC)'
  zone VARCHAR(50) NOT NULL DEFAULT 'SCR', -- South Central Railway
  total_platforms INTEGER NOT NULL DEFAULT 1,
  has_pushkaralu_special_trains BOOLEAN NOT NULL DEFAULT TRUE,
  helpdesk_phone VARCHAR(50) NULL,
  official_enquiry_url TEXT NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rail_stations_code ON rail_stations(station_code);
CREATE INDEX IF NOT EXISTS idx_rail_stations_lat_lng ON rail_stations(lat, lng);
CREATE INDEX IF NOT EXISTS idx_rail_stations_is_active ON rail_stations(is_active);

-- 5. SHUTTLE ROUTES TABLE (Free Pilgrimage Connectors)
CREATE TABLE IF NOT EXISTS shuttle_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_code VARCHAR(50) NOT NULL UNIQUE, -- 'SHTL-GREEN-01'
  route_name JSONB NOT NULL,              -- { "en": "Morampudi Parking to Pushkar Ghat", ... }
  origin_hub_id UUID NULL REFERENCES transport_hubs(id) ON DELETE SET NULL,
  origin_name JSONB NOT NULL,             -- { "en": "Morampudi Satellite Parking", ... }
  destination_ghat_id UUID NULL REFERENCES ghats(id) ON DELETE SET NULL,
  destination_name JSONB NOT NULL,        -- { "en": "Pushkar Ghat South Gate", ... }
  shuttle_type VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (shuttle_type IN ('free', 'nominal', 'electric_cart', 'battery_rickshaw', 'feeder_bus')),
  fare NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  frequency_minutes INTEGER NOT NULL DEFAULT 10,
  operating_hours JSONB NOT NULL,         -- { "start": "04:00", "end": "23:00", "frequency_peak_mins": 5 }
  accessible_for_elderly_disabled BOOLEAN NOT NULL DEFAULT TRUE,
  color_code VARCHAR(20) NOT NULL DEFAULT '#1E88E5',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shuttle_routes_destination ON shuttle_routes(destination_ghat_id);
CREATE INDEX IF NOT EXISTS idx_shuttle_routes_is_active ON shuttle_routes(is_active);

-- 6. SHUTTLE STOPS TABLE
CREATE TABLE IF NOT EXISTS shuttle_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shuttle_route_id UUID NOT NULL REFERENCES shuttle_routes(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  stop_name JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  landmark JSONB NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  is_major_boarding_point BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shuttle_stops_route_order ON shuttle_stops(shuttle_route_id, stop_order);

-- 7. EXTERNAL LINKS CONFIG TABLE (Official Verifiable Portals)
CREATE TABLE IF NOT EXISTS external_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL CHECK (category IN ('bus', 'rail', 'shuttle', 'emergency', 'traffic')),
  key VARCHAR(100) UNIQUE NOT NULL, -- 'apsrtc_booking', 'rail_ntes_enquiry', etc.
  title JSONB NOT NULL,             -- { "en": "APSRTC Official Booking", "te": "ఆర్టీసీ అధికారిక బుకింగ్", "hi": "एपीएसआरटीसी आधिकारिक बुकिंग" }
  description JSONB NULL,
  url TEXT NOT NULL,
  official_authority VARCHAR(100) NOT NULL, -- 'Andhra Pradesh State Road Transport Corporation', 'Indian Railways (CRIS)'
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_external_links_category ON external_links(category);
CREATE INDEX IF NOT EXISTS idx_external_links_key ON external_links(key);
CREATE INDEX IF NOT EXISTS idx_external_links_is_active ON external_links(is_active);


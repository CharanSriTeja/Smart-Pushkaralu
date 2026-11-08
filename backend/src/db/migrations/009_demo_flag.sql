-- Migration 009: Add is_demo flag to support safe isolation and purging of test/demo rows

DO $$
BEGIN
  -- ghats
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ghats') THEN
    ALTER TABLE ghats ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- news_posts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'news_posts') THEN
    ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- issues
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'issues') THEN
    ALTER TABLE issues ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- places
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'places') THEN
    ALTER TABLE places ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- sos_alerts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sos_alerts') THEN
    ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- transport_hubs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transport_hubs') THEN
    ALTER TABLE transport_hubs ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- bus_routes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bus_routes') THEN
    ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- special_services
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'special_services') THEN
    ALTER TABLE special_services ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- rail_stations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rail_stations') THEN
    ALTER TABLE rail_stations ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- shuttle_routes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shuttle_routes') THEN
    ALTER TABLE shuttle_routes ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- external_links
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'external_links') THEN
    ALTER TABLE external_links ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- seva_videos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seva_videos') THEN
    ALTER TABLE seva_videos ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;


-- Migration 003: Module 9 - Official News and Facilities Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. NEWS POSTS TABLE
CREATE TABLE IF NOT EXISTS news_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  content JSONB NOT NULL, -- { "en": "...", "te": "...", "hi": "..." }
  summary JSONB NULL, -- { "en": "...", "te": "...", "hi": "..." }
  category VARCHAR(50) NOT NULL CHECK (category IN ('urgent', 'general', 'advisory', 'facility', 'traffic', 'weather')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  ghat_ids UUID[] DEFAULT '{}',
  source_url TEXT NULL,
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  publish_status VARCHAR(20) NOT NULL CHECK (publish_status IN ('draft', 'published', 'archived', 'expired')) DEFAULT 'draft',
  published_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  notify_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_by VARCHAR(128) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_posts_publish_status ON news_posts(publish_status);
CREATE INDEX IF NOT EXISTS idx_news_posts_category ON news_posts(category);
CREATE INDEX IF NOT EXISTS idx_news_posts_is_pinned ON news_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_news_posts_expires_at ON news_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_news_posts_published_at ON news_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_ghat_ids ON news_posts USING GIN (ghat_ids);

-- 2. DEVICE TOKENS TABLE
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL,
  fcm_token TEXT,
  user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'te', 'hi')),
  ghat_topics TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  platform TEXT DEFAULT 'expo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure all columns exist if device_tokens was already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'device_tokens' AND column_name = 'token'
  ) THEN
    ALTER TABLE device_tokens ADD COLUMN token TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'device_tokens' AND column_name = 'fcm_token'
  ) THEN
    ALTER TABLE device_tokens ADD COLUMN fcm_token TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'device_tokens' AND column_name = 'ghat_topics'
  ) THEN
    ALTER TABLE device_tokens ADD COLUMN ghat_topics TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'device_tokens' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE device_tokens ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Populate token from fcm_token if token is null
UPDATE device_tokens SET token = fcm_token WHERE token IS NULL AND fcm_token IS NOT NULL;
UPDATE device_tokens SET fcm_token = token WHERE fcm_token IS NULL AND token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_language ON device_tokens(language);
CREATE INDEX IF NOT EXISTS idx_device_tokens_ghats ON device_tokens USING GIN (ghat_topics);

-- 3. ENHANCE GHAT FACILITIES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ghat_facilities' AND column_name = 'last_verified_at'
  ) THEN
    ALTER TABLE ghat_facilities ADD COLUMN last_verified_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ghat_facilities' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE ghat_facilities ADD COLUMN source_url TEXT NULL;
  END IF;
END $$;

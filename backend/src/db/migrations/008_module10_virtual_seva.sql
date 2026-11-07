-- Module 10: Virtual Seva and Event Experience (Phase 1: YouTube Livestreams & Curated Videos)

CREATE TABLE IF NOT EXISTS seva_videos (
    id VARCHAR(64) PRIMARY KEY,
    youtube_id VARCHAR(32) NOT NULL,
    youtube_url VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_te VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255),
    description_en TEXT,
    description_te TEXT,
    description_hi TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    ghat_id VARCHAR(64) REFERENCES ghats(id) ON DELETE SET NULL,
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_live BOOLEAN NOT NULL DEFAULT false,
    published BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    thumbnail_url VARCHAR(255),
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance and quick filtering
CREATE INDEX IF NOT EXISTS idx_seva_videos_feed ON seva_videos (published, is_live DESC, sort_order ASC, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_seva_videos_category ON seva_videos (category);
CREATE INDEX IF NOT EXISTS idx_seva_videos_ghat_id ON seva_videos (ghat_id);
CREATE INDEX IF NOT EXISTS idx_seva_videos_is_live ON seva_videos (is_live);

-- Seed permissions if permissions table exists
INSERT INTO permissions (id, name, description, category)
VALUES
    (gen_random_uuid(), 'seva.manage', 'Create, update, reorder and delete seva videos', 'seva'),
    (gen_random_uuid(), 'seva.publish', 'Publish or unpublish seva videos', 'seva')
ON CONFLICT (name) DO NOTHING;


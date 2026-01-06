-- Instagram Feed Sync Migration
-- Targets specific tenant schema via search_path

-- Instagram Posts Table
CREATE TABLE IF NOT EXISTS instagram_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL, -- Instagram Post ID
    media_url TEXT NOT NULL CHECK (media_url ~ '^https?://'),
    permalink TEXT CHECK (permalink IS NULL OR permalink ~ '^https?://'),
    caption TEXT,
    media_type TEXT DEFAULT 'IMAGE', -- IMAGE, VIDEO, CAROUSEL_ALBUM
    posted_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync Metadata Table (tracks last sync time for throttling)
CREATE TABLE IF NOT EXISTS instagram_sync_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sync_count INTEGER DEFAULT 1
);

-- RLS
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_sync_metadata ENABLE ROW LEVEL SECURITY;

-- Indexes for grid display and deduplication
CREATE INDEX IF NOT EXISTS idx_instagram_posted_at ON instagram_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_external_id ON instagram_posts(external_id);

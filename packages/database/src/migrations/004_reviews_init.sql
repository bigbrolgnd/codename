-- Reputation Management Migration
-- Targets specific tenant schema via search_path

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content TEXT,
    source TEXT NOT NULL DEFAULT 'google', -- e.g. 'google', 'yelp', 'direct'
    external_id TEXT, -- Original ID from the source platform
    response_content TEXT, -- AI or owner response
    response_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL, -- Date the review was actually posted at source
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source, external_id)
);

-- Index for lookup and analytics
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(source);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Update Daily Stats to include reputation metrics
ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

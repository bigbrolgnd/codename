-- Analytics and Aggregation Schema
-- Targets specific tenant schema

-- Visit Logs (Raw Data)
CREATE TABLE IF NOT EXISTS visit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT NOT NULL, -- Anonymized identifier
    page_path TEXT NOT NULL,
    referrer TEXT,
    city TEXT,
    county TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Stats (Aggregated Data)
CREATE TABLE IF NOT EXISTS daily_stats (
    stat_date DATE PRIMARY KEY,
    total_revenue INTEGER NOT NULL DEFAULT 0, -- Cents
    total_bookings INTEGER NOT NULL DEFAULT 0,
    total_visitors INTEGER NOT NULL DEFAULT 0,
    top_city TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_visit_logs_date ON visit_logs((created_at::date));

-- RLS
ALTER TABLE visit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

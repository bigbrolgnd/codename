-- Design Studio: Theme Persistence Migration
-- Table for storing tenant-specific theme customizations

CREATE TABLE IF NOT EXISTS theme_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    styles JSONB NOT NULL,
    hsl_adjustments JSONB NOT NULL,
    preset_id TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    is_draft BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookup of the latest published/draft theme
CREATE INDEX IF NOT EXISTS idx_theme_status ON theme_customizations(is_draft, created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_theme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_theme_updated_at
    BEFORE UPDATE ON theme_customizations
    FOR EACH ROW
    EXECUTE FUNCTION update_theme_updated_at();

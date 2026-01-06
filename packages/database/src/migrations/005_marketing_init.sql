-- Marketing and Engagement Migration
-- Targets specific tenant schema via search_path

-- Marketing Settings Table
CREATE TABLE IF NOT EXISTS marketing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auto_pilot_enabled BOOLEAN DEFAULT FALSE,
    frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'bi-weekly')),
    tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'enthusiastic', 'educational')),
    platforms TEXT[] DEFAULT '{google}', -- e.g. '{google, instagram}'
    next_post_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_default BOOLEAN DEFAULT TRUE UNIQUE -- Ensures only one default settings row per schema
);

-- RLS
ALTER TABLE marketing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all operations within tenant schema)
CREATE POLICY marketing_settings_select_policy ON marketing_settings FOR SELECT USING (true);
CREATE POLICY marketing_settings_update_policy ON marketing_settings FOR UPDATE USING (true);
CREATE POLICY marketing_settings_insert_policy ON marketing_settings FOR INSERT WITH CHECK (true);

-- Insert default row for the tenant
INSERT INTO marketing_settings (auto_pilot_enabled, is_default) VALUES (FALSE, TRUE) ON CONFLICT (is_default) DO NOTHING;

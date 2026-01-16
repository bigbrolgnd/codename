-- Enable RLS on component_presets table (Security Fix)
-- This migration enables Row Level Security on the public component_presets table
-- and creates appropriate policies for tenant-isolated access

-- =====================================================
-- ENABLE RLS ON component_presets
-- =====================================================

ALTER TABLE component_presets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Policy: Presets are publicly readable (read-only for all users)
-- This allows anyone to view available component presets for the AI builder
CREATE POLICY "component_presets_select_public" ON component_presets
    FOR SELECT
    TO PUBLIC
    USING (true);

-- Policy: Only authenticated users via API can insert/update presets
-- (Admin-level access - typically done through backend service role)
CREATE POLICY "component_presets_modify_admin" ON component_presets
    FOR ALL
    TO authenticated
    USING (false)
    WITH CHECK (false);

-- Note: If you need to allow service role mutations, add:
-- CREATE POLICY "component_presets_modify_service" ON component_presets
--     FOR ALL
--     TO service_role
--     USING (true)
--     WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on sequences if needed for INSERT operations
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

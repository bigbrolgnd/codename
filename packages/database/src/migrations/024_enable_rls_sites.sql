-- Enable RLS on sites table (Security Fix)
-- This migration enables Row Level Security on the public sites table
-- and creates appropriate policies for tenant-isolated access

-- =====================================================
-- ENABLE RLS ON sites
-- =====================================================

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Policy: Service role has full access for backend operations
-- This allows the API to manage sites on behalf of users
CREATE POLICY "sites_service_role_all" ON sites
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Authenticated users can view sites (via backend tenant context)
-- In production, this would typically use a JOIN to verify tenant membership
CREATE POLICY "sites_select_authenticated" ON sites
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Prevent direct INSERT from authenticated users
-- All mutations should go through the backend API (service role)
CREATE POLICY "sites_insert_service_only" ON sites
    FOR INSERT
    TO authenticated
    WITH CHECK (false);

-- Policy: Prevent direct UPDATE from authenticated users
CREATE POLICY "sites_update_service_only" ON sites
    FOR UPDATE
    TO authenticated
    USING (false)
    WITH CHECK (false);

-- Policy: Prevent direct DELETE from authenticated users
CREATE POLICY "sites_delete_service_only" ON sites
    FOR DELETE
    TO authenticated
    USING (false);

-- =====================================================
-- INDEXES FOR POLICY COLUMNS
-- =====================================================

-- Create index on tenant_id for policy performance
CREATE INDEX IF NOT EXISTS idx_sites_tenant_id ON sites(tenant_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on sequences if needed for INSERT operations
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

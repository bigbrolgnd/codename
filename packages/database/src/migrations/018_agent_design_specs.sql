-- Agent Design Specs Migration
-- Stores design specifications for AI-generated sites
-- Bridges GLM Vision extraction and Local Builder code generation

-- =====================================================
-- AGENT DESIGN SPECS TABLE
-- =====================================================
-- Stores design specifications created by GLM Vision agent
-- Used by Local Builder agent for code generation
CREATE TABLE IF NOT EXISTS agent_design_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tenant and template reference
    tenant_id UUID NOT NULL,
    template_id TEXT NOT NULL,

    -- Design specification (JSON)
    design_spec JSONB NOT NULL DEFAULT '{}',
    -- Structure: {
    --   componentTree: { zones: [...] },
    --   themeConfig: { colors: {...}, typography: {...} },
    --   businessContext: { ... }
    -- }

    -- Generation status
    status TEXT NOT NULL DEFAULT 'pending',
    -- Status: pending, processing, completed, error

    -- Generated code (from Local Builder)
    generated_code JSONB DEFAULT '{}',
    -- Structure: {
    --   components: { componentId: "code..." }
    -- }

    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for design spec queries
CREATE INDEX IF NOT EXISTS idx_agent_design_specs_tenant ON agent_design_specs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_design_specs_template ON agent_design_specs(template_id);
CREATE INDEX IF NOT EXISTS idx_agent_design_specs_status ON agent_design_specs(status);
CREATE INDEX IF NOT EXISTS idx_agent_design_specs_created ON agent_design_specs(created_at DESC);

-- GIN index for JSONB searches
CREATE INDEX IF NOT EXISTS idx_agent_design_specs_spec ON agent_design_specs USING GIN (design_spec);

-- =====================================================
-- AGENT EXTRACTION LOG TABLE
-- =====================================================
-- Logs all extraction requests and results for analytics
CREATE TABLE IF NOT EXISTS agent_extraction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Request info
    tenant_id UUID,
    extraction_type TEXT NOT NULL,
    -- Types: logo, photo, priceList, batch

    -- Input
    image_urls TEXT[] NOT NULL,

    -- Result
    extraction_result JSONB NOT NULL DEFAULT '{}',
    confidence INTEGER,
    processing_time_ms INTEGER,

    -- Warnings/errors
    warnings TEXT[],
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for extraction log queries
CREATE INDEX IF NOT EXISTS idx_agent_extraction_logs_tenant ON agent_extraction_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_extraction_logs_type ON agent_extraction_logs(extraction_type);
CREATE INDEX IF NOT EXISTS idx_agent_extraction_logs_created ON agent_extraction_logs(created_at DESC);

-- =====================================================
-- AGENT GENERATION LOG TABLE
-- =====================================================
-- Logs all site generation requests for analytics
CREATE TABLE IF NOT EXISTS agent_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Request info
    tenant_id UUID,
    template_id TEXT NOT NULL,

    -- Input variables
    variables JSONB DEFAULT '{}',
    business_context JSONB DEFAULT '{}',

    -- Result
    design_spec_id UUID,
    status TEXT NOT NULL,
    code_generation_time_ms INTEGER,
    total_time_ms INTEGER,

    -- Metrics
    component_count INTEGER DEFAULT 0,
    zone_count INTEGER DEFAULT 0,

    -- Error tracking
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for generation log queries
CREATE INDEX IF NOT EXISTS idx_agent_generation_logs_tenant ON agent_generation_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_generation_logs_template ON agent_generation_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_agent_generation_logs_status ON agent_generation_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_generation_logs_created ON agent_generation_logs(created_at DESC);

-- =====================================================
-- TRIGGERS: Update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_agent_design_specs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    -- Set completed_at when status changes to completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_agent_design_specs_updated_at
    BEFORE UPDATE ON agent_design_specs
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_design_specs_updated_at();

-- =====================================================
-- VIEWS: For analytics and monitoring
-- =====================================================

-- View: Design specs with template info
CREATE OR REPLACE VIEW agent_design_specs_with_template AS
SELECT
    ds.id,
    ds.tenant_id,
    ds.template_id,
    t.name AS template_name,
    a.name AS archetype_name,
    ds.status,
    ds.error_message,
    ds.retry_count,
    ds.created_at,
    ds.updated_at,
    ds.completed_at,
    -- Calculate processing time
    CASE
        WHEN ds.completed_at IS NOT NULL THEN
            EXTRACT(EPOCH FROM (ds.completed_at - ds.created_at)) * 1000
        ELSE NULL
    END AS processing_time_ms
FROM agent_design_specs ds
LEFT JOIN templates t ON ds.template_id = t.id
LEFT JOIN template_archetypes a ON t.archetype_id = a.id
ORDER BY ds.created_at DESC;

-- View: Generation statistics by template
CREATE OR REPLACE VIEW agent_template_stats AS
SELECT
    template_id,
    COUNT(*) AS generation_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE status = 'error') AS error_count,
    AVG(CASE WHEN completed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (completed_at - created_at)) * 1000
    END) AS avg_processing_time_ms,
    MAX(created_at) AS last_generated
FROM agent_design_specs
GROUP BY template_id;

-- =====================================================
-- FUNCTIONS: Helper functions for status updates
-- =====================================================

-- Function: Update design spec status
CREATE OR REPLACE FUNCTION update_design_spec_status(
    p_design_spec_id UUID,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE agent_design_specs
    SET
        status = p_status,
        error_message = COALESCE(p_error_message, error_message),
        updated_at = NOW(),
        completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE completed_at END
    WHERE id = p_design_spec_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Store generated code
CREATE OR REPLACE FUNCTION store_generated_code(
    p_design_spec_id UUID,
    p_generated_code JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE agent_design_specs
    SET
        generated_code = p_generated_code,
        status = 'completed',
        updated_at = NOW(),
        completed_at = NOW()
    WHERE id = p_design_spec_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANTS (if using row-level security)
-- =====================================================

-- Enable RLS on agent tables (optional, based on security requirements)
-- ALTER TABLE agent_design_specs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_extraction_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_generation_logs ENABLE ROW LEVEL SECURITY;

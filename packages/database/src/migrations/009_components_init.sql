-- Component Configuration System Migration
-- Stores sites, zones, components, and integrations for AI-driven site building
-- Each tenant can have multiple sites; each site has zones; zones contain nested components

-- =====================================================
-- SITES TABLE
-- =====================================================
-- Sites belong to tenants (in public schema)
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Site identity
    name TEXT NOT NULL DEFAULT 'My Site',
    slug TEXT NOT NULL DEFAULT '',

    -- Template selection
    template_id TEXT NOT NULL DEFAULT 'starter',
    -- Template options: 'starter', 'creative', 'pro', 'builder', 'personal', 'shop'

    navbar_style TEXT DEFAULT 'floating',
    -- Navbar options: 'clean', 'bold', 'floating', 'split', 'minimal'

    -- State
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, slug)
);

-- Index for tenant site lookup
CREATE INDEX IF NOT EXISTS idx_sites_tenant ON sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);

-- =====================================================
-- INTEGRATIONS TABLE
-- =====================================================
-- Platform integrations per site (YouTube, Instagram, Twitter, etc.)
CREATE TABLE IF NOT EXISTS site_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

    -- Integration identification
    integration_type TEXT NOT NULL,
    -- Types: 'youtube', 'twitter', 'facebook', 'dropbox', 'spotify', 'soundcloud', 'instagram', 'tiktok', 'linkedin'

    -- Credentials (non-sensitive URLs/handles)
    credentials JSONB NOT NULL DEFAULT '{}',
    -- Structure: { handle, channelUrl, profileUrl, pageId, folderUrl, ... }

    -- Content cache (fetched content stored for display)
    cached_content JSONB DEFAULT '{}',
    -- Structure: { posts: [], videos: [], lastFetched: timestamp, ... }

    -- Sync settings
    auto_sync BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending',
    -- Status: 'pending', 'active', 'error', 'disabled'

    -- Error tracking
    last_error TEXT,

    -- State
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(site_id, integration_type)
);

CREATE INDEX IF NOT EXISTS idx_integrations_site ON site_integrations(site_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON site_integrations(integration_type);

-- =====================================================
-- ZONES TABLE
-- =====================================================
-- Zones are semantic page regions (hero, features, trust, etc.)
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

    -- Zone identification
    zone_type TEXT NOT NULL,
    -- Zone types: 'zone-header', 'zone-hero', 'zone-features', 'zone-trust',
    --           'zone-content', 'zone-pricing', 'zone-cta', 'zone-footer', 'zone-process', 'zone-faq'

    position INTEGER NOT NULL DEFAULT 0,

    -- Zone-level configuration
    config JSONB DEFAULT '{}',
    -- Structure: { background, padding, animation, tokens_override, containerWidth }

    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(site_id, zone_type, position)
);

CREATE INDEX IF NOT EXISTS idx_zones_site ON zones(site_id);
CREATE INDEX IF NOT EXISTS idx_zones_type ON zones(zone_type);

-- =====================================================
-- COMPONENTS TABLE (Nested Structure)
-- =====================================================
-- Components are nested: organisms contain molecules, molecules contain atoms
CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,

    -- Component identification
    component_type TEXT NOT NULL,
    -- Types: 'atom', 'molecule', 'organism'

    component_id TEXT NOT NULL,
    -- IDs: 'button', 'heading', 'capture-email', 'hero-split', 'features-grid', etc.

    -- Nested structure (parent-child for molecules within organisms)
    parent_id UUID REFERENCES components(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,

    -- Content configuration
    props JSONB DEFAULT '{}',
    -- Structure: { text, href, imageSrc, alt, icon, size, variant, ... }

    -- Integration references (links to site_integrations)
    integration_refs JSONB DEFAULT '{}',
    -- Structure: { youtube: integration_id, instagram: integration_id, ... }

    -- Style configuration
    style_variant TEXT DEFAULT 'default',
    -- Variants: 'default', 'shimmer', 'glow', '3d', 'minimal', 'spotlight', etc.

    tokens_override JSONB DEFAULT '{}',
    -- Token overrides: { color, background, spacing, borderRadius, ... }

    animation_config JSONB DEFAULT '{}',
    -- Animation: { entrance: 'fade-in', trigger: 'scroll', duration: 'normal', stagger: 'fast' }

    -- State
    is_visible BOOLEAN DEFAULT true,
    is_draft BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for component queries
CREATE INDEX IF NOT EXISTS idx_components_zone ON components(zone_id);
CREATE INDEX IF NOT EXISTS idx_components_parent ON components(parent_id);
CREATE INDEX IF NOT EXISTS idx_components_type ON components(component_type, component_id);

-- =====================================================
-- COMPONENT PRESETS TABLE
-- =====================================================
-- Predefined component configurations for AI agents to use as templates
CREATE TABLE IF NOT EXISTS component_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Preset identification
    component_type TEXT NOT NULL,
    component_id TEXT NOT NULL,
    preset_name TEXT NOT NULL,
    preset_slug TEXT UNIQUE NOT NULL,

    -- Default configuration
    default_props JSONB DEFAULT '{}',
    default_style TEXT DEFAULT 'default',
    default_tokens JSONB DEFAULT '{}',
    default_animation JSONB DEFAULT '{}',

    -- Metadata for AI agents
    description TEXT,
    ai_purpose TEXT,
    -- AI purpose: 'capture-email', 'prove-trust', 'explain-feature', etc.

    compatible_zones TEXT[] DEFAULT '{}',
    -- Zones where this component can be placed

    -- Source info
    source TEXT,
    -- Source: 'aceternity', 'magic-ui', 'custom'

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presets_type ON component_presets(component_type, component_id);
CREATE INDEX IF NOT EXISTS idx_presets_purpose ON component_presets(ai_purpose);

-- =====================================================
-- TRIGGERS: Update timestamps
-- =====================================================

-- Sites updated_at trigger
CREATE OR REPLACE FUNCTION update_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_sites_updated_at();

-- Components updated_at trigger
CREATE TRIGGER trg_update_components_updated_at
    BEFORE UPDATE ON components
    FOR EACH ROW
    EXECUTE FUNCTION update_components_updated_at();

-- Integrations updated_at trigger
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_integrations_updated_at
    BEFORE UPDATE ON site_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_integrations_updated_at();

-- =====================================================
-- VIEWS: For easy querying of full site structure
-- =====================================================

-- View: Sites with all their zones
CREATE OR REPLACE VIEW sites_with_zones AS
SELECT
    s.id AS site_id,
    s.tenant_id,
    s.name AS site_name,
    s.slug,
    s.template_id,
    s.navbar_style,
    s.is_published,
    s.published_at,
    z.id AS zone_id,
    z.zone_type,
    z.position AS zone_position,
    z.config AS zone_config,
    z.is_visible AS zone_visible
FROM sites s
LEFT JOIN zones z ON s.id = z.site_id
ORDER BY s.id, z.position;

-- View: Components with their zone context
CREATE OR REPLACE VIEW components_in_context AS
SELECT
    c.id AS component_id,
    c.zone_id,
    z.site_id,
    z.zone_type,
    c.component_type,
    c.component_id,
    c.parent_id,
    c.position,
    c.props,
    c.integration_refs,
    c.style_variant,
    c.animation_config,
    c.is_visible,
    c.is_draft
FROM components c
JOIN zones z ON c.zone_id = z.id
ORDER BY z.site_id, z.position, c.position;

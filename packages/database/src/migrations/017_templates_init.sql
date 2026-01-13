-- AI Builder Agent Template System Migration
-- Stores templates, archetypes, and component definitions for AI-driven site generation
-- 20 templates across 8 archetypes for comprehensive business coverage

-- =====================================================
-- TEMPLATE ARCHETYPES TABLE
-- =====================================================
-- Archetypes group templates by business type and use case
CREATE TABLE IF NOT EXISTS template_archetypes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,  -- Emoji or icon identifier
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 8 archetypes
INSERT INTO template_archetypes (id, name, description, icon, sort_order) VALUES
('booking-pro', 'Booking Pro', 'Service businesses with appointments and scheduling', '📅', 1),
('creator-hub', 'Creator Hub', 'Content creators and portfolio sites', '🎨', 2),
('trust-builder', 'Trust Builder', 'Professional services and expertise showcase', '🏆', 3),
('local-finder', 'Local Finder', 'Location-dependent businesses', '📍', 4),
('marketplace', 'Marketplace', 'Inventory-based sales and catalogs', '🛒', 5),
('events', 'Events', 'Event and ticketing focused', '🎟️', 6),
('premium', 'Premium', 'High-end and custom designs', '✨', 7),
('multi-location', 'Multi-Location', 'Franchises and chain businesses', '🏢', 8)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TEMPLATES TABLE
-- =====================================================
-- Templates define complete site structures with component trees
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,  -- T001, T002, etc.
    name TEXT NOT NULL,
    archetype_id TEXT NOT NULL REFERENCES template_archetypes(id) ON DELETE CASCADE,
    description TEXT,

    -- Target vertical/use case
    target_vertical TEXT,
    business_types TEXT[],  -- Array of business types this template fits

    -- Component tree (JSON structure of zones and components)
    component_tree JSONB NOT NULL DEFAULT '{}',

    -- Theme configuration
    theme_config JSONB NOT NULL DEFAULT '{}',

    -- Preview assets
    preview_image_url TEXT,
    demo_url TEXT,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for template queries
CREATE INDEX IF NOT EXISTS idx_templates_archetype ON templates(archetype_id);
CREATE INDEX IF NOT EXISTS idx_templates_vertical ON templates(target_vertical);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active, sort_order);

-- =====================================================
-- TEMPLATE COMPONENT DEFINITIONS
-- =====================================================
-- Reusable component definitions that templates reference
CREATE TABLE IF NOT EXISTS template_components (
    id TEXT PRIMARY KEY,
    component_type TEXT NOT NULL,  -- atom, molecule, organism
    component_id TEXT NOT NULL,     -- button, heading, hero-split, etc.
    name TEXT NOT NULL,
    description TEXT,

    -- Default configuration
    default_props JSONB NOT NULL DEFAULT '{}',
    default_style TEXT DEFAULT 'default',
    default_tokens JSONB NOT NULL DEFAULT '{}',
    default_animation JSONB NOT NULL DEFAULT '{}',

    -- AI agent metadata
    ai_purpose TEXT,  -- capture-email, prove-trust, explain-feature, etc.
    ai_description TEXT,  -- Natural language description for AI

    -- Zone compatibility
    compatible_zones TEXT[],  -- zone-hero, zone-features, zone-trust, etc.

    -- Categorization
    category TEXT,
    tags TEXT[],

    -- Source info
    source TEXT DEFAULT 'custom',  -- aceternity, magic-ui, custom

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for component lookups
CREATE INDEX IF NOT EXISTS idx_template_components_type ON template_components(component_type, component_id);
CREATE INDEX IF NOT EXISTS idx_template_components_purpose ON template_components(ai_purpose);
CREATE INDEX IF NOT EXISTS idx_template_components_category ON template_components(category);

-- =====================================================
-- TEMPLATE MIGRATION: SEED 20 TEMPLATES
-- =====================================================

-- BOOKING PRO ARCHETYPE (4 templates)
INSERT INTO templates (id, name, archetype_id, target_vertical, business_types, component_tree, theme_config, sort_order) VALUES
-- T001: Salon Pro
('T001', 'Salon Pro', 'booking-pro', 'Beauty/Hair', ARRAY['salon', 'hair stylist', 'barber', 'nail salon', 'spa'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-booking", ""type": "organism", ""props": {"title": "Book Your Appointment", ""subtitle": "Professional beauty services"}}]}, {"zone_type": "zone-services", ""position": 2, "components": [{"component_id": "services-grid", ""type": "molecule", ""props": {}}]}, {"zone_type": "zone-pricing", ""position": 3, "components": [{"component_id": "pricing-cards", ""type": "organism", ""props": {}}]}, {"zone_type": "zone-gallery", ""position": 4, "components": [{"component_id": "image-gallery", ""type": "organism", ""props": {}}]}, {"zone_type": "zone-reviews", ""position": 5, "components": [{"component_id": "testimonials", ""type": "organism", ""props": {}}]}, {"zone_type": "zone-cta", ""position": 6, "components": [{"component_id": "booking-cta", ""type": "molecule", ""props": {}}]}]}',
'{"colors": {"primary": "#ec4899", ""secondary": "#8b5cf6", ""accent": "#f472b6"}, "typography": {"heading": "Playfair Display", ""body": "Inter"}, "style": "elegant"}',
1),

-- T002: Service Biz
('T002', 'Service Biz', 'booking-pro', 'Cleaners/Services', ARRAY['house cleaner', 'maid service', 'carpet cleaning', 'pressure washing', 'handyman'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-trust", ""type": "organism", ""props": {"title": "Professional Service You Can Trust"}}]}, {"zone_type": "zone-features", ""position": 2, "components": [{"component_id": "features-list", ""type": "organism", ""props": {}}]}, {"zone_type": "zone-pricing", ""position": 3, "components": [{"component_id": "pricing-table", ""type": "molecule", ""props": {}}]}, {"zone_type": "zone-cta", ""position": 4, "components": [{"component_id": "contact-booking", ""type": "organism", ""props": {}}]}, {"zone_type": "zone-faq", ""position": 5, "components": [{"component_id": "faq-accordion", ""type": "molecule", ""props": {}}]}]}',
'{"colors": {"primary": "#3b82f6", ""secondary": "#1e40af", ""accent": "#60a5fa"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "professional"}',
2),

-- T006: Dental Care
('T006', 'Dental Care', 'booking-pro', 'Dentists/Orthodontists', ARRAY['dentist', 'orthodontist', 'dental clinic', 'oral surgeon'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-medical", ""type": "organism", ""props": {"title": "Your Smile, Our Priority"}}]}, {"zone_type": "zone-services", ""position": 2, "components": [{"component_id": "services-list", ""type": "molecule", ""props": {}}]}, {"zone_type": "zone-trust", ""position": 3, "components": [{"component_id": "team-showcase", ""type": "organism", ""props": {}}]}, {"zone_type": "zone-reviews", ""position": 4, "components": [{"component_id": "testimonials-slider", ""type": "organism", ""props": {}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "appointment-booking", ""type": "organism", ""props": {"showInsurance": true}}]}]}',
'{"colors": {"primary": "#0ea5e9", ""secondary": "#0284c7", ""accent": "#38bdf8"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "medical"}',
3),

-- T007: Wellness Studio
('T007', 'Wellness Studio', 'booking-pro', 'Yoga/Massage/Coaching', ARRAY['yoga studio', 'massage therapist', 'life coach', 'wellness center', 'fitness instructor'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-zen", ""type": "organism", ""props": {"title": "Find Your Balance"}}]}, {"zone_type": "zone-features", ""position": 2, "components": [{"component_id": "wellness-features", ""type": "organism", ""props": {}}]}, {"zone_type": "zone-services", ""position": 3, "components": [{"component_id": "services-cards", ""type": "molecule", ""props": {}}]}, {"zone_type": "zone-team", ""position": 4, "components": [{"component_id": "instructor-profiles", ""type": "organism", ""props": {}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "class-schedule", ""type": "molecule", ""props": {}}]}]}',
'{"colors": {"primary": "#84cc16", ""secondary": "#65a30d", ""accent": "#a3e635"}, "typography": {"heading": "Playfair Display", ""body": "Lato"}, "style": "calm"}',
4)

ON CONFLICT (id) DO NOTHING;

-- CREATOR HUB ARCHETYPE (5 templates)
INSERT INTO templates (id, name, archetype_id, target_vertical, business_types, component_tree, theme_config, sort_order) VALUES
-- T003: Creator Hub
('T003', 'Creator Hub', 'creator-hub', 'Influencers', ARRAY['influencer', 'content creator', 'vlogger', 'streamer', 'blogger'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-creator", ""type": "organism", ""props": {"title": "Hi, I''m [Name]"}}]}, {"zone_type": "zone-content", ""position": 2, "components": [{"component_id": "video-grid", ""type": "organism", ""props": {}}]}, {"zone_type": "zone-social", ""position": 3, "components": [{"component_id": "social-links-bio", ""type": "molecule", ""props": {}}]}, {"zone_type": "zone-cta", ""position": 4, "components": [{"component_id": "collab-cta", ""type": "molecule", ""props": {}}]}]}',
'{"colors": {"primary": "#f472b6", ""secondary": "#ec4899", ""accent": "#f9a8d4"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "vibrant"}',
5),

-- T004: Media Kit
('T004', 'Media Kit', 'creator-hub', 'Podcasters/Musicians', ARRAY['podcaster', 'musician', 'band', 'dj', 'audio producer'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-audio", ""type": "organism", ""props": {"title": "Listen Now"}}]}, {"zone_type": "zone-media", ""position": 2, "components": [{"component_id": "audio-player", ""type": "molecule", ""props": {}}]}, {"zone_type": "zone-content", ""position": 3, "components": [{"component_id": "discography", ""type": "organism", ""props": {}}]}, {"zone_type": "zone-events", ""position": 4, "components": [{"component_id": "tour-dates", ""type": "molecule", ""props": {}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "booking-inquiry", ""type": "molecule", ""props": {}}]}]}',
'{"colors": {"primary": "#a855f7", ""secondary": "#7c3aed", ""accent": "#c084fc"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "modern"}',
6),

-- T008: Artist Portfolio
('T008', 'Artist Portfolio', 'creator-hub', 'Visual Artists', ARRAY['photographer', 'painter', 'sculptor', 'digital artist', 'illustrator'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-minimal-artist", ""type": "organism", ""props": {"showPortfolio": true}}]}, {"zone_type": "zone-gallery", ""position": 2, "components": [{"component_id": "masonry-gallery", ""type": "organism", ""props": {"layout": "masonry"}}]}, {"zone_type": "zone-about", ""position": 3, "components": [{"component_id": "artist-bio", ""type": "molecule", ""props": {}}]}, {"zone_type": "zone-cta", ""position": 4, "components": [{"component_id": "commission-inquiry", ""type": "molecule", ""props": {}}]}]}',
'{"colors": {"primary": "#1f2937", ""secondary": "#374151", ""accent": "#6b7280"}, "typography": {"heading": "Playfair Display", ""body": "Inter"}, "style": "minimal"}',
7),

-- T009: Author Platform
('T009', 'Author Platform', 'creator-hub', 'Authors/Ghostwriters', ARRAY['author', 'ghostwriter', 'copywriter', 'journalist'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-author", ""type": "organism", ""props": {"title": "[Book Title]"}}]}, {"zone_type": "zone-content", ""position": 2, "components": [{"component_id": "book-showcase", ""type": "organism", ""props": {"showExcerpt": true}}]}, {"zone_type": "zone-content", ""position": 3, "components": [{"component_id": "chapter-preview", ""type": "molecule", ""props": {}}]}, {"zone_type": "zone-events", ""position": 4, "components": [{"component_id": "event-calendar", ""type": "molecule", ""props": {"type": "book-tour"}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "newsletter-cta", ""type": "molecule", ""props": {}}]}]}',
'{"colors": {"primary": "#78350f", ""secondary": "#92400e", ""accent": "#b45309"}, "typography": {"heading": "Merriweather", ""body": "Georgia"}, "style": "literary"}',
8),

-- T019: Stylepreneur (HYBRID)
('T019', 'Stylepreneur', 'creator-hub', 'Hair Stylists/Makeup Artists', ARRAY['hair stylist', 'makeup artist', 'beauty influencer', 'cosmetologist'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-style", ""type": "organism", ""props": {"title": "Book Your Look", ""showInstagram": true}}]}, {"zone_type": "zone-content", ""position": 2, "components": [{"component_id": "ig-feed-grid", ""type": "organism", ""props": {"autoSync": true}}]}, {"zone_type": "zone-services", ""position": 3, "components": [{"component_id": "services-booking", ""type": "molecule", ""props": {"showPricing": true}}]}, {"zone_type": "zone-content", ""position": 4, "components": [{"component_id": "tutorial-gallery", ""type": "organism", ""props": {"layout": "grid"}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "social-booking-cta", ""type": "molecule", ""props": {}}]}]}',
'{"colors": {"primary": "#ec4899", ""secondary": "#db2777", ""accent": "#f472b6"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "trendy"}',
9)

ON CONFLICT (id) DO NOTHING;

-- TRUST BUILDER ARCHETYPE (4 templates)
INSERT INTO templates (id, name, archetype_id, target_vertical, business_types, component_tree, theme_config, sort_order) VALUES
-- T011: Law Office
('T011', 'Law Office', 'trust-builder', 'Lawyers/Attorneys', ARRAY['lawyer', 'attorney', 'law firm', 'legal services'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-professional", ""type": "organism", ""props": {"title": "Experienced Legal Representation"}}]}, {"zone_type": "zone-features", ""position": 2, "components": [{"component_id": "practice-areas", ""type": "organism", ""props": {"layout": "grid"}}]}, {"zone_type": "zone-trust", ""position": 3, "components": [{"component_id": "case-results", ""type": "organism", ""props": {"showVerdicts": true}}]}, {"zone_type": "zone-content", ""position": 4, "components": [{"component_id": "attorney-profiles", ""type": "organism", ""props": {"showCredentials": true}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "consultation-cta", ""type": "molecule", ""props": {"type": "consultation"}}]}]}',
'{"colors": {"primary": "#1e3a8a", ""secondary": "#1e40af", ""accent": "#3b82f6"}, "typography": {"heading": "Inter", ""body": "Georgia"}, "style": "authoritative"}',
10),

-- T012: Education Hub
('T012', 'Education Hub', 'trust-builder', 'Teachers/Tutors', ARRAY['teacher', 'tutor', 'education center', 'training institute', 'school'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-education", ""type": "organism", ""props": {"title": "Learn With [Name]"}}]}, {"zone_type": "zone-features", ""position": 2, "components": [{"component_id": "courses-grid", ""type": "organism", ""props": {"showEnrollment": true}}]}, {"zone_type": "zone-content", ""position": 3, "components": [{"component_id": "credentials", ""type": "molecule", ""props": {"showCertifications": true}}]}, {"zone_type": "zone-trust", ""position": 4, "components": [{"component_id": "testimonials", ""type": "organism", ""props": {"showGrades": true}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "enrollment-cta", ""type": "molecule", ""props": {}}]}]}',
'{"colors": {"primary": "#059669", ""secondary": "#047857", ""accent": "#10b981"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "academic"}',
11),

-- T013: Consulting Pro
('T013', 'Consulting Pro', 'trust-builder', 'Consultants/Agencies', ARRAY['consultant', 'agency', 'business advisor', 'strategy firm'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-consulting", ""type": "organism", ""props": {"title": "Grow Your Business"}}]}, {"zone_type": "zone-features", ""position": 2, "components": [{"component_id": "services-offered", ""type": "organism", ""props": {"showROI": true}}]}, {"zone_type": "zone-trust", ""position": 3, "components": [{"component_id": "case-studies", ""type": "organism", ""props": {"showMetrics": true}}]}, {"zone_type": "zone-content", ""position": 4, "components": [{"component_id": "process-timeline", ""type": "molecule", ""props": {}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "discovery-cta", ""type": "molecule", ""props": {"type": "discovery-call"}}]}]}',
'{"colors": {"primary": "#4f46e5", ""secondary": "#4338ca", ""accent": "#6366f1"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "strategic"}',
12),

-- T020: Expert Advisor
('T020', 'Expert Advisor', 'trust-builder', 'Consultants/Therapists', ARRAY['therapist', 'counselor', 'financial advisor', 'business coach'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-expert", ""type": "organism", ""props": {"title": "Expert Guidance"}}]}, {"zone_type": "zone-content", ""position": 2, "components": [{"component_id": "expertise-showcase", ""type": "organism", ""props": {"showResources": true}}]}, {"zone_type": "zone-trust", ""position": 3, "components": [{"component_id": "credentials-list", ""type": "molecule", ""props": {"showCertifications": true}}]}, {"zone_type": "zone-content", ""position": 4, "components": [{"component_id": "resources-library", ""type": "organism", ""props": {"layout": "grid"}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "consultation-booking", ""type": "molecule", ""props": {}}]}]}',
'{"colors": {"primary": "#6366f1", ""secondary": "#4f46e5", ""accent": "#818cf8"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "supportive"}',
13)

ON CONFLICT (id) DO NOTHING;

-- LOCAL FINDER ARCHETYPE (3 templates)
INSERT INTO templates (id, name, archetype_id, target_vertical, business_types, component_tree, theme_config, sort_order) VALUES
-- T014: Food Truck
('T014', 'Food Truck', 'local-finder', 'Food Trucks/Caterers', ARRAY['food truck', 'caterer', 'mobile food', 'pop-up restaurant'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-food", ""type": "organism", ""props": {"title": "Find Us Near You"}}]}, {"zone_type": "zone-content", ""position": 2, "components": [{"component_id": "location-schedule", ""type": "molecule", ""props": {"showCalendar": true}}]}, {"zone_type": "zone-features", ""position": 3, "components": [{"component_id": "menu-grid", ""type": "organism", ""props": {"showPrices": true}}]}, {"zone_type": "zone-content", ""position": 4, "components": [{"component_id": "catering-info", ""type": "molecule", ""props": {}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "order-cta", ""type": "molecule", ""props": {"type": "preorder"}}]}]}',
'{"colors": {"primary": "#f97316", ""secondary": "#ea580c", ""accent": "#fb923c"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "appetizing"}',
14),

-- T016: Rental Stay
('T016', 'Rental Stay', 'local-finder', 'Airbnb Hosts/Rentals', ARRAY['airbnb host', 'vacation rental', 'bnb', 'guest house'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-stay", ""type": "organism", ""props": {"title": "Your Perfect Getaway"}}]}, {"zone_type": "zone-gallery", ""position": 2, "components": [{"component_id": "property-gallery", ""type": "organism", ""props": {"showAmenities": true}}]}, {"zone_type": "zone-features", ""position": 3, "components": [{"component_id": "amenities-list", ""type": "molecule", ""props": {"layout": "grid"}}]}, {"zone_type": "zone-content", ""position": 4, "components": [{"component_id": "availability-calendar", ""type": "molecule", ""props": {"showPricing": true}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "booking-cta", ""type": "molecule", ""props": {"type": "reservation"}}]}]}',
'{"colors": {"primary": "#dc2626", ""secondary": "#b91c1c", ""accent": "#ef4444"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "welcoming"}',
15),

-- T017: Home Services
('T017', 'Home Services', 'local-finder', 'Contractors/Real Estate', ARRAY['contractor', 'real estate agent', 'home inspector', 'handyman', 'landscaper'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-services", ""type": "organism", ""props": {"title": "Quality Home Services"}}]}, {"zone_type": "zone-features", ""position": 2, "components": [{"component_id": "service-areas", ""type": "molecule", ""props": {"showMap": true}}]}, {"zone_type": "zone-content", ""position": 3, "components": [{"component_id": "projects-showcase", ""type": "organism", ""props": {"layout": "gallery"}}]}, {"zone_type": "zone-trust", ""position": 4, "components": [{"component_id": "quote-form", ""type": "molecule", ""props": {"type": "quote-request"}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "contact-cta", ""type": "molecule", ""props": {}}]}]}',
'{"colors": {"primary": "#0d9488", ""secondary": "#0f766e", ""accent": "#14b8a6"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "reliable"}',
16)

ON CONFLICT (id) DO NOTHING;

-- MARKETPLACE ARCHETYPE (1 template)
INSERT INTO templates (id, name, archetype_id, target_vertical, business_types, component_tree, theme_config, sort_order) VALUES
-- T015: Auto Marketplace
('T015', 'Auto Marketplace', 'marketplace', 'Car Dealers/Turo Hosts', ARRAY['car dealer', 'used car sales', 'turo host', 'car rental', 'auto sales'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-auto", ""type": "organism", ""props": {"title": "Find Your Perfect Ride"}}]}, {"zone_type": "zone-content", ""position": 2, "components": [{"component_id": "inventory-search", ""type": "organism", ""props": {"showFilters": true}}]}, {"zone_type": "zone-features", ""position": 3, "components": [{"component_id": "vehicle-listing", ""type": "molecule", ""props": {"showPricing": true}}]}, {"zone_type": "zone-cta", ""position": 4, "components": [{"component_id": "financing-cta", ""type": "molecule", ""props": {"showCalculator": true}}]}, {"zone_type": "zone-content", ""position": 5, "components": [{"component_id": "contact-form", ""type": "molecule", ""props": {"type": "inquiry"}}]}]}',
'{"colors": {"primary": "#2563eb", ""secondary": "#1d4ed8", ""accent": "#3b82f6"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "automotive"}',
17)

ON CONFLICT (id) DO NOTHING;

-- EVENTS ARCHETYPE (1 template)
INSERT INTO templates (id, name, archetype_id, target_vertical, business_types, component_tree, theme_config, sort_order) VALUES
-- T010: Party Promoter
('T010', 'Party Promoter', 'events', 'Event Promoters/DJs', ARRAY['event promoter', 'dj', 'party organizer', 'nightclub', 'event planner'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-party", ""type": "organism", ""props": {"title": "Next Event", ""showCountdown": true}}]}, {"zone_type": "zone-events", ""position": 2, "components": [{"component_id": "event-calendar", ""type": "organism", ""props": {"showTickets": true}}]}, {"zone_type": "zone-gallery", ""position": 3, "components": [{"component_id": "party-gallery", ""type": "organism", ""props": {"layout": "grid"}}]}, {"zone_type": "zone-content", ""position": 4, "components": [{"component_id": "ticket-cta", ""type": "molecule", ""props": {"showPricing": true}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "newsletter-cta", ""type": "molecule", ""props": {"type": "event-updates"}}]}]}',
'{"colors": {"primary": "#7c3aed", ""secondary": "#6d28d9", ""accent": "#8b5cf6"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "energetic"}',
18)

ON CONFLICT (id) DO NOTHING;

-- PREMIUM ARCHETYPE (1 template)
INSERT INTO templates (id, name, archetype_id, target_vertical, business_types, component_tree, theme_config, is_premium, sort_order) VALUES
-- T005: Cinematic Scroll (Premium)
('T005', 'Cinematic Scroll', 'premium', 'All Luxury', ARRAY['luxury brand', 'high-end service', 'premium product', 'exclusive'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-cinematic", ""type": "organism", ""props": {"scrollAnimation": true, "videoBackground": true, "sticky": true}}]}, {"zone_type": "zone-content", ""position": 2, "components": [{"component_id": "scroll-reveal", ""type": "organism", ""props": {"parallax": true}}]}, {"zone_type": "zone-features", ""position": 3, "components": [{"component_id": "premium-features", ""type": "organism", ""props": {"animation": "3d"}}]}, {"zone_type": "zone-content", ""position": 4, "components": [{"component_id": "showcase-gallery", ""type": "organism", ""props": {"layout": "immersive"}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "exclusive-cta", ""type": "molecule", ""props": {"type": "inquiry"}}]}]}',
'{"colors": {"primary": "#000000", ""secondary": "#1a1a1a", ""accent": "#ffffff"}, "typography": {"heading": "Playfair Display", ""body": "Inter"}, "style": "cinematic", ""scrollEffects": ["parallax", ""videoFrame", ""3dTransform"]}',
true,
19)

ON CONFLICT (id) DO NOTHING;

-- MULTI-LOCATION ARCHETYPE (1 template)
INSERT INTO templates (id, name, archetype_id, target_vertical, business_types, component_tree, theme_config, sort_order) VALUES
-- T018: Booking Engine
('T018', 'Booking Engine', 'multi-location', 'Franchises/Chains', ARRAY['franchise', 'chain', 'multi-location', 'restaurant chain'],
'{"zones": [{"zone_type": "zone-hero", ""position": 1, "components": [{"component_id": "hero-multi", ""type": "organism", ""props": {"title": "Find Your Location", ""showLocator": true}}]}, {"zone_type": "zone-features", ""position": 2, "components": [{"component_id": "location-finder", ""type": "organism", ""props": {"showMap": true, "showFilters": true}}]}, {"zone_type": "zone-content", ""position": 3, "components": [{"component_id": "locations-grid", ""type": "organism", ""props": {"showHours": true}}]}, {"zone_type": "zone-features", ""position": 4, "components": [{"component_id": "services-grid", ""type": "organism", ""props": {"showPricing": true}}]}, {"zone_type": "zone-cta", ""position": 5, "components": [{"component_id": "location-booking", ""type": "molecule", ""props": {"showAllLocations": true}}]}]}',
'{"colors": {"primary": "#0369a1", ""secondary": "#075985", ""accent": "#0ea5e9"}, "typography": {"heading": "Inter", ""body": "Inter"}, "style": "corporate"}',
20)

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SEED COMPONENT DEFINITIONS (Sample)
-- =====================================================
INSERT INTO template_components (id, component_type, component_id, name, description, default_props, ai_purpose, compatible_zones, category) VALUES
-- Atom components
('btn-hero-cta', 'atom', 'button', 'Hero CTA Button', 'Primary call-to-action for hero sections',
'{"text": "Get Started", ""variant": "primary", ""size": "lg"}',
'capture-lead',
'{"zone-hero", ""zone-cta"}',
'buttons'),

('btn-secondary', 'atom', 'button', 'Secondary Button', 'Secondary action button',
'{"text": "Learn More", ""variant": "secondary", ""size": "md"}',
'secondary-cta',
'["zone-hero", ""zone-features", ""zone-cta"]',
'buttons'),

('heading-hero', 'atom', 'heading', 'Hero Heading', 'Main heading for hero sections',
'{"text": "Welcome to Our Business", ""level": 1, "variant": "display"}',
'brand-introduction',
'["zone-hero"]',
'typography'),

-- Molecule components
('services-grid', 'molecule', 'service-cards', 'Services Grid', 'Grid of service cards with pricing',
'{"layout": "grid", ""columns": 3, "showPricing": true, "showBooking": true}',
'service-display',
'["zone-features", ""zone-services", ""zone-pricing"]',
'services'),

('social-links-bio', 'molecule', 'social-links', 'Social Bio Links', 'Social media links for creator bios',
'{"platforms": ["instagram", ""youtube", ""tiktok"], "layout": "row", ""showCounts": true}',
'social-connect',
'["zone-hero", ""zone-social", ""zone-cta"]',
'social'),

('testimonial-card', 'molecule', 'testimonial', 'Testimonial Card', 'Customer testimonial with rating',
'{"showRating": true, "showDate": false, "avatar": true}',
'social-proof',
'["zone-trust", ""zone-reviews"]',
'testimonials'),

-- Organism components
('hero-booking', 'organism', 'hero-split', 'Hero with Booking', 'Split hero with image and booking CTA',
'{"title": "Book Your Appointment", ""subtitle": "Professional services", ""ctaText": "Book Now", ""showImage": true}',
'capture-booking',
'["zone-hero"]',
'hero'),

('hero-creator', 'organism', 'hero-creator', 'Creator Hero', 'Hero for content creators with bio',
'{"title": "Hi, I''m [Name]", ""subtitle": "Content Creator", ""showSocial": true, "showLatest": true}',
'creator-introduction',
'["zone-hero"]',
'hero'),

('ig-feed-grid', 'organism', 'instagram-grid', 'Instagram Feed Grid', 'Auto-syncing Instagram feed',
'{"layout": "grid", ""columns": 3, "autoSync": true, "showCaptions": true}',
'content-showcase',
'["zone-content", ""zone-social"]',
'integrations'),

('tour-dates', 'organism', 'event-list', 'Tour Dates List', 'Event/tour date listings',
'{"showTickets": true, "showVenue": true, "layout": "list"}',
'event-promotion',
'["zone-events", ""zone-content"]',
'events'),

('case-studies', 'organism', 'case-study-grid', 'Case Studies Grid', 'Consulting/case study showcase',
'{"showMetrics": true, "showResults": true, "layout": "grid"}',
'prove-expertise',
'["zone-trust", ""zone-features"]',
'trust')

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TRIGGERS: Update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_templates_updated_at();

CREATE TRIGGER trg_update_template_components_updated_at
    BEFORE UPDATE ON template_components
    FOR EACH ROW
    EXECUTE FUNCTION update_templates_updated_at();

-- =====================================================
-- VIEWS: For easy template queries
-- =====================================================

-- View: Templates with archetypes
CREATE OR REPLACE VIEW templates_with_archetypes AS
SELECT
    t.id,
    t.name,
    t.archetype_id,
    a.name AS archetype_name,
    a.icon AS archetype_icon,
    t.target_vertical,
    t.business_types,
    t.component_tree,
    t.theme_config,
    t.preview_image_url,
    t.is_active,
    t.is_premium,
    t.sort_order
FROM templates t
JOIN template_archetypes a ON t.archetype_id = a.id
WHERE t.is_active = true
ORDER BY a.sort_order, t.sort_order;

-- View: Component presets by purpose
CREATE OR REPLACE VIEW components_by_purpose AS
SELECT
    c.id,
    c.component_type,
    c.component_id,
    c.name,
    c.description,
    c.default_props,
    c.ai_purpose,
    c.compatible_zones,
    c.category
FROM template_components c
ORDER BY c.ai_purpose, c.category, c.name;

-- =====================================================
-- FUNCTIONS: Helper functions for agent queries
-- =====================================================

-- Function: Get templates by archetype
CREATE OR REPLACE FUNCTION get_templates_by_archetype(p_archetype_id TEXT)
RETURNS TABLE (
    template_id TEXT,
    name TEXT,
    target_vertical TEXT,
    component_tree JSONB,
    theme_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.target_vertical,
        t.component_tree,
        t.theme_config
    FROM templates t
    WHERE t.archetype_id = p_archetype_id
      AND t.is_active = true
    ORDER BY t.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Function: Get template by ID
CREATE OR REPLACE FUNCTION get_template_by_id(p_template_id TEXT)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    archetype_id TEXT,
    target_vertical TEXT,
    business_types TEXT[],
    component_tree JSONB,
    theme_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.archetype_id,
        t.target_vertical,
        t.business_types,
        t.component_tree,
        t.theme_config
    FROM templates t
    WHERE t.id = p_template_id
      AND t.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function: Get component definitions
CREATE OR REPLACE FUNCTION get_component_definitions()
RETURNS TABLE (
    id TEXT,
    component_type TEXT,
    component_id TEXT,
    name TEXT,
    default_props JSONB,
    ai_purpose TEXT,
    compatible_zones TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.component_type,
        c.component_id,
        c.name,
        c.default_props,
        c.ai_purpose,
        c.compatible_zones
    FROM template_components c
    ORDER BY c.component_type, c.component_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES for agent queries
-- =====================================================

-- GIN index for JSONB searches
CREATE INDEX IF NOT EXISTS idx_templates_component_tree ON templates USING GIN (component_tree);
CREATE INDEX IF NOT EXISTS idx_templates_theme_config ON templates USING GIN (theme_config);
CREATE INDEX IF NOT EXISTS idx_templates_business_types ON templates USING GIN (business_types);

-- Index for archetype lookups
CREATE INDEX IF NOT EXISTS idx_templates_archetype_active ON templates(archetype_id, is_active);

-- Index for component lookups
CREATE INDEX IF NOT EXISTS idx_template_components_compatible_zones ON template_components USING GIN (compatible_zones);

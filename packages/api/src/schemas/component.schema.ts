/**
 * Component System Schemas
 * Zod schemas for validating component configuration requests
 */

import { z } from 'zod';

// =====================================================
// Sites
// =====================================================

export const CreateSiteSchema = z.object({
  tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
  name: z.string().min(1).max(200).default('My Site'),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  templateId: z.enum(['starter', 'creative', 'pro', 'builder', 'personal', 'shop']).default('starter'),
  navbarStyle: z.enum(['clean', 'bold', 'floating', 'split', 'minimal']).default('floating'),
});

export const UpdateSiteSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  templateId: z.enum(['starter', 'creative', 'pro', 'builder', 'personal', 'shop']).optional(),
  navbarStyle: z.enum(['clean', 'bold', 'floating', 'split', 'minimal']).optional(),
  isPublished: z.boolean().optional(),
});

export const SiteResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  name: z.string(),
  slug: z.string(),
  templateId: z.string(),
  navbarStyle: z.string(),
  isPublished: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// =====================================================
// Zones
// =====================================================

export const CreateZoneSchema = z.object({
  siteId: z.string().uuid(),
  zoneType: z.enum([
    'zone-header',
    'zone-hero',
    'zone-features',
    'zone-trust',
    'zone-content',
    'zone-pricing',
    'zone-cta',
    'zone-footer',
    'zone-process',
    'zone-faq',
  ]),
  position: z.number().int().min(0).default(0),
  config: z.record(z.any()).default({}),
  isVisible: z.boolean().default(true),
});

export const UpdateZoneSchema = z.object({
  position: z.number().int().min(0).optional(),
  config: z.record(z.any()).optional(),
  isVisible: z.boolean().optional(),
});

export const ZoneResponseSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  zoneType: z.string(),
  position: z.number(),
  config: z.record(z.any()),
  isVisible: z.boolean(),
  createdAt: z.string().datetime(),
});

// =====================================================
// Components
// =====================================================

export const CreateComponentSchema = z.object({
  zoneId: z.string().uuid(),
  componentType: z.enum(['atom', 'molecule', 'organism']),
  componentId: z.string().min(1),
  parentId: z.string().uuid().optional(),
  position: z.number().int().min(0).default(0),
  props: z.record(z.any()).default({}),
  integrationRefs: z.record(z.any()).default({}),
  styleVariant: z.string().default('default'),
  tokensOverride: z.record(z.any()).default({}),
  animationConfig: z.object({
    entrance: z.string().optional(),
    trigger: z.enum(['load', 'scroll', 'hover']).optional(),
    duration: z.enum(['fast', 'normal', 'slow']).optional(),
    stagger: z.enum(['none', 'fast', 'normal', 'slow']).optional(),
  }).default({}),
  isVisible: z.boolean().default(true),
  isDraft: z.boolean().default(false),
});

export const UpdateComponentSchema = z.object({
  position: z.number().int().min(0).optional(),
  props: z.record(z.any()).optional(),
  integrationRefs: z.record(z.any()).optional(),
  styleVariant: z.string().optional(),
  tokensOverride: z.record(z.any()).optional(),
  animationConfig: z.object({
    entrance: z.string().optional(),
    trigger: z.enum(['load', 'scroll', 'hover']).optional(),
    duration: z.enum(['fast', 'normal', 'slow']).optional(),
    stagger: z.enum(['none', 'fast', 'normal', 'slow']).optional(),
  }).optional(),
  isVisible: z.boolean().optional(),
  isDraft: z.boolean().optional(),
});

export interface ComponentResponse {
  id: string;
  zoneId: string;
  componentType: string;
  componentId: string;
  parentId: string | null;
  position: number;
  props: Record<string, any>;
  integrationRefs: Record<string, any>;
  styleVariant: string;
  tokensOverride: Record<string, any>;
  animationConfig: Record<string, any>;
  isVisible: boolean;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  children?: ComponentResponse[];
}

export const ComponentResponseSchema: z.ZodType<ComponentResponse> = z.object({
  id: z.string().uuid(),
  zoneId: z.string().uuid(),
  componentType: z.string(),
  componentId: z.string(),
  parentId: z.string().uuid().nullable(),
  position: z.number(),
  props: z.record(z.any()),
  integrationRefs: z.record(z.any()),
  styleVariant: z.string(),
  tokensOverride: z.record(z.any()),
  animationConfig: z.record(z.any()),
  isVisible: z.boolean(),
  isDraft: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  children: z.lazy(() => ComponentResponseSchema.array()).optional(),
});

// =====================================================
// Integrations
// =====================================================

export const CreateIntegrationSchema = z.object({
  siteId: z.string().uuid(),
  integrationType: z.enum([
    'instagram',
    'youtube',
    'twitter',
    'facebook',
    'spotify',
    'soundcloud',
    'tiktok',
    'linkedin',
    'dropbox',
  ]),
  credentials: z.record(z.any()),
  autoSync: z.boolean().default(false),
});

export const UpdateIntegrationSchema = z.object({
  credentials: z.record(z.any()).optional(),
  autoSync: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const IntegrationResponseSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  integrationType: z.string(),
  credentials: z.record(z.any()),
  cachedContent: z.record(z.any()),
  autoSync: z.boolean(),
  lastSyncAt: z.string().datetime().nullable(),
  syncStatus: z.string(),
  lastError: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// =====================================================
// Integration Input (for @handle parsing)
// =====================================================

export const IntegrationInputSchema = z.object({
  siteId: z.string().uuid(),
  input: z.string().min(1),
  autoCreateComponent: z.boolean().default(true),
  targetZone: z.enum([
    'zone-header',
    'zone-hero',
    'zone-features',
    'zone-trust',
    'zone-content',
    'zone-pricing',
    'zone-cta',
    'zone-footer',
  ]).default('zone-content'),
});

export const IntegrationInputResponseSchema = z.object({
  integration: IntegrationResponseSchema,
  component: ComponentResponseSchema.optional(),
  parsed: z.object({
    platform: z.string(),
    handle: z.string().optional(),
    url: z.string().optional(),
  }),
});

// =====================================================
// Component Presets
// =====================================================

export const ComponentPresetResponseSchema = z.object({
  id: z.string().uuid(),
  componentType: z.string(),
  componentId: z.string(),
  presetName: z.string(),
  presetSlug: z.string(),
  defaultProps: z.record(z.any()),
  defaultStyle: z.string(),
  defaultTokens: z.record(z.any()),
  defaultAnimation: z.record(z.any()),
  description: z.string().nullable(),
  aiPurpose: z.string().nullable(),
  compatibleZones: z.array(z.string()),
  source: z.string().nullable(),
  createdAt: z.string().datetime(),
});

// =====================================================
// Error Responses
// =====================================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
});

// =====================================================
// List Responses
// =====================================================

export const SiteListResponseSchema = z.object({
  sites: z.array(SiteResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const ZoneListResponseSchema = z.object({
  zones: z.array(ZoneResponseSchema),
  total: z.number(),
});

export const ComponentListResponseSchema = z.object({
  components: z.array(ComponentResponseSchema),
  total: z.number(),
});

export const IntegrationListResponseSchema = z.object({
  integrations: z.array(IntegrationResponseSchema),
  total: z.number(),
});

// =====================================================
// Export Types
// =====================================================

export type CreateSite = z.infer<typeof CreateSiteSchema>;
export type UpdateSite = z.infer<typeof UpdateSiteSchema>;
export type SiteResponse = z.infer<typeof SiteResponseSchema>;

export type CreateZone = z.infer<typeof CreateZoneSchema>;
export type UpdateZone = z.infer<typeof UpdateZoneSchema>;
export type ZoneResponse = z.infer<typeof ZoneResponseSchema>;

export type CreateComponent = z.infer<typeof CreateComponentSchema>;
export type UpdateComponent = z.infer<typeof UpdateComponentSchema>;

export type CreateIntegration = z.infer<typeof CreateIntegrationSchema>;
export type UpdateIntegration = z.infer<typeof UpdateIntegrationSchema>;
export type IntegrationResponse = z.infer<typeof IntegrationResponseSchema>;

export type IntegrationInput = z.infer<typeof IntegrationInputSchema>;
export type IntegrationInputResponse = z.infer<typeof IntegrationInputResponseSchema>;

export type ComponentPresetResponse = z.infer<typeof ComponentPresetResponseSchema>;

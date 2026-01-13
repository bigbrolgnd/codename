/**
 * AI Builder Agent API Schemas
 * Zod schemas for agent API validation
 */

import { z } from 'zod';

// =====================================================
// REQUEST SCHEMAS
// =====================================================

/**
 * Generate Site Request
 * Request schema for site generation via AI agent
 */
export const GenerateSiteRequestSchema = z.object({
  tenantId: z.string().uuid(),
  templateId: z.string().min(1).max(10), // T001-T020 format
  variables: z.record(z.any()).default({}),
  businessContext: z.object({
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    description: z.string().optional(),
    tagline: z.string().optional(),
    colors: z.array(z.string()).optional(),
    vibe: z.string().optional(),
    services: z.array(z.object({
      name: z.string(),
      price: z.number(),
      duration: z.number().optional(),
      category: z.string().optional(),
    })).optional(),
  }).optional(),
});

/**
 * Get Schema Request
 * Request schema for schema introspection
 */
export const GetSchemaRequestSchema = z.object({
  templateId: z.string().optional(),
  componentType: z.string().optional(),
  includeArchetypes: z.boolean().default(true),
  includeComponents: z.boolean().default(true),
});

/**
 * Extract from Image Request
 * Request schema for vision extraction
 */
export const ExtractFromImageRequestSchema = z.object({
  imageUrl: z.string().url(),
  extractionType: z.enum(['logo', 'photo', 'priceList']),
});

/**
 * Extract from Batch Request
 * Request schema for batch extraction from multiple images
 */
export const ExtractFromBatchRequestSchema = z.object({
  images: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['logo', 'photo', 'priceList']),
  })),
});

/**
 * Recommend Templates Request
 * Request schema for template recommendations
 */
export const RecommendTemplatesRequestSchema = z.object({
  businessType: z.string().optional(),
  primaryGoal: z.enum(['booking', 'portfolio', 'sales', 'information']).optional(),
  hasLocation: z.boolean().optional(),
  discoveryMethod: z.enum(['google', 'social', 'referral', 'word-of-mouth']).optional(),
  priorityValue: z.enum(['professional', 'creative', 'fast', 'easy-booking']).optional(),
});

// =====================================================
// RESPONSE SCHEMAS
// =====================================================

/**
 * Generate Site Response
 * Response schema for site generation
 */
export const GenerateSiteResponseSchema = z.object({
  siteId: z.string().uuid(),
  tenantId: z.string().uuid(),
  templateId: z.string(),
  componentTree: z.object({
    zones: z.array(z.object({
      zoneType: z.string(),
      position: z.number(),
      components: z.array(z.any()),
    })),
  }),
  themeConfig: z.object({
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
    }),
    typography: z.object({
      heading: z.string(),
      body: z.string(),
    }),
  }),
  status: z.enum(['design_complete', 'generating', 'completed', 'error']),
  codeGeneration: z.object({
    status: z.string(),
    designSpecId: z.string().uuid().optional(),
  }).optional(),
});

/**
 * Get Schema Response
 * Response schema for schema introspection
 */
export const GetSchemaResponseSchema = z.object({
  templates: z.array(z.object({
    id: z.string(),
    name: z.string(),
    archetypeId: z.string(),
    archetypeName: z.string(),
    archetypeIcon: z.string(),
    targetVertical: z.string(),
    businessTypes: z.array(z.string()),
    isPremium: z.boolean(),
  })),
  components: z.array(z.object({
    id: z.string(),
    componentType: z.enum(['atom', 'molecule', 'organism']),
    componentId: z.string(),
    name: z.string(),
    description: z.string(),
    defaultProps: z.record(z.any()),
    aiPurpose: z.string().optional(),
    compatibleZones: z.array(z.string()),
    category: z.string(),
  })),
  archetypes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
  })),
  version: z.string(),
  generatedAt: z.string().datetime(),
});

/**
 * Extract from Image Response
 * Response schema for vision extraction
 */
export const ExtractFromImageResponseSchema = z.object({
  extractionId: z.string().uuid(),
  type: z.enum(['logo', 'photo', 'priceList']),
  data: z.object({
    businessName: z.string().optional(),
    colors: z.array(z.string()).optional(),
    businessType: z.string().optional(),
    vibe: z.string().optional(),
    services: z.array(z.object({
      name: z.string(),
      price: z.number(),
      duration: z.number().optional(),
      category: z.string().optional(),
    })).optional(),
  }),
  confidence: z.number().min(0).max(100),
  warnings: z.array(z.object({
    type: z.string(),
    message: z.string(),
  })),
  processingTimeMs: z.number(),
});

/**
 * Recommend Templates Response
 * Response schema for template recommendations
 */
export const RecommendTemplatesResponseSchema = z.object({
  recommendations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    archetypeId: z.string(),
    archetypeName: z.string(),
    archetypeIcon: z.string(),
    targetVertical: z.string(),
    score: z.number(),
    matchPercentage: z.number(),
  })),
  criteria: z.object({
    businessType: z.string().optional(),
    primaryGoal: z.enum(['booking', 'portfolio', 'sales', 'information']).optional(),
    hasLocation: z.boolean().optional(),
    discoveryMethod: z.enum(['google', 'social', 'referral', 'word-of-mouth']).optional(),
    priorityValue: z.enum(['professional', 'creative', 'fast', 'easy-booking']).optional(),
  }),
});

// =====================================================
// INTERNAL SCHEMAS
// =====================================================

/**
 * Design Spec Schema
 * Internal schema for design spec storage
 */
export const DesignSpecSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  templateId: z.string(),
  designSpec: z.object({
    componentTree: z.any(),
    themeConfig: z.any(),
    businessContext: z.any(),
  }),
  status: z.enum(['pending', 'processing', 'completed', 'error']),
  generatedCode: z.string().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Component Definition Schema
 * Schema for component definitions returned to agents
 */
export const ComponentDefinitionSchema = z.object({
  id: z.string(),
  componentType: z.enum(['atom', 'molecule', 'organism']),
  componentId: z.string(),
  name: z.string(),
  description: z.string(),
  defaultProps: z.record(z.any()),
  aiPurpose: z.string().optional(),
  compatibleZones: z.array(z.string()),
  category: z.string(),
});

/**
 * Template Schema
 * Schema for templates returned to agents
 */
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  archetypeId: z.string(),
  archetypeName: z.string(),
  archetypeIcon: z.string(),
  targetVertical: z.string(),
  businessTypes: z.array(z.string()),
  componentTree: z.any(),
  themeConfig: z.any(),
  isPremium: z.boolean(),
});

// =====================================================
// TYPE EXPORTS
// =====================================================

export type GenerateSiteRequest = z.infer<typeof GenerateSiteRequestSchema>;
export type GetSchemaRequest = z.infer<typeof GetSchemaRequestSchema>;
export type ExtractFromImageRequest = z.infer<typeof ExtractFromImageRequestSchema>;
export type ExtractFromBatchRequest = z.infer<typeof ExtractFromBatchRequestSchema>;
export type RecommendTemplatesRequest = z.infer<typeof RecommendTemplatesRequestSchema>;

export type GenerateSiteResponse = z.infer<typeof GenerateSiteResponseSchema>;
export type GetSchemaResponse = z.infer<typeof GetSchemaResponseSchema>;
export type ExtractFromImageResponse = z.infer<typeof ExtractFromImageResponseSchema>;
export type RecommendTemplatesResponse = z.infer<typeof RecommendTemplatesResponseSchema>;

export type DesignSpec = z.infer<typeof DesignSpecSchema>;
export type ComponentDefinition = z.infer<typeof ComponentDefinitionSchema>;
export type Template = z.infer<typeof TemplateSchema>;

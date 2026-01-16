/**
 * AI Builder Agent REST API Router
 * Express router for AI agent-driven site generation
 * REST endpoints for GLM Vision and Local Builder agents
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseManager } from '@codename/database';
import { GLMVisionService } from '../services/agent/glm-vision.service';
import { LocalBuilderService } from '../services/agent/local-builder.service';
import {
  GenerateSiteRequestSchema,
  GetSchemaRequestSchema,
  ExtractFromImageRequestSchema,
  ErrorResponseSchema,
  GenerateSiteResponseSchema,
  GetSchemaResponseSchema,
  ExtractFromImageResponseSchema,
} from '@codename/api';

const router = Router();
const db = new DatabaseManager();
const glmVisionService = new GLMVisionService();
const localBuilderService = new LocalBuilderService();

// =====================================================
// Middleware
// =====================================================

/**
 * Validate request body against a Zod schema
 */
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        message: result.error.errors[0]?.message || 'Invalid input',
        details: result.error.errors,
      });
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validate URL parameter against a Zod schema
 */
function validateParam(param: string, schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params[param]);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        message: `Invalid ${param}`,
        details: result.error.errors,
      });
    }
    next();
  };
}

/**
 * Async handler wrapper to catch errors
 */
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error handler for the router
 */
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[AgentAPI] Error:', error);

  if (error.code === '23505') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists',
      details: { constraint: error.constraint },
    });
  }

  if (error.code === '23503') {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Referenced resource does not exist',
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
  });
});

// =====================================================
// SITE GENERATION ENDPOINTS
// =====================================================

/**
 * POST /api/v1/agent/generate-site
 * Generate a complete site from business context and template
 *
 * This is the main entry point for AI agents to generate sites.
 * The GLM Vision agent extracts context, selects a template, and
 * designs the component tree. The Local Builder generates code.
 */
router.post(
  '/generate-site',
  validateBody(GenerateSiteRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, templateId, variables, businessContext } = req.body;

    // Step 1: Get template from database
    const templateResult = await db.query(
      `SELECT * FROM get_template_by_id($1)`,
      [templateId]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Template ${templateId} not found`,
      });
    }

    const template = templateResult.rows[0];

    // Step 2: Generate component tree by merging template with variables
    const componentTree = mergeTemplateWithVariables(
      template.component_tree,
      variables
    );

    // Step 3: Generate site design spec (JSON structure)
    const designSpec = {
      tenantId,
      templateId,
      componentTree,
      themeConfig: template.theme_config,
      businessContext: businessContext || {},
      generatedAt: new Date().toISOString(),
    };

    // Step 4: Store design spec in staging table (for local builder to pick up)
    const stagingResult = await db.query(
      `INSERT INTO agent_design_specs (tenant_id, template_id, design_spec, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [tenantId, templateId, JSON.stringify(designSpec)]
    );

    const designSpecId = stagingResult.rows[0].id;

    // Step 5: Trigger local builder (if enabled)
    const localBuilderEnabled = process.env.FEATURE_LOCAL_BUILDER_ENABLED === 'true';
    let codeGenerationResult = null;

    if (localBuilderEnabled) {
      // Trigger async code generation
      localBuilderService.triggerBuild(designSpecId, designSpec);
      codeGenerationResult = { status: 'triggered', designSpecId };
    }

    res.status(201).json({
      siteId: designSpecId,
      tenantId,
      templateId,
      componentTree,
      themeConfig: template.theme_config,
      status: localBuilderEnabled ? 'generating' : 'design_complete',
      codeGeneration: codeGenerationResult,
    });
  })
);

/**
 * GET /api/v1/agent/status/:designSpecId
 * Check the status of a site generation job
 */
router.get(
  '/status/:designSpecId',
  validateParam('designSpecId', z.string().uuid()),
  asyncHandler(async (req: Request, res: Response) => {
    const { designSpecId } = req.params;

    const result = await db.query(
      `SELECT * FROM agent_design_specs WHERE id = $1`,
      [designSpecId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Design spec not found',
      });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      tenantId: row.tenant_id,
      templateId: row.template_id,
      status: row.status,
      componentTree: row.component_tree,
      generatedCode: row.generated_code,
      error: row.error_message,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  })
);

// =====================================================
// SCHEMA INTROSPECTION ENDPOINTS
// =====================================================

/**
 * GET /api/v1/agent/schema
 * Get the complete schema for templates and components
 * Used by AI agents to understand available options
 */
router.get(
  '/schema',
  asyncHandler(async (req: Request, res: Response) => {
    // Get all templates
    const templatesResult = await db.query(
      `SELECT * FROM templates_with_archetypes ORDER BY archetype_name, sort_order`
    );

    // Get all component definitions
    const componentsResult = await db.query(
      `SELECT * FROM get_component_definitions()`
    );

    // Get all archetypes
    const archetypesResult = await db.query(
      `SELECT * FROM template_archetypes ORDER BY sort_order`
    );

    res.json({
      templates: templatesResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        archetypeId: row.archetype_id,
        archetypeName: row.archetype_name,
        archetypeIcon: row.archetype_icon,
        targetVertical: row.target_vertical,
        businessTypes: row.business_types,
        isPremium: row.is_premium,
      })),
      components: componentsResult.rows.map((row: any) => ({
        id: row.id,
        componentType: row.component_type,
        componentId: row.component_id,
        name: row.name,
        description: row.description,
        defaultProps: row.default_props,
        aiPurpose: row.ai_purpose,
        compatibleZones: row.compatible_zones,
        category: row.category,
      })),
      archetypes: archetypesResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        icon: row.icon,
      })),
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/v1/agent/schema/template/:templateId
 * Get detailed schema for a specific template
 */
router.get(
  '/schema/template/:templateId',
  validateParam('templateId', z.string()),
  asyncHandler(async (req: Request, res: Response) => {
    const { templateId } = req.params;

    const result = await db.query(
      `SELECT * FROM get_template_by_id($1)`,
      [templateId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Template ${templateId} not found`,
      });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      archetypeId: row.archetype_id,
      targetVertical: row.target_vertical,
      businessTypes: row.business_types,
      componentTree: row.component_tree,
      themeConfig: row.theme_config,
    });
  })
);

// =====================================================
// VISION EXTRACTION ENDPOINTS
// =====================================================

/**
 * POST /api/v1/agent/extract
 * Extract business information from uploaded images
 * Uses GLM Vision to extract structured data from logos, photos, price lists
 */
router.post(
  '/extract',
  validateBody(ExtractFromImageRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { imageUrl, extractionType } = req.body;

    let result;

    switch (extractionType) {
      case 'logo':
        result = await glmVisionService.extractFromLogo(imageUrl);
        break;
      case 'photo':
        result = await glmVisionService.extractFromPhotos(imageUrl);
        break;
      case 'priceList':
        result = await glmVisionService.extractFromPriceList(imageUrl);
        break;
      default:
        result = await glmVisionService.extractFromPriceList(imageUrl);
    }

    res.json({
      extractionId: result.id,
      type: extractionType,
      data: result.data,
      confidence: result.confidence,
      warnings: result.warnings,
      processingTimeMs: result.processingTimeMs,
    });
  })
);

/**
 * POST /api/v1/agent/extract-batch
 * Extract from multiple images in a single request
 */
router.post(
  '/extract-batch',
  validateBody(z.object({
    images: z.array(z.object({
      url: z.string().url(),
      type: z.enum(['logo', 'photo', 'priceList']),
    })),
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const { images } = req.body;
    const results = await Promise.all(
      images.map(async (image: any) => {
        let result;
        switch (image.type) {
          case 'logo':
            result = await glmVisionService.extractFromLogo(image.url);
            break;
          case 'photo':
            result = await glmVisionService.extractFromPhotos(image.url);
            break;
          case 'priceList':
            result = await glmVisionService.extractFromPriceList(image.url);
            break;
        }
        return {
          type: image.type,
          url: image.url,
          data: result?.data,
          confidence: result?.confidence,
        };
      })
    );

    // Merge all extractions into a single business context
    const mergedContext = mergeExtractions(results);

    res.json({
      extractionId: crypto.randomUUID(),
      individualResults: results,
      mergedContext,
      processingTimeMs: Date.now(),
    });
  })
);

// =====================================================
// TEMPLATE RECOMMENDATION ENDPOINTS
// =====================================================

/**
 * POST /api/v1/agent/recommend-templates
 * Get template recommendations based on business context
 */
router.post(
  '/recommend-templates',
  validateBody(z.object({
    businessType: z.string().optional(),
    primaryGoal: z.enum(['booking', 'portfolio', 'sales', 'information']).optional(),
    hasLocation: z.boolean().optional(),
    discoveryMethod: z.enum(['google', 'social', 'referral', 'word-of-mouth']).optional(),
    priorityValue: z.enum(['professional', 'creative', 'fast', 'easy-booking']).optional(),
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const { businessType, primaryGoal, hasLocation, discoveryMethod, priorityValue } = req.body;

    // Score templates based on inputs
    const templatesResult = await db.query(
      `SELECT * FROM templates_with_archetypes ORDER BY archetype_name, sort_order`
    );

    const scoredTemplates = templatesResult.rows.map((template: any) => {
      let score = 0;

      // Archetype scoring
      if (primaryGoal === 'booking' && template.archetype_id === 'booking-pro') score += 40;
      if (primaryGoal === 'portfolio' && template.archetype_id === 'creator-hub') score += 40;
      if (primaryGoal === 'sales' && template.archetype_id === 'marketplace') score += 40;
      if (primaryGoal === 'information' && template.archetype_id === 'trust-builder') score += 40;

      // Business type matching
      if (businessType && template.business_types) {
        const normalizedBusinessType = businessType.toLowerCase();
        if (template.business_types.some((bt: string) => bt.toLowerCase().includes(normalizedBusinessType))) {
          score += 30;
        }
      }

      // Location-based scoring
      if (hasLocation && ['local-finder', 'multi-location'].includes(template.archetype_id)) {
        score += 20;
      }

      // Priority value scoring
      if (priorityValue === 'professional' && template.archetype_id === 'trust-builder') score += 10;
      if (priorityValue === 'creative' && template.archetype_id === 'creator-hub') score += 10;

      return {
        ...template,
        score,
      };
    });

    // Sort by score and return top 3
    const recommendations = scoredTemplates
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3)
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        archetypeId: t.archetype_id,
        archetypeName: t.archetype_name,
        archetypeIcon: t.archetype_icon,
        targetVertical: t.target_vertical,
        score: t.score,
        matchPercentage: Math.min(100, t.score),
      }));

    res.json({
      recommendations,
      criteria: { businessType, primaryGoal, hasLocation, discoveryMethod, priorityValue },
    });
  })
);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Merge template component tree with user variables
 */
function mergeTemplateWithVariables(componentTree: any, variables: Record<string, any>): any {
  if (!componentTree) return {};

  const merged = JSON.parse(JSON.stringify(componentTree)); // Deep clone

  function mergeComponents(components: any[]): any[] {
    if (!components) return [];
    return components.map((component: any) => {
      const mergedComponent = { ...component };

      // Merge props with variables
      if (mergedComponent.props && variables) {
        for (const [key, value] of Object.entries(variables)) {
          if (typeof value === 'string' && value.includes(`{{${key}}}`)) {
            mergedComponent.props[key] = variables[key] || value;
          } else if (variables[key] !== undefined) {
            mergedComponent.props[key] = variables[key];
          }
        }
      }

      // Merge children recursively
      if (mergedComponent.children) {
        mergedComponent.children = mergeComponents(mergedComponent.children);
      }

      return mergedComponent;
    });
  }

  if (merged.zones) {
    merged.zones = merged.zones.map((zone: any) => ({
      ...zone,
      components: mergeComponents(zone.components || []),
    }));
  }

  return merged;
}

/**
 * Merge multiple extractions into a single business context
 */
function mergeExtractions(extractions: any[]): Record<string, any> {
  const merged: Record<string, any> = {
    businessName: null,
    colors: [],
    businessType: null,
    services: [],
    vibe: null,
    confidence: 0,
  };

  for (const extraction of extractions) {
    if (extraction.data.businessName && !merged.businessName) {
      merged.businessName = extraction.data.businessName;
    }
    if (extraction.data.colors) {
      merged.colors.push(...extraction.data.colors);
    }
    if (extraction.data.businessType && !merged.businessType) {
      merged.businessType = extraction.data.businessType;
    }
    if (extraction.data.services) {
      merged.services.push(...extraction.data.services);
    }
    if (extraction.data.vibe && !merged.vibe) {
      merged.vibe = extraction.data.vibe;
    }
    merged.confidence = Math.max(merged.confidence, extraction.confidence || 0);
  }

  // Deduplicate colors
  merged.colors = [...new Set(merged.colors)];

  return merged;
}

export default router;

/**
 * Component REST API Router
 * Express router for component configuration system
 * REST endpoints for AI agents to manage sites, zones, components, and integrations
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseManager } from '@codename/database';
import { IntegrationService } from '../services/integration.service';
import {
  CreateSiteSchema,
  UpdateSiteSchema,
  CreateZoneSchema,
  UpdateZoneSchema,
  CreateComponentSchema,
  UpdateComponentSchema,
  CreateIntegrationSchema,
  UpdateIntegrationSchema,
  IntegrationInputSchema,
  ErrorResponseSchema,
  SiteResponseSchema,
  ZoneResponseSchema,
  ComponentResponseSchema,
  IntegrationResponseSchema,
  ComponentPresetResponseSchema,
  IntegrationInputResponseSchema,
} from '@codename/api';

const router = Router();
const db = new DatabaseManager();
const integrationService = new IntegrationService(db);

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
  console.error('[ComponentAPI] Error:', error);

  if (error.code === '23505') {
    // Unique violation
    return res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists',
      details: { constraint: error.constraint },
    });
  }

  if (error.code === '23503') {
    // Foreign key violation
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
// SITES ENDPOINTS
// =====================================================

/**
 * GET /api/v1/tenants/:tenantId/sites
 * List all sites for a tenant
 */
router.get(
  '/tenants/:tenantId/sites',
  validateParam('tenantId', z.string().regex(/^tenant_[a-z0-9_]+$/)),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const offset = (page - 1) * pageSize;

    const countResult = await db.query(
      `SELECT COUNT(*) FROM sites WHERE tenant_id = $1`,
      [tenantId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT * FROM sites WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, pageSize, offset]
    );

    const sites = result.rows.map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      slug: row.slug,
      templateId: row.template_id,
      navbarStyle: row.navbar_style,
      isPublished: row.is_published,
      publishedAt: row.published_at?.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    res.json({ sites, total, page, pageSize });
  })
);

/**
 * POST /api/v1/tenants/:tenantId/sites
 * Create a new site for a tenant
 */
router.post(
  '/tenants/:tenantId/sites',
  validateParam('tenantId', z.string().regex(/^tenant_[a-z0-9_]+$/)),
  validateBody(CreateSiteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = req.params;
    const { name, slug, templateId, navbarStyle } = req.body;

    // Generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await db.query(
      `INSERT INTO sites (tenant_id, name, slug, template_id, navbar_style)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenantId, name, finalSlug, templateId, navbarStyle]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      slug: row.slug,
      templateId: row.template_id,
      navbarStyle: row.navbar_style,
      isPublished: row.is_published,
      publishedAt: row.published_at?.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  })
);

/**
 * GET /api/v1/sites/:siteId
 * Get a single site
 */
router.get(
  '/sites/:siteId',
  validateParam('siteId', z.string().uuid()),
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const result = await db.query(
      `SELECT * FROM sites WHERE id = $1`,
      [siteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Site not found',
      });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      slug: row.slug,
      templateId: row.template_id,
      navbarStyle: row.navbar_style,
      isPublished: row.is_published,
      publishedAt: row.published_at?.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  })
);

/**
 * PATCH /api/v1/sites/:siteId
 * Update a site
 */
router.patch(
  '/sites/:siteId',
  validateParam('siteId', z.string().uuid()),
  validateBody(UpdateSiteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(req.body.name);
    }
    if (req.body.slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`);
      values.push(req.body.slug);
    }
    if (req.body.templateId !== undefined) {
      updates.push(`template_id = $${paramIndex++}`);
      values.push(req.body.templateId);
    }
    if (req.body.navbarStyle !== undefined) {
      updates.push(`navbar_style = $${paramIndex++}`);
      values.push(req.body.navbarStyle);
    }
    if (req.body.isPublished !== undefined) {
      updates.push(`is_published = $${paramIndex++}`);
      values.push(req.body.isPublished);
      if (req.body.isPublished && updates.length === 5) {
        updates.push(`published_at = NOW()`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update',
      });
    }

    values.push(siteId);
    const result = await db.query(
      `UPDATE sites SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Site not found',
      });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      slug: row.slug,
      templateId: row.template_id,
      navbarStyle: row.navbar_style,
      isPublished: row.is_published,
      publishedAt: row.published_at?.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  })
);

/**
 * DELETE /api/v1/sites/:siteId
 * Delete a site (cascades to zones and components)
 */
router.delete(
  '/sites/:siteId',
  validateParam('siteId', z.string().uuid()),
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const result = await db.query(
      `DELETE FROM sites WHERE id = $1 RETURNING id`,
      [siteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Site not found',
      });
    }

    res.status(204).send();
  })
);

// =====================================================
// ZONES ENDPOINTS
// =====================================================

/**
 * GET /api/v1/sites/:siteId/zones
 * List all zones for a site
 */
router.get(
  '/sites/:siteId/zones',
  validateParam('siteId', z.string().uuid()),
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const result = await db.query(
      `SELECT * FROM zones WHERE site_id = $1 ORDER BY position ASC`,
      [siteId]
    );

    const zones = result.rows.map((row: any) => ({
      id: row.id,
      siteId: row.site_id,
      zoneType: row.zone_type,
      position: row.position,
      config: row.config,
      isVisible: row.is_visible,
      createdAt: row.created_at.toISOString(),
    }));

    res.json({ zones, total: zones.length });
  })
);

/**
 * POST /api/v1/sites/:siteId/zones
 * Create a new zone
 */
router.post(
  '/sites/:siteId/zones',
  validateParam('siteId', z.string().uuid()),
  validateBody(CreateZoneSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { zoneType, position, config, isVisible } = req.body;

    const result = await db.query(
      `INSERT INTO zones (site_id, zone_type, position, config, is_visible)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [siteId, zoneType, position, config, isVisible]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      siteId: row.site_id,
      zoneType: row.zone_type,
      position: row.position,
      config: row.config,
      isVisible: row.is_visible,
      createdAt: row.created_at.toISOString(),
    });
  })
);

/**
 * PATCH /api/v1/zones/:zoneId
 * Update a zone
 */
router.patch(
  '/zones/:zoneId',
  validateParam('zoneId', z.string().uuid()),
  validateBody(UpdateZoneSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { zoneId } = req.params;
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.body.position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      values.push(req.body.position);
    }
    if (req.body.config !== undefined) {
      updates.push(`config = $${paramIndex++}`);
      values.push(req.body.config);
    }
    if (req.body.isVisible !== undefined) {
      updates.push(`is_visible = $${paramIndex++}`);
      values.push(req.body.isVisible);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update',
      });
    }

    values.push(zoneId);
    const result = await db.query(
      `UPDATE zones SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Zone not found',
      });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      siteId: row.site_id,
      zoneType: row.zone_type,
      position: row.position,
      config: row.config,
      isVisible: row.is_visible,
      createdAt: row.created_at.toISOString(),
    });
  })
);

/**
 * DELETE /api/v1/zones/:zoneId
 * Delete a zone (cascades to components)
 */
router.delete(
  '/zones/:zoneId',
  validateParam('zoneId', z.string().uuid()),
  asyncHandler(async (req: Request, res: Response) => {
    const { zoneId } = req.params;

    const result = await db.query(
      `DELETE FROM zones WHERE id = $1 RETURNING id`,
      [zoneId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Zone not found',
      });
    }

    res.status(204).send();
  })
);

// =====================================================
// COMPONENTS ENDPOINTS
// =====================================================

/**
 * GET /api/v1/zones/:zoneId/components
 * List all components in a zone (with nested children)
 */
router.get(
  '/zones/:zoneId/components',
  validateParam('zoneId', z.string().uuid()),
  asyncHandler(async (req: Request, res: Response) => {
    const { zoneId } = req.params;

    const result = await db.query(
      `SELECT * FROM components WHERE zone_id = $1 AND parent_id IS NULL ORDER BY position ASC`,
      [zoneId]
    );

    // For each component, fetch its children recursively
    const components = await Promise.all(
      result.rows.map(async (row: any) => {
        const children = await fetchComponentChildren(db, row.id);
        return {
          id: row.id,
          zoneId: row.zone_id,
          componentType: row.component_type,
          componentId: row.component_id,
          parentId: row.parent_id,
          position: row.position,
          props: row.props,
          integrationRefs: row.integration_refs,
          styleVariant: row.style_variant,
          tokensOverride: row.tokens_override,
          animationConfig: row.animation_config,
          isVisible: row.is_visible,
          isDraft: row.is_draft,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          children,
        };
      })
    );

    res.json({ components, total: components.length });
  })
);

/**
 * Helper function to fetch component children recursively
 */
async function fetchComponentChildren(db: DatabaseManager, parentId: string): Promise<any[]> {
  const result = await db.query(
    `SELECT * FROM components WHERE parent_id = $1 ORDER BY position ASC`,
    [parentId]
  );

  if (result.rows.length === 0) {
    return [];
  }

  return Promise.all(
    result.rows.map(async (row: any) => {
      const children = await fetchComponentChildren(db, row.id);
      return {
        id: row.id,
        zoneId: row.zone_id,
        componentType: row.component_type,
        componentId: row.component_id,
        parentId: row.parent_id,
        position: row.position,
        props: row.props,
        integrationRefs: row.integration_refs,
        styleVariant: row.style_variant,
        tokensOverride: row.tokens_override,
        animationConfig: row.animation_config,
        isVisible: row.is_visible,
        isDraft: row.is_draft,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        children,
      };
    })
  );
}

/**
 * GET /api/v1/components/:componentId/children
 * Get direct children of a component
 */
router.get(
  '/components/:componentId/children',
  validateParam('componentId', z.string().uuid()),
  asyncHandler(async (req: Request, res: Response) => {
    const { componentId } = req.params;

    const result = await db.query(
      `SELECT * FROM components WHERE parent_id = $1 ORDER BY position ASC`,
      [componentId]
    );

    const components = result.rows.map((row: any) => ({
      id: row.id,
      zoneId: row.zone_id,
      componentType: row.component_type,
      componentId: row.component_id,
      parentId: row.parent_id,
      position: row.position,
      props: row.props,
      integrationRefs: row.integration_refs,
      styleVariant: row.style_variant,
      tokensOverride: row.tokens_override,
      animationConfig: row.animation_config,
      isVisible: row.is_visible,
      isDraft: row.is_draft,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    res.json({ components, total: components.length });
  })
);

/**
 * POST /api/v1/zones/:zoneId/components
 * Create a new component in a zone
 */
router.post(
  '/zones/:zoneId/components',
  validateParam('zoneId', z.string().uuid()),
  validateBody(CreateComponentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { zoneId } = req.params;
    const {
      componentType,
      componentId,
      parentId,
      position,
      props,
      integrationRefs,
      styleVariant,
      tokensOverride,
      animationConfig,
      isVisible,
      isDraft,
    } = req.body;

    const result = await db.query(
      `INSERT INTO components (
        zone_id, component_type, component_id, parent_id, position,
        props, integration_refs, style_variant, tokens_override,
        animation_config, is_visible, is_draft
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        zoneId,
        componentType,
        componentId,
        parentId || null,
        position,
        JSON.stringify(props || {}),
        JSON.stringify(integrationRefs || {}),
        styleVariant,
        JSON.stringify(tokensOverride || {}),
        JSON.stringify(animationConfig || {}),
        isVisible,
        isDraft,
      ]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      zoneId: row.zone_id,
      componentType: row.component_type,
      componentId: row.component_id,
      parentId: row.parent_id,
      position: row.position,
      props: row.props,
      integrationRefs: row.integration_refs,
      styleVariant: row.style_variant,
      tokensOverride: row.tokens_override,
      animationConfig: row.animation_config,
      isVisible: row.is_visible,
      isDraft: row.is_draft,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  })
);

/**
 * POST /api/v1/components/:componentId/children
 * Add a child component to a parent component
 */
router.post(
  '/components/:componentId/children',
  validateParam('componentId', z.string().uuid()),
  validateBody(CreateComponentSchema.partial({ zoneId: true })),
  asyncHandler(async (req: Request, res: Response) => {
    const { componentId } = req.params;

    // Get the parent component's zone_id
    const parentResult = await db.query(
      `SELECT zone_id FROM components WHERE id = $1`,
      [componentId]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Parent component not found',
      });
    }

    const zoneId = parentResult.rows[0].zone_id;
    const {
      componentType,
      componentId: childComponentId,
      position,
      props,
      integrationRefs,
      styleVariant,
      tokensOverride,
      animationConfig,
      isVisible,
      isDraft,
    } = req.body;

    const result = await db.query(
      `INSERT INTO components (
        zone_id, component_type, component_id, parent_id, position,
        props, integration_refs, style_variant, tokens_override,
        animation_config, is_visible, is_draft
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        zoneId,
        componentType,
        childComponentId,
        componentId, // parent_id
        position,
        JSON.stringify(props || {}),
        JSON.stringify(integrationRefs || {}),
        styleVariant,
        JSON.stringify(tokensOverride || {}),
        JSON.stringify(animationConfig || {}),
        isVisible,
        isDraft,
      ]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      zoneId: row.zone_id,
      componentType: row.component_type,
      componentId: row.component_id,
      parentId: row.parent_id,
      position: row.position,
      props: row.props,
      integrationRefs: row.integration_refs,
      styleVariant: row.style_variant,
      tokensOverride: row.tokens_override,
      animationConfig: row.animation_config,
      isVisible: row.is_visible,
      isDraft: row.is_draft,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  })
);

/**
 * PATCH /api/v1/components/:componentId
 * Update a component
 */
router.patch(
  '/components/:componentId',
  validateParam('componentId', z.string().uuid()),
  validateBody(UpdateComponentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { componentId } = req.params;
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.body.position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      values.push(req.body.position);
    }
    if (req.body.props !== undefined) {
      updates.push(`props = $${paramIndex++}`);
      values.push(JSON.stringify(req.body.props));
    }
    if (req.body.integrationRefs !== undefined) {
      updates.push(`integration_refs = $${paramIndex++}`);
      values.push(JSON.stringify(req.body.integrationRefs));
    }
    if (req.body.styleVariant !== undefined) {
      updates.push(`style_variant = $${paramIndex++}`);
      values.push(req.body.styleVariant);
    }
    if (req.body.tokensOverride !== undefined) {
      updates.push(`tokens_override = $${paramIndex++}`);
      values.push(JSON.stringify(req.body.tokensOverride));
    }
    if (req.body.animationConfig !== undefined) {
      updates.push(`animation_config = $${paramIndex++}`);
      values.push(JSON.stringify(req.body.animationConfig));
    }
    if (req.body.isVisible !== undefined) {
      updates.push(`is_visible = $${paramIndex++}`);
      values.push(req.body.isVisible);
    }
    if (req.body.isDraft !== undefined) {
      updates.push(`is_draft = $${paramIndex++}`);
      values.push(req.body.isDraft);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update',
      });
    }

    values.push(componentId);
    const result = await db.query(
      `UPDATE components SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Component not found',
      });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      zoneId: row.zone_id,
      componentType: row.component_type,
      componentId: row.component_id,
      parentId: row.parent_id,
      position: row.position,
      props: row.props,
      integrationRefs: row.integration_refs,
      styleVariant: row.style_variant,
      tokensOverride: row.tokens_override,
      animationConfig: row.animation_config,
      isVisible: row.is_visible,
      isDraft: row.is_draft,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  })
);

/**
 * DELETE /api/v1/components/:componentId
 * Delete a component (cascades to children)
 */
router.delete(
  '/components/:componentId',
  validateParam('componentId', z.string().uuid()),
  asyncHandler(async (req: Request, res: Response) => {
    const { componentId } = req.params;

    const result = await db.query(
      `DELETE FROM components WHERE id = $1 RETURNING id`,
      [componentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Component not found',
      });
    }

    res.status(204).send();
  })
);

// =====================================================
// INTEGRATIONS ENDPOINTS
// =====================================================

/**
 * GET /api/v1/sites/:siteId/integrations
 * List all integrations for a site
 */
router.get(
  '/sites/:siteId/integrations',
  validateParam('siteId', z.string().uuid()),
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const result = await db.query(
      `SELECT * FROM site_integrations WHERE site_id = $1 ORDER BY created_at ASC`,
      [siteId]
    );

    const integrations = result.rows.map((row: any) => ({
      id: row.id,
      siteId: row.site_id,
      integrationType: row.integration_type,
      credentials: row.credentials,
      cachedContent: row.cached_content,
      autoSync: row.auto_sync,
      lastSyncAt: row.last_sync_at?.toISOString(),
      syncStatus: row.sync_status,
      lastError: row.last_error,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    res.json({ integrations, total: integrations.length });
  })
);

/**
 * POST /api/v1/sites/:siteId/integrations
 * Create a new integration
 */
router.post(
  '/sites/:siteId/integrations',
  validateParam('siteId', z.string().uuid()),
  validateBody(CreateIntegrationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { integrationType, credentials, autoSync } = req.body;

    const result = await db.query(
      `INSERT INTO site_integrations (site_id, integration_type, credentials, auto_sync, sync_status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [siteId, integrationType, JSON.stringify(credentials), autoSync]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      siteId: row.site_id,
      integrationType: row.integration_type,
      credentials: row.credentials,
      cachedContent: row.cached_content,
      autoSync: row.auto_sync,
      lastSyncAt: row.last_sync_at?.toISOString(),
      syncStatus: row.sync_status,
      lastError: row.last_error,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  })
);

/**
 * POST /api/v1/sites/:siteId/integrations/process
 * Process integration input (@handle, URL) and optionally create component
 */
router.post(
  '/sites/:siteId/integrations/process',
  validateParam('siteId', z.string().uuid()),
  validateBody(IntegrationInputSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { input, autoCreateComponent, targetZone } = req.body;

    // Get tenant_id from site
    const siteResult = await db.query(
      `SELECT tenant_id FROM sites WHERE id = $1`,
      [siteId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Site not found',
      });
    }

    const tenantId = siteResult.rows[0].tenant_id;

    // Process the integration input
    const { parsed, integrationId, content } = await integrationService.processIntegrationInput(
      siteId,
      input,
      tenantId
    );

    // Optionally create a component
    let component = null;
    if (autoCreateComponent) {
      const componentId = await integrationService.createIntegrationComponent(
        siteId,
        integrationId,
        parsed,
        targetZone
      );

      if (componentId) {
        const componentResult = await db.query(
          `SELECT * FROM components WHERE id = $1`,
          [componentId]
        );

        if (componentResult.rows.length > 0) {
          const row = componentResult.rows[0];
          component = {
            id: row.id,
            zoneId: row.zone_id,
            componentType: row.component_type,
            componentId: row.component_id,
            parentId: row.parent_id,
            position: row.position,
            props: row.props,
            integrationRefs: row.integration_refs,
            styleVariant: row.style_variant,
            tokensOverride: row.tokens_override,
            animationConfig: row.animation_config,
            isVisible: row.is_visible,
            isDraft: row.is_draft,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
          };
        }
      }
    }

    // Get the integration record
    const integrationResult = await db.query(
      `SELECT * FROM site_integrations WHERE id = $1`,
      [integrationId]
    );

    const integration = {
      id: integrationResult.rows[0].id,
      siteId: integrationResult.rows[0].site_id,
      integrationType: integrationResult.rows[0].integration_type,
      credentials: integrationResult.rows[0].credentials,
      cachedContent: integrationResult.rows[0].cached_content,
      autoSync: integrationResult.rows[0].auto_sync,
      lastSyncAt: integrationResult.rows[0].last_sync_at?.toISOString(),
      syncStatus: integrationResult.rows[0].sync_status,
      lastError: integrationResult.rows[0].last_error,
      isActive: integrationResult.rows[0].is_active,
      createdAt: integrationResult.rows[0].created_at.toISOString(),
      updatedAt: integrationResult.rows[0].updated_at.toISOString(),
    };

    res.status(201).json({
      integration,
      component,
      parsed,
    });
  })
);

/**
 * PATCH /api/v1/sites/:siteId/integrations/:integrationType
 * Update an integration by type
 */
router.patch(
  '/sites/:siteId/integrations/:integrationType',
  validateParam('siteId', z.string().uuid()),
  validateParam('integrationType', z.string()),
  validateBody(UpdateIntegrationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId, integrationType } = req.params;
    const { credentials, autoSync, isActive } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (credentials !== undefined) {
      updates.push(`credentials = $${paramIndex++}`);
      values.push(JSON.stringify(credentials));
    }
    if (autoSync !== undefined) {
      updates.push(`auto_sync = $${paramIndex++}`);
      values.push(autoSync);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update',
      });
    }

    values.push(siteId, integrationType);
    const result = await db.query(
      `UPDATE site_integrations SET ${updates.join(', ')}, updated_at = NOW()
       WHERE site_id = $${paramIndex++} AND integration_type = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Integration not found',
      });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      siteId: row.site_id,
      integrationType: row.integration_type,
      credentials: row.credentials,
      cachedContent: row.cached_content,
      autoSync: row.auto_sync,
      lastSyncAt: row.last_sync_at?.toISOString(),
      syncStatus: row.sync_status,
      lastError: row.last_error,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    });
  })
);

/**
 * DELETE /api/v1/sites/:siteId/integrations/:integrationType
 * Delete an integration by type
 */
router.delete(
  '/sites/:siteId/integrations/:integrationType',
  validateParam('siteId', z.string().uuid()),
  validateParam('integrationType', z.string()),
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId, integrationType } = req.params;

    const result = await db.query(
      `DELETE FROM site_integrations WHERE site_id = $1 AND integration_type = $2 RETURNING id`,
      [siteId, integrationType]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Integration not found',
      });
    }

    res.status(204).send();
  })
);

// =====================================================
// COMPONENT PRESETS ENDPOINTS
// =====================================================

/**
 * GET /api/v1/presets
 * List all component presets
 */
router.get(
  '/presets',
  asyncHandler(async (req: Request, res: Response) => {
    const { componentType, componentId, aiPurpose } = req.query;

    let query = `SELECT * FROM component_presets WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (componentType) {
      query += ` AND component_type = $${paramIndex++}`;
      params.push(componentType);
    }
    if (componentId) {
      query += ` AND component_id = $${paramIndex++}`;
      params.push(componentId);
    }
    if (aiPurpose) {
      query += ` AND ai_purpose = $${paramIndex++}`;
      params.push(aiPurpose);
    }

    query += ` ORDER BY preset_name ASC`;

    const result = await db.query(query, params);

    const presets = result.rows.map((row: any) => ({
      id: row.id,
      componentType: row.component_type,
      componentId: row.component_id,
      presetName: row.preset_name,
      presetSlug: row.preset_slug,
      defaultProps: row.default_props,
      defaultStyle: row.default_style,
      defaultTokens: row.default_tokens,
      defaultAnimation: row.default_animation,
      description: row.description,
      aiPurpose: row.ai_purpose,
      compatibleZones: row.compatible_zones,
      source: row.source,
      createdAt: row.created_at.toISOString(),
    }));

    res.json({ presets, total: presets.length });
  })
);

/**
 * GET /api/v1/presets/:presetSlug
 * Get a single preset by slug
 */
router.get(
  '/presets/:presetSlug',
  validateParam('presetSlug', z.string()),
  asyncHandler(async (req: Request, res: Response) => {
    const { presetSlug } = req.params;

    const result = await db.query(
      `SELECT * FROM component_presets WHERE preset_slug = $1`,
      [presetSlug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Preset not found',
      });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      componentType: row.component_type,
      componentId: row.component_id,
      presetName: row.preset_name,
      presetSlug: row.preset_slug,
      defaultProps: row.default_props,
      defaultStyle: row.default_style,
      defaultTokens: row.default_tokens,
      defaultAnimation: row.default_animation,
      description: row.description,
      aiPurpose: row.ai_purpose,
      compatibleZones: row.compatible_zones,
      source: row.source,
      createdAt: row.created_at.toISOString(),
    });
  })
);

export default router;

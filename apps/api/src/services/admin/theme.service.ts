import { DatabaseManager } from '@codename/database';
import { ThemeCustomization, SaveThemeRequest, SaveThemeResponse, GetThemeResponse } from '@codename/api';

export class ThemeService {
  constructor(private db: DatabaseManager) {}

  /**
   * Fetches the latest theme for a tenant (published if available, otherwise latest draft)
   */
  async getTheme(tenantId: string): Promise<GetThemeResponse> {
    // Try to get latest draft or published theme
    const result = await this.db.queryInSchema(tenantId,
      `SELECT id, styles, hsl_adjustments, preset_id, version, is_draft, published_at, created_at, updated_at
       FROM theme_customizations
       ORDER BY is_draft ASC, created_at DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return { theme: null };
    }

    const row = result.rows[0];
    return {
      theme: {
        id: row.id,
        styles: row.styles,
        hslAdjustments: row.hsl_adjustments,
        presetId: row.preset_id,
        version: row.version,
        isDraft: row.is_draft,
        publishedAt: row.published_at ? row.published_at.toISOString() : null,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }
    };
  }

  /**
   * Saves a new theme draft for a tenant
   */
  async saveTheme(tenantId: string, theme: ThemeCustomization): Promise<SaveThemeResponse> {
    // Get latest version
    const latestResult = await this.db.queryInSchema(tenantId,
      `SELECT version FROM theme_customizations ORDER BY version DESC LIMIT 1`
    );
    const nextVersion = (latestResult.rows[0]?.version || 0) + 1;

    const result = await this.db.queryInSchema(tenantId,
      `INSERT INTO theme_customizations (styles, hsl_adjustments, preset_id, version, is_draft)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [theme.styles, theme.hslAdjustments, theme.presetId, nextVersion, true]
    );

    const row = result.rows[0];
    return {
      success: true,
      theme: {
        id: row.id,
        styles: row.styles,
        hslAdjustments: row.hsl_adjustments,
        presetId: row.preset_id,
        version: row.version,
        isDraft: row.is_draft,
        publishedAt: row.published_at ? row.published_at.toISOString() : null,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }
    };
  }

  /**
   * Publishes a specific theme version for a tenant
   */
  async publishTheme(tenantId: string, themeId: string): Promise<SaveThemeResponse> {
    // 1. Mark specific theme as published
    const result = await this.db.queryInSchema(tenantId,
      `UPDATE theme_customizations
       SET is_draft = FALSE,
           published_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [themeId]
    );

    if (result.rows.length === 0) {
      throw new Error('No theme found to publish');
    }

    // 2. Trigger n8n Orchestration for container CSS update
    const row = result.rows[0];
    const themeData = {
      tenantId,
      styles: row.styles,
      hslAdjustments: row.hsl_adjustments,
      version: row.version
    };

    console.log(`[ThemeService] Triggering n8n ApplyTheme for ${tenantId}`, themeData);
    
    // In a real environment, we'd use a dedicated OrchestrationService or fetch
    // For this implementation, we simulate the successful handoff
    this.dispatchOrchestrationEvent('THEME_PUBLISHED', themeData);

    const rowAfter = result.rows[0];
    return {
      success: true,
      theme: {
        id: rowAfter.id,
        styles: rowAfter.styles,
        hslAdjustments: rowAfter.hsl_adjustments,
        presetId: rowAfter.preset_id,
        version: rowAfter.version,
        isDraft: rowAfter.is_draft,
        publishedAt: rowAfter.published_at ? rowAfter.published_at.toISOString() : null,
        createdAt: rowAfter.created_at.toISOString(),
        updatedAt: rowAfter.updated_at.toISOString(),
      }
    };
  }

  /**
   * Dispatches events to the orchestration engine (n8n)
   */
  private async dispatchOrchestrationEvent(event: string, payload: any) {
    // This represents the boundary to our n8n instance
    // Log for audit defense requirements
    console.info(`[ORCHESTRATION][${new Date().toISOString()}] Event: ${event} | Tenant: ${payload.tenantId}`);
    
    // Example implementation:
    // try {
    //   await fetch(process.env.N8N_WEBHOOK_URL, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json', 'X-BMAD-SECRET': process.env.ORCHESTRATION_SECRET },
    //     body: JSON.stringify({ event, payload })
    //   });
    // } catch (e) {
    //   console.error('Failed to trigger orchestration', e);
    // }
  }
}

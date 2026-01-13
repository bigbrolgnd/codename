import { DatabaseManager } from '@codename/database';
import { ThemeCustomization, SaveThemeRequest, SaveThemeResponse, GetThemeResponse } from '@codename/api';
import { generateThemeCSS } from './theme-to-css.util';

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
   * Triggers n8n orchestration to apply theme CSS to tenant containers
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

    // 2. Validate theme data before orchestration
    const row = result.rows[0];
    if (!row.styles || typeof row.styles !== 'object') {
      throw new Error('Invalid theme data: styles must be an object');
    }
    if (!row.hsl_adjustments || typeof row.hsl_adjustments !== 'object') {
      throw new Error('Invalid theme data: hsl_adjustments must be an object');
    }

    // 3. Generate CSS string for n8n workflow
    const generatedCSS = generateThemeCSS(row.styles, row.hsl_adjustments);

    // 4. Trigger n8n Orchestration for container CSS update
    const themeData = {
      tenantId,
      styles: row.styles,
      hslAdjustments: row.hsl_adjustments,
      version: row.version,
      css: generatedCSS, // Include generated CSS in payload
      generatedAt: new Date().toISOString()
    };

    console.log(`[ThemeService] Triggering n8n ApplyTheme for ${tenantId}`, {
      tenantId,
      version: row.version,
      cssLength: generatedCSS.length
    });

    // 5. Dispatch orchestration event to n8n (await to prevent race condition)
    await this.dispatchOrchestrationEvent('THEME_PUBLISHED', themeData);

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
   * Sends webhook with retry logic and comprehensive error handling
   */
  private async dispatchOrchestrationEvent(event: string, payload: any): Promise<void> {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.ORCHESTRATION_SECRET;

    // Log for audit defense requirements
    console.info(`[ORCHESTRATION][${new Date().toISOString()}] Event: ${event} | Tenant: ${payload.tenantId}`);

    // If no webhook URL configured, log warning but don't fail (development mode)
    if (!webhookUrl) {
      console.warn('[ORCHESTRATION] N8N_WEBHOOK_URL not configured - skipping webhook dispatch');
      console.info('[ORCHESTRATION] Payload that would be sent:', JSON.stringify({ event, payload }, null, 2));
      return;
    }

    // Send webhook to n8n with retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(secret && { 'X-BMAD-SECRET': secret }),
            'User-Agent': 'codename-theme-service/1.0'
          },
          body: JSON.stringify({ event, payload }),
          // Timeout after 10 seconds
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unable to read error response');
          throw new Error(`n8n webhook returned ${response.status}: ${errorText}`);
        }

        // Success - log confirmation
        console.info(`[ORCHESTRATION] Webhook sent successfully (attempt ${attempt}/${maxRetries})`);
        return;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[ORCHESTRATION] Webhook attempt ${attempt}/${maxRetries} failed:`, lastError.message);

        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    // All retries exhausted - log error but don't throw (theme is still published in DB)
    console.error(`[ORCHESTRATION] Failed to send webhook after ${maxRetries} attempts:`, lastError?.message);
    console.error('[ORCHESTRATION] Theme was marked published in DB but n8n orchestration failed - manual intervention may be required');
  }
}

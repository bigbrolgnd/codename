import { DatabaseManager } from '@codename/database';
import { MarketingSettings, UpdateMarketingSettings } from '@codename/api';

export class MarketingService {
  constructor(private db: DatabaseManager) {}

  async getSettings(tenantId: string): Promise<MarketingSettings> {
    const result = await this.db.queryInSchema(tenantId,
      `SELECT auto_pilot_enabled, frequency, tone, platforms, next_post_at
       FROM marketing_settings
       WHERE is_default = TRUE
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      // Return defaults if not found (should be handled by migration INSERT)
      return {
        autoPilotEnabled: false,
        frequency: 'weekly',
        tone: 'professional',
        platforms: ['google'],
        nextPostAt: null
      };
    }

    const row = result.rows[0];
    return {
      autoPilotEnabled: row.auto_pilot_enabled,
      frequency: row.frequency,
      tone: row.tone,
      platforms: row.platforms,
      nextPostAt: row.next_post_at ? row.next_post_at.toISOString() : null
    };
  }

  async updateSettings(tenantId: string, settings: UpdateMarketingSettings): Promise<MarketingSettings> {
    // Defensive validation: ensure platforms array is not empty if auto-pilot enabled
    if (settings.autoPilotEnabled && settings.platforms.length === 0) {
      throw new Error('At least one platform must be selected when Auto-Pilot is enabled');
    }

    const nextPostAt = settings.autoPilotEnabled ? this.calculateNextPostAt(settings.frequency) : null;

    const result = await this.db.queryInSchema(tenantId,
      `UPDATE marketing_settings
       SET auto_pilot_enabled = $1,
           frequency = $2,
           tone = $3,
           platforms = $4,
           next_post_at = $5,
           updated_at = NOW()
       WHERE is_default = TRUE
       RETURNING *`,
      [settings.autoPilotEnabled, settings.frequency, settings.tone, settings.platforms, nextPostAt]
    );

    // Simulate n8n Orchestration Trigger
    if (settings.autoPilotEnabled) {
      // Structured logging would go here (e.g., Winston/Pino)
      console.log(`[MarketingService] Triggering n8n Social Pilot for ${tenantId}. Next post scheduled: ${nextPostAt}`);
      // In production: await fetch(process.env.N8N_MARKETING_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ tenantId, nextPostAt }) });
    }

    const row = result.rows[0];
    return {
      autoPilotEnabled: row.auto_pilot_enabled,
      frequency: row.frequency,
      tone: row.tone,
      platforms: row.platforms,
      nextPostAt: row.next_post_at ? row.next_post_at.toISOString() : null
    };
  }

  private calculateNextPostAt(frequency: string): Date {
    const now = new Date();
    const next = new Date(now);
    if (frequency === 'weekly') {
      next.setDate(now.getDate() + 7);
    } else {
      next.setDate(now.getDate() + 14);
    }
    return next;
  }
}

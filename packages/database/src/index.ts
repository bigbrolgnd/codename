import { Pool, PoolConfig } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export class DatabaseManager {
  private pool: Pool;

  constructor(config?: PoolConfig) {
    // Use DATABASE_URL from environment if no config provided
    if (!config && process.env.DATABASE_URL) {
      this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    } else {
      this.pool = new Pool(config);
    }
  }

  /**
   * Initializes the master tenants table in public schema
   */
  async initMasterTable() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          business_name TEXT NOT NULL,
          schema_name TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'provisioning',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } finally {
      client.release();
    }
  }

  /**
   * Creates a tenant record
   */
  async createTenantRecord(businessName: string, schemaName: string) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO public.tenants (business_name, schema_name) VALUES ($1, $2) RETURNING id`,
        [businessName, schemaName]
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Creates a new schema for a tenant
   */
  async createTenantSchema(schema: string) {
    const client = await this.pool.connect();
    try {
      // Validate schema name to prevent SQL injection
      if (!/^tenant_[a-z0-9_]+$/.test(schema)) {
        throw new Error('Invalid schema name format');
      }

      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      console.log(`[DatabaseManager] Created schema: ${schema}`);
    } finally {
      client.release();
    }
  }

  /**
   * Runs migrations for a tenant schema
   */
  async runMigrations(schema: string, migrationFile: string = '001_booking_init.sql') {
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await this.queryInSchema(schema, sql);
    console.log(`[DatabaseManager] Ran migration ${migrationFile} for schema: ${schema}`);
  }

  /**
   * Executes a query within a specific schema
   */
  async queryInSchema(schema: string, query: string, params: any[] = []) {
    const client = await this.pool.connect();
    try {
      if (!/^tenant_[a-z0-9_]+$/.test(schema)) {
        throw new Error('Invalid schema name format');
      }

      await client.query(`SET search_path TO ${schema}`);
      return await client.query(query, params);
    } finally {
      // Reset search path
      await client.query(`SET search_path TO public`);
      client.release();
    }
  }

  /**
   * Shuts down the pool
   */
  async close() {
    await this.pool.end();
  }

  /**
   * Executes a raw query on the pool
   */
  async query(text: string, params: any[] = []) {
    return this.pool.query(text, params);
  }

  /**
   * Gets all pricing configuration entries
   * @returns Array of active pricing config entries ordered by category and name
   * @throws Error if database query fails
   */
  async getPricingConfig() {
    try {
      const result = await this.query(
        `SELECT * FROM public.pricing_config WHERE is_active = TRUE ORDER BY category, name`
      );
      return result.rows;
    } catch (error) {
      console.error('[DatabaseManager] Failed to fetch pricing config:', error);
      throw new Error(`Failed to fetch pricing configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets all add-ons for a specific tenant
   * @param tenantId - The tenant schema_name identifier
   * @returns Array of tenant's active add-ons with pricing details
   * @throws Error if database query fails or tenant not found
   */
  async getTenantAddons(tenantId: string) {
    try {
      const result = await this.query(
        `SELECT ta.*, pc.name, pc.category, pc.price_cents, pc.description
         FROM public.tenant_addons ta
         JOIN public.pricing_config pc ON ta.addon_id = pc.addon_id
         WHERE ta.tenant_id = $1 AND ta.is_active = TRUE`,
        [tenantId]
      );
      return result.rows;
    } catch (error) {
      console.error(`[DatabaseManager] Failed to fetch addons for tenant ${tenantId}:`, error);
      throw new Error(`Failed to fetch tenant add-ons: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribes or re-activates a tenant add-on subscription
   * Creates new subscription or re-activates cancelled subscription via upsert
   * @param tenantId - The tenant schema_name identifier
   * @param addonId - The pricing_config addon_id to subscribe to
   * @param stripeSubscriptionItemId - Optional Stripe subscription item ID for billing
   * @returns The created or updated tenant_addon record
   * @throws Error if database operation fails or invalid addon_id
   */
  async subscribeToAddon(tenantId: string, addonId: string, stripeSubscriptionItemId?: string) {
    try {
      const result = await this.query(
        `INSERT INTO public.tenant_addons (tenant_id, addon_id, stripe_subscription_item_id, is_active)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (tenant_id, addon_id)
         DO UPDATE SET is_active = TRUE, cancelled_at = NULL, stripe_subscription_item_id = $3
         RETURNING *`,
        [tenantId, addonId, stripeSubscriptionItemId || null]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`[DatabaseManager] Failed to subscribe tenant ${tenantId} to addon ${addonId}:`, error);
      throw new Error(`Failed to subscribe to add-on: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates a tenant's base plan type with validation
   * @param tenantId - The tenant schema_name identifier
   * @param planType - New plan type ('free' | 'standard' | 'ai_powered')
   * @returns The updated tenant record
   * @throws Error if invalid planType or database operation fails
   */
  async updateBasePlan(tenantId: string, planType: 'free' | 'standard' | 'ai_powered') {
    // Runtime validation of planType enum
    const validPlanTypes = ['free', 'standard', 'ai_powered'];
    if (!validPlanTypes.includes(planType)) {
      throw new Error(`Invalid plan_type: ${planType}. Must be one of: ${validPlanTypes.join(', ')}`);
    }

    try {
      const result = await this.query(
        `UPDATE public.tenants
         SET base_plan_type = $1, updated_at = NOW()
         WHERE schema_name = $2
         RETURNING *`,
        [planType, tenantId]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`[DatabaseManager] Failed to update base plan for tenant ${tenantId}:`, error);
      throw new Error(`Failed to update base plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

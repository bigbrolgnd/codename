import { Pool, PoolConfig } from 'pg';

export class DatabaseManager {
  private pool: Pool;

  constructor(config?: PoolConfig) {
    this.pool = new Pool(config);
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
      if (!/^[a-z0-9_]+$/.test(schema)) {
        throw new Error('Invalid schema name');
      }

      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      console.log(`[DatabaseManager] Created schema: ${schema}`);
    } finally {
      client.release();
    }
  }

  /**
   * Executes a query within a specific schema
   */
  async queryInSchema(schema: string, query: string, params: any[] = []) {
    const client = await this.pool.connect();
    try {
      if (!/^[a-z0-9_]+$/.test(schema)) {
        throw new Error('Invalid schema name');
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
}

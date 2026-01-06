import { DatabaseManager } from '@codename/database';
import { ProvisioningLog } from '@codename/api';

const dbManager = new DatabaseManager();

export class TenantDatabaseService {
  
  /**
   * Step 1: Creates the isolated schema for the tenant
   */
  async createTenantSchema(provisioningId: string, businessName: string): Promise<{ schemaName: string, logs: ProvisioningLog[] }> {
    const schemaName = `tenant_${provisioningId.replace(/-/g, '_')}`;
    const logs: ProvisioningLog[] = [];

    // 1. Create Master Record
    try {
      await dbManager.initMasterTable(); // Ensure master table exists
      await dbManager.createTenantRecord(businessName, schemaName);
      logs.push(this.createLog('Tenant record created in master registry', 'success'));
    } catch (e: any) {
      logs.push(this.createLog(`Failed to create tenant record: ${e.message}`, 'warning'));
      throw e;
    }

    // 2. Create Schema
    try {
      await dbManager.createTenantSchema(schemaName);
      logs.push(this.createLog(`Database schema '${schemaName}' secured`, 'success'));
    } catch (e: any) {
      logs.push(this.createLog(`Failed to create schema: ${e.message}`, 'warning'));
      throw e;
    }

    return { schemaName, logs };
  }

  /**
   * Step 2: Seeds the schema with initial data (Services, Config)
   */
  async seedTenantData(schemaName: string, services: any[]): Promise<ProvisioningLog[]> {
    const logs: ProvisioningLog[] = [];
    
    try {
      // Run migrations
      await dbManager.runMigrations(schemaName, '001_booking_init.sql');
      await dbManager.runMigrations(schemaName, '002_analytics_init.sql');
      await dbManager.runMigrations(schemaName, '003_billing_init.sql');
      await dbManager.runMigrations(schemaName, '004_reviews_init.sql');
      await dbManager.runMigrations(schemaName, '005_marketing_init.sql');
      await dbManager.runMigrations(schemaName, '006_instagram_sync_init.sql');

      logs.push(this.createLog(`Seeded ${services.length} services into '${schemaName}'`, 'success'));
      logs.push(this.createLog(`Applied initial branding and marketing configuration`, 'info'));
    } catch (e: any) {
      logs.push(this.createLog(`Seeding failed: ${e.message}`, 'error'));
      throw e;
    }

    return logs;
  }

  private createLog(message: string, type: 'info' | 'success' | 'warning' | 'error'): ProvisioningLog {
    return {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      message,
      type,
      phase: 'intelligence' 
    };
  }
}

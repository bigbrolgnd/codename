import { 
  ProvisioningRequest, 
  ProvisioningStatusResponse, 
  ProvisioningPhase, 
  ProvisioningLog 
} from '@codename/api';
import { provisioningJobs } from '../routers/provision.router';
import { DatabaseManager } from '@codename/database';

const dbManager = new DatabaseManager();

const MOCK_LOGS: Record<ProvisioningPhase, string[]> = {
  architecture: [
    "Setting up your business profile...",
    "Claiming your web address...",
    "Preparing your private workspace..."
  ],
  intelligence: [
    "Creating your secure database...",
    "Organizing your services...",
    "Building your 30-day calendar...",
    "Optimizing brand imagery..."
  ],
  security: [
    "Connecting your payment system...",
    "Securing your checkout with SSL...",
    "Protecting your customer data..."
  ],
  launch: [
    "Publishing your site...",
    "Warming up for your first visitor...",
    "Going live in 3... 2... 1..."
  ]
};

export class ProvisioningService {
  /**
   * Starts the provisioning process (triggers n8n)
   */
  async startProvisioning(provisioningId: string, request: ProvisioningRequest) {
    // In a real app, this would be an axios/fetch call to n8n webhook
    console.log(`[ProvisioningService] Starting job ${provisioningId}`);
    
    // Simulate the n8n orchestration process
    this.runMockOrchestration(provisioningId, request);
  }

  /**
   * Mock n8n orchestration process
   */
  private async runMockOrchestration(provisioningId: string, request: ProvisioningRequest) {
    const phases: ProvisioningPhase[] = ['architecture', 'intelligence', 'security', 'launch'];
    let overallProgress = 0;
    const businessName = request.businessName || `tenant_${provisioningId.substring(0, 4)}`;
    const schemaName = `tenant_${provisioningId.replace(/-/g, '_')}`;

    // Initialize master table if not exists (in a real app, this is a migration)
    await dbManager.initMasterTable();

    for (const phase of phases) {
      // --- Phase-specific DB logic ---
      if (phase === 'architecture') {
        try {
          await dbManager.createTenantRecord(businessName, schemaName);
          this.addLog(provisioningId, 'Tenant record created in master table', 'success', phase);
        } catch (e: any) {
          this.addLog(provisioningId, `Failed to create tenant record: ${e.message}`, 'warning', phase);
        }
      }
      if (phase === 'intelligence') {
        try {
          await dbManager.createTenantSchema(schemaName);
          this.addLog(provisioningId, `Database schema '${schemaName}' secured`, 'success', phase);
          // Here you would seed the data, e.g.,
          // await dbManager.queryInSchema(schemaName, 'CREATE TABLE services (...)');
          this.addLog(provisioningId, `Seeded ${request.services.length} services`, 'info', phase);
        } catch (e: any) {
          this.addLog(provisioningId, `Failed to create schema: ${e.message}`, 'warning', phase);
        }
      }
      // --- End of DB logic ---

      const phaseLogs = MOCK_LOGS[phase];
      const stepIncrement = 25 / phaseLogs.length;

      for (let i = 0; i < phaseLogs.length; i++) {
        const message = phaseLogs[i];
        
        await new Promise(r => setTimeout(r, 250 + Math.random() * 250)); // Faster simulation
        
        this.addLog(provisioningId, message, 'info', phase, stepIncrement);
      }
    }

    // Finalize
    const finalStatus = provisioningJobs.get(provisioningId);
    if (finalStatus) {
      provisioningJobs.set(provisioningId, {
        ...finalStatus,
        status: 'complete',
        overallProgress: 100,
        phaseProgress: 100,
        result: {
          siteUrl: `https://${businessName.toLowerCase().replace(/\s+/g, '-')}.codename.app`,
          dashboardUrl: `https://dashboard.codename.app/sites/${provisioningId}`,
          tenantId: schemaName,
        }
      });
    }
  }

  /**
   * Adds a log entry and updates the job status
   */
  private addLog(provisioningId: string, message: string, type: 'info' | 'success' | 'warning', phase: ProvisioningPhase, progressIncrement: number = 0) {
      const currentStatus = provisioningJobs.get(provisioningId);
      if (!currentStatus) return;

      const log: ProvisioningLog = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        message,
        type,
        phase,
      };

      const newOverallProgress = Math.min(100, Math.round(currentStatus.overallProgress + progressIncrement));
      const phaseThreshold = 25;
      const phaseProgress = Math.round(((newOverallProgress % phaseThreshold) / phaseThreshold) * 100);

      const updatedStatus = {
        ...currentStatus,
        status: 'in_progress',
        currentPhase: phase,
        phaseProgress,
        overallProgress: newOverallProgress,
        latestLog: log,
        logs: [...(currentStatus.logs || []), log].slice(-20),
      };

      provisioningJobs.set(provisioningId, updatedStatus);
  }


  /**
   * Updates status from an external source (e.g. n8n webhook)
   */
  async updateStatus(provisioningId: string, update: Partial<ProvisioningStatusResponse>) {
    const current = provisioningJobs.get(provisioningId);
    if (!current) throw new Error('Job not found');
    
    provisioningJobs.set(provisioningId, { ...current, ...update });
  }
}

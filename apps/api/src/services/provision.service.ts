import { 
  ProvisioningRequest, 
  ProvisioningStatusResponse, 
  ProvisioningPhase, 
  ProvisioningLog 
} from '@codename/api';
import { provisioningJobs } from '../routers/provision.router';
import { TenantDatabaseService } from './tenant/tenant-database.service';
import { ContainerService } from './tenant/container.service';

const tenantDbService = new TenantDatabaseService();
const containerService = new ContainerService();

const MOCK_ARCH_LOGS: string[] = [
  "Setting up your business profile...",
  "Claiming your web address...",
  "Preparing your private workspace..."
];

export class ProvisioningService {
  /**
   * Starts the provisioning process (triggers n8n or runs internal orchestration)
   */
  async startProvisioning(provisioningId: string, request: ProvisioningRequest) {
    console.log(`[ProvisioningService] Starting modular job ${provisioningId}`);
    this.runOrchestration(provisioningId, request);
  }

  /**
   * Orchestration process using modular services
   */
  private async runOrchestration(provisioningId: string, request: ProvisioningRequest) {
    const businessName = request.businessName || `tenant_${provisioningId.substring(0, 4)}`;
    let schemaName = '';

    // --- PHASE 1: Architecture (Tenant Record) ---
    for (const log of MOCK_ARCH_LOGS) {
       await this.simulateDelay();
       this.addLog(provisioningId, log, 'info', 'architecture', 5);
    }

    // --- PHASE 2: Intelligence (DB Schema & Seeding) ---
    try {
      // Step A: Create Schema
      const schemaResult = await tenantDbService.createTenantSchema(provisioningId, businessName);
      schemaName = schemaResult.schemaName;
      this.batchAddLogs(provisioningId, schemaResult.logs, 'architecture');

      // Step B: Seed Data
      await this.simulateDelay();
      const seedLogs = await tenantDbService.seedTenantData(schemaName, request.services);
      this.batchAddLogs(provisioningId, seedLogs, 'intelligence');
      
    } catch (e: any) {
      this.addLog(provisioningId, `Critical Error: ${e.message}`, 'error', 'intelligence');
      return; // Stop provisioning on error
    }

    // --- PHASE 3: Security (Mock) ---
    // In future, this would call a SecurityService (SSL, Passkeys)
    this.addLog(provisioningId, "Connecting secure payment gateway...", 'info', 'security', 10);
    await this.simulateDelay();
    this.addLog(provisioningId, "Encrypting customer data vault...", 'success', 'security', 10);

    // --- PHASE 4: Launch (Container Provisioning) ---
    try {
      const containerResult = await containerService.provisionContainer(provisioningId, schemaName);
      this.batchAddLogs(provisioningId, containerResult.logs, 'launch');

      // Final Success State
      const currentStatus = provisioningJobs.get(provisioningId);
      if (currentStatus) {
        provisioningJobs.set(provisioningId, {
          ...currentStatus,
          status: 'complete',
          overallProgress: 100,
          phaseProgress: 100,
          currentPhase: 'launch',
          result: {
            siteUrl: containerResult.containerUrl,
            dashboardUrl: `https://dashboard.codename.app/sites/${provisioningId}`,
            tenantId: schemaName,
          }
        });
      }

    } catch (e: any) {
      this.addLog(provisioningId, `Container Error: ${e.message}`, 'error', 'launch');
    }
  }

  // --- Helper Methods ---

  private async simulateDelay() {
    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
  }

  private batchAddLogs(provisioningId: string, logs: ProvisioningLog[], phase: ProvisioningPhase) {
    logs.forEach(log => {
       // We force the log phase to match the current step context if needed, 
       // but mostly trust the service return
       this.addLog(provisioningId, log.message, log.type, (log as any).phase || phase, 5);
    });
  }

  private addLog(provisioningId: string, message: string, type: 'info' | 'success' | 'warning' | 'error', phase: ProvisioningPhase, progressIncrement: number = 0) {
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

  async updateStatus(provisioningId: string, update: Partial<ProvisioningStatusResponse>) {
    const current = provisioningJobs.get(provisioningId);
    if (!current) throw new Error('Job not found');
    provisioningJobs.set(provisioningId, { ...current, ...update });
  }
}

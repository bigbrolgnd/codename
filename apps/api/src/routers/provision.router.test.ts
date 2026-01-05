import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appRouter } from '../router';

const caller = appRouter.createCaller({});

describe('Provisioning API Endpoints', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('provision.start', () => {
    it('accepts valid services and returns a provisioningId', async () => {
      const result = await caller.provision.start({
        services: [
          { id: crypto.randomUUID(), name: 'Service 1', price: 1000, duration: 30, category: 'Hair', confidence: 95 }
        ],
        businessName: 'Test Biz'
      });

      expect(result).toBeDefined();
      expect(result.provisioningId).toBeDefined();
      expect(typeof result.provisioningId).toBe('string');
    });

    it('validates request format', async () => {
      // @ts-ignore
      await expect(caller.provision.start({})).rejects.toThrow();
    });
  });

  describe('provision.getStatus', () => {
    it('returns initial status after start', async () => {
      const { provisioningId } = await caller.provision.start({
        services: [
          { id: crypto.randomUUID(), name: 'Service 1', price: 1000, duration: 30, category: 'Hair', confidence: 95 }
        ]
      });

      const status = await caller.provision.getStatus({ provisioningId });

      expect(status).toBeDefined();
      expect(status.provisioningId).toBe(provisioningId);
      expect(status.status).toBeDefined();
      expect(status.currentPhase).toBe('architecture');
    });

    it('throws error for non-existent provisioningId', async () => {
      await expect(
        caller.provision.getStatus({ provisioningId: crypto.randomUUID() })
      ).rejects.toThrow('Provisioning job not found');
    });
  });
});

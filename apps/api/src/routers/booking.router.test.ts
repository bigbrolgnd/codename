import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookingRouter } from './booking.router';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database');

describe('bookingRouter', () => {
  let mockDbManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbManager = new DatabaseManager();
  });

  it('has getAvailableSlots procedure', async () => {
    expect(bookingRouter.getAvailableSlots).toBeDefined();
  });

  it('fetches slots for a valid service and date', async () => {
    const caller = bookingRouter.createCaller({});
    
    // Mock DB response for service duration
    vi.spyOn(DatabaseManager.prototype, 'queryInSchema').mockImplementation((schema: string, query: string) => {
      if (query.includes('FROM services')) {
        return Promise.resolve({ rows: [{ duration: 60 }] });
      }
      if (query.includes('FROM availability')) {
        return Promise.resolve({ rows: [{ staff_id: 's1', start_time: '09:00:00', end_time: '17:00:00' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const result = await caller.getAvailableSlots({
      tenantId: 'tenant_123',
      date: '2026-01-05',
      serviceId: crypto.randomUUID(),
    });

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('lists services for a tenant', async () => {
    const caller = bookingRouter.createCaller({});
    
    vi.spyOn(DatabaseManager.prototype, 'queryInSchema').mockImplementation((schema: string, query: string) => {
      if (query.includes('FROM services')) {
        return Promise.resolve({ 
          rows: [
            { id: 's1', name: 'Service 1', price: 1000, duration: 30, category: 'A' },
            { id: 's2', name: 'Service 2', price: 2000, duration: 60, category: 'B' }
          ] 
        });
      }
      return Promise.resolve({ rows: [] });
    });

    const result = await caller.listServices({
      tenantId: 'tenant_123',
    });

    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Service 1');
  });
});
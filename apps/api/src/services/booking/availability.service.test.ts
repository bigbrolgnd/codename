import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvailabilityService } from './availability.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database');

describe('AvailabilityService', () => {
  let availabilityService: AvailabilityService;
  let mockDbManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbManager = new DatabaseManager();
    availabilityService = new AvailabilityService(mockDbManager);
  });

  it('returns available slots for a given date and duration', async () => {
    const tenantId = 'tenant_123';
    const date = '2026-01-05'; // Monday
    const duration = 60;
    const buffer = 0;

    // Mock Working Hours (9:00 - 17:00)
    mockDbManager.queryInSchema.mockImplementation((schema: string, query: string) => {
      if (query.includes('FROM availability')) {
        return Promise.resolve({
          rows: [
            { staff_id: 's1', day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' }
          ]
        });
      }
      if (query.includes('FROM bookings')) {
        return Promise.resolve({
          rows: [
            // Booking 10:00 - 11:00
            { 
              staff_id: 's1', 
              start_time: new Date('2026-01-05T10:00:00Z'), 
              end_time: new Date('2026-01-05T11:00:00Z') 
            }
          ]
        });
      }
      return Promise.resolve({ rows: [] });
    });

    const slots = await availabilityService.getAvailableSlots(tenantId, date, duration, buffer);

    // Expected gaps: 
    // 09:00 - 10:00 (Fits 60m? Yes, but needs 15m buffer if there's a booking after it)
    // 11:00 - 17:00 (Fits 60m? Yes)
    
    // If buffer is 15m, and booking starts at 10:00, then 09:00 - 09:45 is available.
    // Wait, the logic should be: slot_start + duration + buffer <= next_booking_start OR end_of_day
    
    expect(slots.length).toBeGreaterThan(0);
    expect(slots).toContain('2026-01-05T09:00:00.000Z');
    expect(slots).not.toContain('2026-01-05T10:00:00.000Z');
  });
});
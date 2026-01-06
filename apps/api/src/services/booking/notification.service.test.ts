import { describe, it, expect, vi } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const service = new NotificationService();

  it('generates correct message and dispatches channels', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    const payload = {
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      businessName: "Elena's Braids",
      serviceName: 'Box Braids',
      startTime: '2026-01-05T10:00:00Z',
    };

    const result = await service.sendBookingConfirmation(payload);

    expect(result.success).toBe(true);
    expect(result.channels).toContain('sms');
    expect(result.channels).toContain('whatsapp');
    
    // Check if console was logged with correct business name
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Elena's Braids"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Box Braids"));
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VisitCapService } from './visit-cap.service';
import { EmailService } from '../email.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database');
vi.mock('../email.service');

describe('VisitCapService', () => {
  let visitCapService: VisitCapService;
  let mockDb: any;
  let mockEmailService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = new DatabaseManager();
    mockEmailService = new EmailService();
    visitCapService = new VisitCapService(mockDb, mockEmailService);
  });

  describe('trackVisit', () => {
    it('throws error for invalid tenantId format', async () => {
      await expect(visitCapService.trackVisit('invalid-tenant')).rejects.toThrow('Invalid tenantId format');
    });

    it('allows visit for free tier user under cap', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          monthly_visit_cap: 5000,
          current_month_visits: 100,
          visit_cap_warning_sent: false,
          base_plan_type: 'free'
        }]
      });

      const result = await visitCapService.trackVisit('tenant_test');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4899);
      expect(result.atCap).toBe(false);
    });

    it('blocks visit when cap is reached', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          monthly_visit_cap: 5000,
          current_month_visits: 5000,
          visit_cap_warning_sent: true,
          base_plan_type: 'free'
        }]
      });

      const result = await visitCapService.trackVisit('tenant_test');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.atCap).toBe(true);
    });

    it('allows unlimited visits for paid tier users', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          monthly_visit_cap: 5000,
          current_month_visits: 10000,
          visit_cap_warning_sent: false,
          base_plan_type: 'standard'
        }]
      });

      const result = await visitCapService.trackVisit('tenant_test');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1); // Unlimited
      expect(result.atCap).toBe(false);
    });

    it('increments visit counter for free tier', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          monthly_visit_cap: 5000,
          current_month_visits: 100,
          visit_cap_warning_sent: false,
          base_plan_type: 'free'
        }]
      });

      await visitCapService.trackVisit('tenant_test');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.tenants'),
        ['tenant_test']
      );
    });

    it('sends warning at 80% threshold', async () => {
      // Setup mock sequence for trackVisit:
      // 1. First query: get tenant visit cap info (for checking cap)
      // 2. Second query: update visit counter
      // 3. Third query (inside sendCapWarning): get tenant + user info for email

      mockDb.query
        // First call: get tenant info (for visit tracking)
        .mockResolvedValueOnce({
          rows: [{
            monthly_visit_cap: 5000,
            current_month_visits: 4000,
            visit_cap_warning_sent: false,
            base_plan_type: 'free'
          }]
        })
        // Second call: increment visit counter
        .mockResolvedValueOnce({ rows: [] })
        // Third call (from sendCapWarning): get tenant + user details
        .mockResolvedValueOnce({
          rows: [{
            business_name: 'Test Business',
            base_plan_type: 'free',
            monthly_visit_cap: 5000,
            current_month_visits: 4001,
            email: 'test@example.com'
          }]
        })
        // Fourth call (from sendCapWarning): mark warning as sent
        .mockResolvedValueOnce({ rows: [] });

      await visitCapService.trackVisit('tenant_test');

      expect(mockEmailService.sendVisitCapWarning).toHaveBeenCalledWith(
        'test@example.com',
        'Test Business',
        4001, // After increment
        5000
      );
    });
  });

  describe('checkVisitCap', () => {
    it('throws error for invalid tenantId format', async () => {
      await expect(visitCapService.checkVisitCap('invalid-tenant')).rejects.toThrow('Invalid tenantId format');
    });

    it('returns visit cap status for free tier', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          monthly_visit_cap: 5000,
          current_month_visits: 2500,
          base_plan_type: 'free'
        }]
      });

      const result = await visitCapService.checkVisitCap('tenant_test');

      expect(result.current).toBe(2500);
      expect(result.cap).toBe(5000);
      expect(result.percentage).toBe(50);
    });

    it('returns unlimited for paid tier', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          monthly_visit_cap: 5000,
          current_month_visits: 10000,
          base_plan_type: 'standard'
        }]
      });

      const result = await visitCapService.checkVisitCap('tenant_test');

      expect(result.current).toBe(10000);
      expect(result.cap).toBe(-1); // Unlimited
      expect(result.percentage).toBe(0);
    });

    it('caps percentage at 100', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          monthly_visit_cap: 5000,
          current_month_visits: 6000,
          base_plan_type: 'free'
        }]
      });

      const result = await visitCapService.checkVisitCap('tenant_test');

      expect(result.percentage).toBe(100);
    });
  });

  describe('resetMonthlyCounters', () => {
    it('resets counters for all free tier tenants', async () => {
      await visitCapService.resetMonthlyCounters();

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.tenants')
      );
    });
  });

  describe('sendCapWarning', () => {
    it('throws error for invalid tenantId format', async () => {
      await expect(visitCapService.sendCapWarning('invalid-tenant')).rejects.toThrow('Invalid tenantId format');
    });

    it('sends warning email to tenant', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          business_name: 'Test Business',
          base_plan_type: 'free',
          monthly_visit_cap: 5000,
          current_month_visits: 4000,
          email: 'test@example.com'
        }]
      });

      await visitCapService.sendCapWarning('tenant_test');

      expect(mockEmailService.sendVisitCapWarning).toHaveBeenCalledWith(
        'test@example.com',
        'Test Business',
        4000,
        5000
      );
    });

    it('marks warning as sent before sending email', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          business_name: 'Test Business',
          base_plan_type: 'free',
          monthly_visit_cap: 5000,
          current_month_visits: 4000,
          email: 'test@example.com'
        }]
      });

      await visitCapService.sendCapWarning('tenant_test');

      // Check that the update query was called
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.tenants SET visit_cap_warning_sent = TRUE'),
        ['tenant_test']
      );
    });

    it('handles missing tenant gracefully', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await expect(visitCapService.sendCapWarning('tenant_test')).resolves.not.toThrow();
    });

    it('handles missing email gracefully', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          business_name: 'Test Business',
          base_plan_type: 'free',
          monthly_visit_cap: 5000,
          current_month_visits: 4000,
          email: null
        }]
      });

      await expect(visitCapService.sendCapWarning('tenant_test')).resolves.not.toThrow();
    });

    it('uses default business name when missing', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          business_name: null,
          base_plan_type: 'free',
          monthly_visit_cap: 5000,
          current_month_visits: 4000,
          email: 'test@example.com'
        }]
      });

      await visitCapService.sendCapWarning('tenant_test');

      expect(mockEmailService.sendVisitCapWarning).toHaveBeenCalledWith(
        'test@example.com',
        'there',
        4000,
        5000
      );
    });
  });

  describe('enforceCap', () => {
    it('throws error for invalid tenantId format', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          monthly_visit_cap: 5000,
          current_month_visits: 5000,
          base_plan_type: 'free'
        }]
      });

      await expect(visitCapService.enforceCap('invalid-tenant')).rejects.toThrow('Invalid tenantId format');
    });

    it('returns upgrade prompt data', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{
          monthly_visit_cap: 5000,
          current_month_visits: 5000,
          base_plan_type: 'free'
        }]
      });

      const result = await visitCapService.enforceCap('tenant_test');

      expect(result.message).toContain('monthly visit limit');
      expect(result.upgradeUrl).toContain('/pricing?upgrade=standard');
      expect(result.currentVisits).toBe(5000);
      expect(result.visitCap).toBe(5000);
    });
  });
});

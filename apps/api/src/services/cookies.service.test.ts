import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConversionCookiesService } from './cookies.service';
import { DatabaseManager } from '@codename/database';

// Mock DatabaseManager
vi.mock('@codename/database', () => ({
  DatabaseManager: vi.fn(),
}));

// Mock document.cookie
const mockCookies = new Map<string, string>();

Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
  get: () => {
    return Array.from(mockCookies.entries())
      .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
      .join('; ');
  },
  set: (cookie) => {
    const match = cookie.match(/^([^=]+)=([^;]*)/);
    if (match) {
      const name = decodeURIComponent(match[1]);
      const value = decodeURIComponent(match[2]);
      if (cookie.includes('Max-Age=-1') || cookie.includes('max-age=-1')) {
        mockCookies.delete(name);
      } else {
        mockCookies.set(name, value);
      }
    }
  },
});

describe('ConversionCookiesService', () => {
  let cookiesService: ConversionCookiesService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.clear();
    mockDb = {
      query: vi.fn(),
      queryInSchema: vi.fn(),
    };
    cookiesService = new ConversionCookiesService(mockDb as unknown as DatabaseManager);
  });

  afterEach(() => {
    mockCookies.clear();
  });

  describe('generateVisitorId', () => {
    it('generates a unique visitor ID with prefix', () => {
      const id1 = cookiesService.generateVisitorId();
      const id2 = cookiesService.generateVisitorId();

      expect(id1).toMatch(/^v_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^v_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateSessionId', () => {
    it('generates a unique session ID with prefix', () => {
      const id1 = cookiesService.generateSessionId();
      const id2 = cookiesService.generateSessionId();

      expect(id1).toMatch(/^s_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^s_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('setTrackingCookies', () => {
    it('sets essential cookies without consent', () => {
      cookiesService.setTrackingCookies('tenant_test', 'visitor_123', false);

      expect(mockCookies.has('_zn_session_id')).toBe(true);
      expect(mockCookies.has('_zn_tenant_id')).toBe(true);
      expect(mockCookies.get('_zn_tenant_id')).toBe('tenant_test');
      expect(mockCookies.has('_zn_visitor_id')).toBe(false);
    });

    it('sets non-essential cookies with consent', () => {
      cookiesService.setTrackingCookies('tenant_test', 'visitor_123', true);

      expect(mockCookies.has('_zn_visitor_id')).toBe(true);
      expect(mockCookies.get('_zn_visitor_id')).toBe('visitor_123');
      expect(mockCookies.has('_zn_first_visit')).toBe(true);
      expect(mockCookies.has('_zn_last_visit')).toBe(true);
      expect(mockCookies.has('_zn_visit_count')).toBe(true);
      expect(mockCookies.get('_zn_visit_count')).toBe('1');
    });

    it('increments visit count on subsequent visits', () => {
      mockCookies.set('_zn_visit_count', '5');
      mockCookies.set('_zn_first_visit', '2026-01-01T00:00:00Z');

      cookiesService.setTrackingCookies('tenant_test', 'visitor_123', true);

      expect(mockCookies.get('_zn_visit_count')).toBe('6');
    });

    it('sets initial conversion stage to free', () => {
      cookiesService.setTrackingCookies('tenant_test', 'visitor_123', true);

      expect(mockCookies.get('_zn_conversion_stage')).toBe('free');
    });

    it('preserves existing first visit date', () => {
      mockCookies.set('_zn_first_visit', '2026-01-01T00:00:00Z');

      cookiesService.setTrackingCookies('tenant_test', 'visitor_123', true);

      expect(mockCookies.get('_zn_first_visit')).toBe('2026-01-01T00:00:00Z');
    });
  });

  describe('trackVisit', () => {
    it('records a visit in visit_logs and analytics_events', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({ rowCount: 1 });
      mockDb.query = vi.fn().mockResolvedValue({ rowCount: 1 });

      await cookiesService.trackVisit('tenant_test', 'visitor_123', {
        url: '/home',
        referrer: 'https://google.com',
      });

      expect(mockDb.queryInSchema).toHaveBeenCalledWith(
        'tenant_test',
        expect.stringContaining('INSERT INTO visit_logs'),
        expect.arrayContaining(['visitor_123', '/home', 'https://google.com'])
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.analytics_events'),
        expect.arrayContaining(['tenant_test', 'visitor_123', 'visit'])
      );
    });

    it('handles missing page data gracefully', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({ rowCount: 1 });
      mockDb.query = vi.fn().mockResolvedValue({ rowCount: 1 });

      await cookiesService.trackVisit('tenant_test', 'visitor_123');

      expect(mockDb.queryInSchema).toHaveBeenCalledWith(
        'tenant_test',
        expect.stringContaining('INSERT INTO visit_logs'),
        expect.arrayContaining(['visitor_123', '/', null, null, null])
      );
    });
  });

  describe('trackPageView', () => {
    it('records a page view in visit_logs and analytics_events', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({ rowCount: 1 });
      mockDb.query = vi.fn().mockResolvedValue({ rowCount: 1 });

      const pageData = {
        url: '/about',
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0',
        city: 'New York',
        county: 'NY',
      };

      await cookiesService.trackPageView('tenant_test', 'visitor_123', pageData);

      expect(mockDb.queryInSchema).toHaveBeenCalledWith(
        'tenant_test',
        expect.stringContaining('INSERT INTO visit_logs'),
        expect.arrayContaining(['visitor_123', '/about', 'https://google.com', 'New York', 'NY'])
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.analytics_events'),
        expect.arrayContaining(['tenant_test', 'visitor_123', 'page_view'])
      );
    });
  });

  describe('trackComponentInteraction', () => {
    it('records component interaction in analytics_events', async () => {
      mockDb.query = vi.fn().mockResolvedValue({ rowCount: 1 });

      const interactionData = {
        componentId: 'btn_book_now',
        componentType: 'button',
        action: 'click' as const,
        metadata: { page: '/home', position: 'header' },
      };

      await cookiesService.trackComponentInteraction('tenant_test', 'visitor_123', interactionData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.analytics_events'),
        [
          'tenant_test',
          'visitor_123',
          'component_interaction',
          expect.stringContaining('"component_id":"btn_book_now"'),
        ]
      );
    });
  });

  describe('getConversionStatus', () => {
    it('returns visitor conversion status from visit_logs and analytics_events', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({
        rows: [{
          first_visit: '2026-01-01T00:00:00Z',
          last_visit: '2026-01-10T00:00:00Z',
          visit_count: '5',
        }],
      });

      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{
          current_stage: 'engaged',
          stages_visited: '["free", "engaged"]',
        }],
      });

      const status = await cookiesService.getConversionStatus('tenant_test', 'visitor_123');

      expect(status.visitorId).toBe('visitor_123');
      expect(status.visitCount).toBe(5);
      expect(status.currentStage).toBe('engaged');
      expect(status.stagesVisited).toEqual(['free', 'engaged']);
    });

    it('returns default status for new visitor', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({ rows: [] });
      mockDb.query = vi.fn().mockResolvedValue({ rows: [] });

      const status = await cookiesService.getConversionStatus('tenant_test', 'visitor_123');

      expect(status.currentStage).toBe('free');
      expect(status.visitCount).toBe(1);
      expect(status.stagesVisited).toEqual(['free']);
    });
  });

  describe('updateConversionStage', () => {
    it('updates to a higher stage', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({
        rows: [{ first_visit: '2026-01-01', last_visit: '2026-01-10', visit_count: '1' }],
      });
      mockDb.query = vi.fn()
        .mockResolvedValueOnce({ rows: [{ current_stage: 'free', stages_visited: '["free"]' }] })
        .mockResolvedValueOnce({ rowCount: 1 });

      await cookiesService.updateConversionStage('tenant_test', 'visitor_123', 'engaged');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.analytics_events'),
        expect.arrayContaining([
          'tenant_test',
          'visitor_123',
          'conversion_stage_update',
          expect.stringContaining('"stage":"engaged"'),
        ])
      );
    });

    it('prevents moving backward in funnel', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({
        rows: [{ first_visit: '2026-01-01', last_visit: '2026-01-10', visit_count: '1' }],
      });

      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{ current_stage: 'pricing', stages_visited: '["free","engaged","pricing"]' }],
      });

      await cookiesService.updateConversionStage('tenant_test', 'visitor_123', 'engaged');

      // Should not update since engaged < pricing
      expect(mockDb.query).toHaveBeenCalledTimes(2); // getConversionStatus (visit + stage) only
    });

    it('updates cookie when stage changes', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({
        rows: [{ first_visit: '2026-01-01', last_visit: '2026-01-10', visit_count: '1' }],
      });

      mockDb.query = vi.fn()
        .mockResolvedValueOnce({ rows: [{ current_stage: 'free', stages_visited: '["free"]' }] })
        .mockResolvedValueOnce({ rowCount: 1 });

      await cookiesService.updateConversionStage('tenant_test', 'visitor_123', 'engaged');

      expect(mockCookies.get('_zn_conversion_stage')).toBe('engaged');
    });
  });

  describe('cookie consent', () => {
    it('sets cookie consent', () => {
      cookiesService.setCookieConsent('accept');

      expect(mockCookies.get('_zn_cookie_consent')).toBe('accept');
    });

    it('gets cookie consent status', () => {
      mockCookies.set('_zn_cookie_consent', 'reject');

      expect(cookiesService.getCookieConsent()).toBe('reject');
    });

    it('returns null when no consent set', () => {
      expect(cookiesService.getCookieConsent()).toBeNull();
    });

    it('hasConsent returns true for accept', () => {
      mockCookies.set('_zn_cookie_consent', 'accept');

      expect(cookiesService.hasConsent()).toBe(true);
    });

    it('hasConsent returns true for custom', () => {
      mockCookies.set('_zn_cookie_consent', 'custom');

      expect(cookiesService.hasConsent()).toBe(true);
    });

    it('hasConsent returns false for reject', () => {
      mockCookies.set('_zn_cookie_consent', 'reject');

      expect(cookiesService.hasConsent()).toBe(false);
    });

    it('hasConsent returns false when no consent', () => {
      expect(cookiesService.hasConsent()).toBe(false);
    });
  });

  describe('clearTrackingCookies', () => {
    it('removes all tracking cookies', () => {
      mockCookies.set('_zn_session_id', 'session_123');
      mockCookies.set('_zn_tenant_id', 'tenant_123');
      mockCookies.set('_zn_visitor_id', 'visitor_123');

      cookiesService.clearTrackingCookies();

      expect(mockCookies.has('_zn_session_id')).toBe(false);
      expect(mockCookies.has('_zn_tenant_id')).toBe(false);
      expect(mockCookies.has('_zn_visitor_id')).toBe(false);
    });
  });

  describe('getCurrentStage', () => {
    it('returns stage from cookie', () => {
      mockCookies.set('_zn_conversion_stage', 'pricing');

      expect(cookiesService.getCurrentStage()).toBe('pricing');
    });

    it('defaults to free when no cookie', () => {
      expect(cookiesService.getCurrentStage()).toBe('free');
    });

    it('returns free for invalid stage', () => {
      mockCookies.set('_zn_conversion_stage', 'invalid');

      expect(cookiesService.getCurrentStage()).toBe('free');
    });
  });

  describe('detectConversionStage', () => {
    it('detects engaged stage with multiple visits', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({
        rows: [{ first_visit: '2026-01-01', last_visit: '2026-01-10', visit_count: '3' }],
      });

      mockDb.query = vi.fn()
        .mockResolvedValueOnce({ rows: [{ current_stage: 'free', stages_visited: '["free"]' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const stage = await cookiesService.detectConversionStage('tenant_test', 'visitor_123');

      expect(stage).toBe('engaged');
    });

    it('detects pricing stage when pricing pages viewed', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({
        rows: [{ first_visit: '2026-01-01', last_visit: '2026-01-10', visit_count: '2' }],
      });

      mockDb.query = vi.fn()
        .mockResolvedValueOnce({ rows: [{ current_stage: 'engaged', stages_visited: '["free","engaged"]' }] })
        .mockResolvedValueOnce({ rows: [{ count: '3' }] });

      const stage = await cookiesService.detectConversionStage('tenant_test', 'visitor_123');

      expect(stage).toBe('pricing');
    });

    it('keeps current stage for low engagement', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({
        rows: [{ first_visit: '2026-01-01', last_visit: '2026-01-10', visit_count: '1' }],
      });

      mockDb.query = vi.fn()
        .mockResolvedValueOnce({ rows: [{ current_stage: 'free', stages_visited: '["free"]' }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const stage = await cookiesService.detectConversionStage('tenant_test', 'visitor_123');

      expect(stage).toBe('free');
    });
  });

  describe('edge cases', () => {
    it('handles database errors gracefully', async () => {
      mockDb.queryInSchema = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        cookiesService.trackVisit('tenant_test', 'visitor_123')
      ).rejects.toThrow('Database error');
    });

    it('handles null query results', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({ rows: null });
      mockDb.query = vi.fn().mockResolvedValue({ rows: null });

      const status = await cookiesService.getConversionStatus('tenant_test', 'visitor_123');

      expect(status.currentStage).toBe('free');
    });

    it('handles empty stage array', async () => {
      mockDb.queryInSchema = vi.fn().mockResolvedValue({
        rows: [{ first_visit: '2026-01-01', last_visit: '2026-01-10', visit_count: '1' }],
      });

      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{ current_stage: 'free', stages_visited: null }],
      });

      const status = await cookiesService.getConversionStatus('tenant_test', 'visitor_123');

      expect(status.stagesVisited).toEqual(['free']);
    });
  });
});

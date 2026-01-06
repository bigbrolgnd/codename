import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminRouter } from './admin.router';
import { DatabaseManager } from '@codename/database';
import { usageCache } from '../services/admin/billing.service';

vi.mock('@codename/database');

describe('adminRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usageCache.clear();
  });

  it('sendAgentMessage is gated by usageGuard', async () => {
    // Seed the cache directly to simulate a capped tenant
    const monthYear = new Date();
    monthYear.setDate(1);
    const monthStr = monthYear.toISOString().split('T')[0];
    const cacheKey = `usage:tenant_capped:${monthStr}`;
    
    await usageCache.set(cacheKey, 2000, 300); // Set to limit (2000 cents)

    const caller = adminRouter.createCaller({});

    await expect(caller.sendAgentMessage({
      tenantId: 'tenant_capped',
      message: 'Hello'
    })).rejects.toThrow(/Cost Cap reached/);
  });

  it('sendAgentMessage works when not capped', async () => {
    // Mock DB response for when cache is empty
    vi.spyOn(DatabaseManager.prototype, 'queryInSchema').mockResolvedValue({
      rows: [{ ai_tokens_used: 0 }]
    } as any);

    const caller = adminRouter.createCaller({});

    const result = await caller.sendAgentMessage({
      tenantId: 'tenant_ok',
      message: 'Hello'
    });

    expect(result.response.content).toBeDefined();
  });

  it('getActionFeed includes real reviews from the database', async () => {
    // Mock DB response for the optimized UNION ALL query
    vi.spyOn(DatabaseManager.prototype, 'queryInSchema').mockImplementation((schema: string, query: string) => {
      if (query.includes('UNION ALL')) {
        return Promise.resolve({ 
          rows: [{
            id: crypto.randomUUID(),
            type: 'review',
            title: 'New 5-Star Review',
            description: '"Great service!" - Jane Reviewer',
            timestamp: new Date(),
            priority: 'medium',
            metadata: { initialDraft: 'Thanks!' }
          }] 
        });
      }
      return Promise.resolve({ rows: [] });
    });

    const caller = adminRouter.createCaller({});
    const result = await caller.getActionFeed({
      tenantId: 'tenant_feed_test',
      limit: 10
    });

    const reviewAction = result.items.find(item => item.type === 'review');
    expect(reviewAction).toBeDefined();
    expect(reviewAction?.title).toContain('New 5-Star Review');
    expect(reviewAction?.description).toContain('Jane Reviewer');
    expect(reviewAction?.metadata?.initialDraft).toBeDefined();
  });

  it('postReviewResponse updates the database', async () => {
    const spy = vi.spyOn(DatabaseManager.prototype, 'queryInSchema').mockResolvedValue({ rows: [] } as any);

    const caller = adminRouter.createCaller({});
    await caller.postReviewResponse({
      tenantId: 'tenant_post_test',
      reviewId: crypto.randomUUID(),
      response: 'Thank you for the kind words!'
    });

    expect(spy).toHaveBeenCalledWith('tenant_post_test', expect.stringContaining('UPDATE reviews'), expect.any(Array));
    expect(spy).toHaveBeenCalledWith('tenant_post_test', expect.stringContaining('SET response_content = $1'), expect.any(Array));
    spy.mockRestore();
  });
});

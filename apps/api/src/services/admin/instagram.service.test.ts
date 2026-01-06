import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstagramSyncService } from './instagram.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database');

describe('InstagramSyncService', () => {
  let db: DatabaseManager;
  let service: InstagramSyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    db = new DatabaseManager();
    service = new InstagramSyncService(db);
  });

  it('gets posts for a tenant', async () => {
    const mockRow = {
      external_id: 'ig_123',
      media_url: 'https://test.com/img.jpg',
      permalink: 'https://instagram.com/p/123',
      caption: 'Test caption',
      media_type: 'IMAGE',
      posted_at: new Date('2026-01-01T10:00:00Z')
    };

    vi.spyOn(db, 'queryInSchema').mockResolvedValue({ rows: [mockRow] } as any);

    const posts = await service.getPosts('tenant_test');

    expect(posts.length).toBe(1);
    expect(posts[0].externalId).toBe('ig_123');
    expect(posts[0].postedAt).toBe(mockRow.posted_at.toISOString());
  });

  it('syncs mock posts by inserting them into the database', async () => {
    const spy = vi.spyOn(db, 'queryInSchema')
      .mockResolvedValueOnce({ rows: [] } as any) // No previous sync
      .mockResolvedValue({ rows: [] } as any); // Insert operations

    const result = await service.syncLatestPosts('tenant_test');

    expect(result.syncedCount).toBeGreaterThan(0);
    expect(spy).toHaveBeenCalledWith(
      'tenant_test',
      expect.stringContaining('INSERT INTO instagram_posts'),
      expect.any(Array)
    );
  });

  it('handles duplicates via ON CONFLICT DO NOTHING', async () => {
    const spy = vi.spyOn(db, 'queryInSchema')
      .mockResolvedValueOnce({ rows: [] } as any) // No previous sync
      .mockResolvedValue({ rows: [] } as any);

    await service.syncLatestPosts('tenant_test');

    // Find the INSERT INTO instagram_posts call
    const insertCall = spy.mock.calls.find(call =>
      call[1].includes('INSERT INTO instagram_posts')
    );
    expect(insertCall?.[1]).toContain('ON CONFLICT (external_id) DO NOTHING');
  });

  it('skips sync if last sync was within 1 hour (throttling)', async () => {
    const recentSyncTime = new Date();
    const spy = vi.spyOn(db, 'queryInSchema').mockResolvedValue({
      rows: [{ last_synced_at: recentSyncTime }]
    } as any);

    const result = await service.syncLatestPosts('tenant_test');

    expect(result.skipped).toBe(true);
    expect(result.syncedCount).toBe(0);
    // Should only query for last sync, not insert anything
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('allows sync if last sync was over 1 hour ago', async () => {
    const oldSyncTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const spy = vi.spyOn(db, 'queryInSchema')
      .mockResolvedValueOnce({ rows: [{ last_synced_at: oldSyncTime }] } as any)
      .mockResolvedValue({ rows: [] } as any);

    const result = await service.syncLatestPosts('tenant_test');

    expect(result.skipped).toBeUndefined();
    expect(result.syncedCount).toBeGreaterThan(0);
  });
});

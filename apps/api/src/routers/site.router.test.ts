import { describe, it, expect, vi, beforeEach } from 'vitest';
import { siteRouter } from './site.router';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database', () => {
  const DatabaseManager = vi.fn();
  DatabaseManager.prototype.query = vi.fn();
  DatabaseManager.prototype.queryInSchema = vi.fn();
  DatabaseManager.prototype.initMasterTable = vi.fn();
  DatabaseManager.prototype.createTenantRecord = vi.fn();
  DatabaseManager.prototype.createTenantSchema = vi.fn();
  DatabaseManager.prototype.runMigrations = vi.fn();
  return { DatabaseManager };
});

describe('siteRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getInstagramFeed returns posts from the database', async () => {
    const mockQueryInSchema = vi.mocked(DatabaseManager.prototype.queryInSchema);
    const mockQuery = vi.mocked(DatabaseManager.prototype.query);

    // Mock tenant validation
    mockQuery.mockResolvedValueOnce({ rows: [{ schema_name: 'tenant_test' }] } as any);

    // Mock getPosts
    mockQueryInSchema.mockResolvedValue({
      rows: [{
        external_id: 'ig_789',
        media_url: 'https://test.com/img.jpg',
        permalink: 'https://instagram.com/p/789',
        caption: 'Cool!',
        media_type: 'IMAGE',
        posted_at: new Date()
      }]
    } as any);

    const caller = siteRouter.createCaller({});
    const result = await caller.getInstagramFeed({
      tenantId: 'tenant_test',
      limit: 9
    });

    expect(result.posts.length).toBe(1);
    expect(result.posts[0].externalId).toBe('ig_789');
  });

  it('returns empty array if tenant does not exist', async () => {
    const mockQuery = vi.mocked(DatabaseManager.prototype.query);
    mockQuery.mockResolvedValue({ rows: [] } as any); // Tenant not found

    const caller = siteRouter.createCaller({});
    const result = await caller.getInstagramFeed({
      tenantId: 'tenant_nonexistent',
      limit: 9
    });

    expect(result.posts).toEqual([]);
  });

  it('triggers sync if no posts found in database', async () => {
    const mockQueryInSchema = vi.mocked(DatabaseManager.prototype.queryInSchema);
    const mockQuery = vi.mocked(DatabaseManager.prototype.query);

    // Mock tenant validation
    mockQuery.mockResolvedValueOnce({ rows: [{ schema_name: 'tenant_test' }] } as any);

    mockQueryInSchema
      .mockResolvedValueOnce({ rows: [] } as any) // Initial getPosts (empty)
      .mockResolvedValueOnce({ rows: [] } as any) // Check last sync (no previous sync)
      .mockResolvedValue({ rows: [{
        external_id: 'ig_new',
        media_url: 'https://test.com/new.jpg',
        permalink: 'https://instagram.com/p/new',
        caption: 'Synced!',
        media_type: 'IMAGE',
        posted_at: new Date()
      }] } as any); // After sync, getPosts returns data

    const caller = siteRouter.createCaller({});
    const result = await caller.getInstagramFeed({
      tenantId: 'tenant_test'
    });

    expect(result.posts.length).toBe(1);
    expect(result.posts[0].externalId).toBe('ig_new');
  });
});

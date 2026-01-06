import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReputationService } from './reputation.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database');

describe('ReputationService', () => {
  let service: ReputationService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      queryInSchema: vi.fn(),
      pool: {
        query: vi.fn(),
      },
    };
    service = new ReputationService(mockDb as any);
  });

  it('ingests reviews from external source (mocked)', async () => {
    mockDb.queryInSchema.mockResolvedValueOnce({ rows: [] }); // No existing reviews
    mockDb.pool.query.mockResolvedValueOnce({ rows: [{ business_name: 'Elena\'s Braids' }] });
    mockDb.queryInSchema.mockResolvedValueOnce({ rows: [] }); // Insert check

    const result = await service.ingestReviews('tenant_test');
    expect(result.ingestedCount).toBe(2);
  });

  it('skips reviews that already exist', async () => {
    mockDb.queryInSchema.mockResolvedValueOnce({
      rows: [{ external_id: 'ext_123' }]
    });
    mockDb.pool.query.mockResolvedValueOnce({ rows: [{ business_name: 'Elena\'s Braids' }] });

    const mockReviews = [
      { externalId: 'ext_123', authorName: 'A', rating: 5, content: 'C', createdAt: '2026-01-01' }
    ];

    const result = await service.ingestReviews('tenant_test', mockReviews);
    expect(result.ingestedCount).toBe(0);
  });

  it('throws error when database query fails', async () => {
    mockDb.queryInSchema.mockRejectedValue(new Error('DB_FAILURE'));

    await expect(service.ingestReviews('tenant_fail'))
      .rejects.toThrow('DB_FAILURE');
  });
});

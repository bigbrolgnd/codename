import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReputationService } from './reputation.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database');

describe('ReputationService Ingestion Flow (Integration)', () => {
  let db: DatabaseManager;
  let service: ReputationService;

  beforeEach(() => {
    vi.clearAllMocks();
    db = new DatabaseManager();
    service = new ReputationService(db);
    
    // Mock tenant lookup
    (db as any).pool = {
      query: vi.fn().mockResolvedValue({ 
        rows: [{ business_name: "Amelia's Salon" }]
      })
    };
  });

  it('generates drafts containing the business name during ingestion', async () => {
    // Mock existing IDs (empty)
    vi.spyOn(db, 'queryInSchema').mockResolvedValueOnce({ rows: [] } as any);
    
    // Mock the insertion
    const insertSpy = vi.spyOn(db, 'queryInSchema').mockResolvedValueOnce({ rows: [] } as any);

    const mockReview = {
      externalId: 'ext_123',
      authorName: 'Dev',
      rating: 5,
      content: 'Excellent!',
      createdAt: new Date().toISOString()
    };

    await service.ingestReviews('tenant_test', [mockReview]);

    expect(insertSpy).toHaveBeenCalledTimes(2); // One for SELECT existing, one for INSERT
    const insertArgs = insertSpy.mock.calls[1];
    const draftContent = insertArgs[2][4]; // index 4 is response_content

    expect(draftContent).toContain("Amelia's Salon");
    expect(draftContent).toContain('Dev');
    expect(draftContent).toContain('5-star');
  });

  it('skips duplicates and doesn\'t generate drafts for them', async () => {
    // Mock existing IDs (id 'ext_duplicate' already exists)
    vi.spyOn(db, 'queryInSchema').mockResolvedValueOnce({ 
      rows: [{ external_id: 'ext_duplicate' }]
    } as any);
    
    const insertSpy = vi.spyOn(db, 'queryInSchema');

    const mockReview = {
      externalId: 'ext_duplicate',
      authorName: 'Ghost',
      rating: 5,
      content: 'I already exist',
      createdAt: new Date().toISOString()
    };

    const result = await service.ingestReviews('tenant_test', [mockReview]);

    expect(result.ingestedCount).toBe(0);
    expect(insertSpy).toHaveBeenCalledTimes(1); // Only the initial SELECT
  });
});

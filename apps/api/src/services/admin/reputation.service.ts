import { DatabaseManager } from '@codename/database';
import { ResponseGeneratorService } from './response-generator.service';

export const REVIEW_SOURCES = {
  GOOGLE: 'google',
  YELP: 'yelp',
  DIRECT: 'direct',
} as const;

export interface ExternalReview {
  externalId: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
}

export class ReputationService {
  private responseGenerator = new ResponseGeneratorService();

  constructor(private db: DatabaseManager) {}

  /**
   * Maps a star rating to a system priority
   */
  getPriorityForRating(rating: number): 'low' | 'medium' | 'high' {
    if (rating >= 5) return 'low';
    if (rating >= 4) return 'medium';
    return 'high';
  }

  /**
   * Ingests reviews from an external source.
   * In MVP, this uses high-quality mock data if no external reviews are provided.
   */
  async ingestReviews(tenantId: string, reviews?: ExternalReview[]) {
    const sourceReviews = reviews || this.generateMockReviews();
    let ingestedCount = 0;

    // 1. Get existing external IDs and business info
    const existingResult = await this.db.queryInSchema(tenantId, 
      `SELECT external_id FROM reviews WHERE source = 'google'`
    );
    const existingIds = new Set(existingResult.rows.map(r => r.external_id));

    const tenantResult = await this.db.query(
      `SELECT business_name FROM public.tenants WHERE schema_name = $1`,
      [tenantId]
    );
    const businessName = tenantResult.rows[0]?.business_name || 'Our Team';

    for (const review of sourceReviews) {
      if (existingIds.has(review.externalId)) continue;

      // 2. Generate AI Draft Reply with business context
      const responseDraft = await this.responseGenerator.generateReply(review, {
        name: businessName,
        tone: 'professional'
      });

      // 3. Insert new review with draft
      await this.db.queryInSchema(tenantId,
        `INSERT INTO reviews (author_name, rating, content, source, external_id, response_content, created_at)
         VALUES ($1, $2, $3, 'google', $4, $5, $6)`,
        [review.authorName, review.rating, review.content, review.externalId, responseDraft, review.createdAt]
      );
      ingestedCount++;
    }

    return { ingestedCount };
  }

  private generateMockReviews(): ExternalReview[] {
    return [
      {
        externalId: `ext_${Math.random().toString(36).substring(7)}`,
        authorName: 'Sarah Jenkins',
        rating: 5,
        content: 'Elena is literally a magician. My Goddess Braids are perfect and I was in and out in 4 hours!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 1 day ago
      },
      {
        externalId: `ext_${Math.random().toString(36).substring(7)}`,
        authorName: 'Marcus T.',
        rating: 4,
        content: 'Clean shop, great vibes. Booking was seamless. Only docking one star because parking was a bit tight.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      }
    ];
  }
}

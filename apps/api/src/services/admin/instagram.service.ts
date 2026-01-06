import { DatabaseManager } from '@codename/database';

export interface InstagramPost {
  externalId: string;
  mediaUrl: string;
  permalink: string;
  caption: string;
  mediaType: string;
  postedAt: string;
}

export class InstagramSyncService {
  constructor(private db: DatabaseManager) {}

  /**
   * Fetches latest posts from the database for a tenant.
   */
  async getPosts(tenantId: string, limit: number = 9): Promise<InstagramPost[]> {
    const result = await this.db.queryInSchema(tenantId,
      `SELECT external_id, media_url, permalink, caption, media_type, posted_at 
       FROM instagram_posts 
       ORDER BY posted_at DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => ({
      externalId: row.external_id,
      mediaUrl: row.media_url,
      permalink: row.permalink,
      caption: row.caption,
      mediaType: row.media_type,
      postedAt: row.posted_at.toISOString()
    }));
  }

  /**
   * Mock sync process for MVP. In production, this would call the Instagram Graph API.
   * Includes 1-hour cooldown to prevent excessive syncing.
   */
  async syncLatestPosts(tenantId: string): Promise<{ syncedCount: number; skipped?: boolean }> {
    // Check last sync time (1 hour cooldown)
    const lastSync = await this.db.queryInSchema(tenantId,
      `SELECT last_synced_at FROM instagram_sync_metadata ORDER BY last_synced_at DESC LIMIT 1`,
      []
    );

    if (lastSync.rows.length > 0) {
      const lastSyncTime = new Date(lastSync.rows[0].last_synced_at).getTime();
      const oneHourAgo = Date.now() - (60 * 60 * 1000);

      if (lastSyncTime > oneHourAgo) {
        return { syncedCount: 0, skipped: true }; // Skip sync, too recent
      }
    }

    const mockPosts = this.generateMockPosts();
    let syncedCount = 0;

    for (const post of mockPosts) {
      try {
        await this.db.queryInSchema(tenantId,
          `INSERT INTO instagram_posts (external_id, media_url, permalink, caption, media_type, posted_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (external_id) DO NOTHING`,
          [post.externalId, post.mediaUrl, post.permalink, post.caption, post.mediaType, post.postedAt]
        );
        syncedCount++;
      } catch (e) {
        // Structured logging would go here (e.g., Winston/Pino)
        console.error(`[InstagramSyncService] Failed to sync post ${post.externalId}:`, e);
      }
    }

    // Update sync metadata
    await this.db.queryInSchema(tenantId,
      `INSERT INTO instagram_sync_metadata (last_synced_at, sync_count)
       VALUES (NOW(), 1)`,
      []
    );

    return { syncedCount };
  }

  private generateMockPosts(): InstagramPost[] {
    const images = [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527799822367-a05eb58c28ee?auto=format&fit=crop&w=800&q=80',
    ];

    return images.map((url, i) => ({
      externalId: `ig_post_${i}_${Math.random().toString(36).substring(7)}`,
      mediaUrl: url,
      permalink: `https://instagram.com/p/mock_${i}`,
      caption: `Looking fresh! ✨ #beauty #style #${i}`,
      mediaType: 'IMAGE',
      postedAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString()
    }));
  }
}

/**
 * Integration Service
 * Handles parsing of user input (@handles, URLs) and fetching content from platforms
 */

import { DatabaseManager } from '@codename/database';
import { InstagramSyncService } from './admin/instagram.service';

export interface ParsedHandle {
  platform: string;
  handle?: string;
  url?: string;
  channelUrl?: string;
  profileUrl?: string;
}

export interface IntegrationContent {
  posts?: Array<{
    externalId: string;
    mediaUrl: string;
    permalink: string;
    caption: string;
    mediaType: string;
    postedAt: string;
  }>;
  videos?: Array<{
    id: string;
    title: string;
    thumbnail: string;
    url: string;
  }>;
  tweets?: Array<{
    id: string;
    text: string;
    createdAt: string;
  }>;
}

export class IntegrationService {
  private db: DatabaseManager;
  private instagramService: InstagramSyncService;

  constructor(db?: DatabaseManager) {
    this.db = db || new DatabaseManager();
    this.instagramService = new InstagramSyncService(this.db);
  }

  /**
   * Parse user input to detect platform and extract handle/URL
   * Supports:
   * - @username (Instagram/Twitter/TikTok)
   * - youtube.com URLs
   * - youtu.be URLs
   * - twitter.com / x.com URLs
   * - facebook.com URLs
   * - spotify.com URLs
   * - soundcloud.com URLs
   * - linkedin.com URLs
   */
  parseHandleInput(input: string): ParsedHandle {
    const trimmed = input.trim();

    // @username pattern (Instagram/Twitter/TikTok)
    if (trimmed.startsWith('@')) {
      const handle = trimmed.slice(1).trim();
      if (handle.length === 0) {
        throw new Error('Invalid handle: cannot be empty');
      }
      // Default to Instagram for @ handles (most common use case)
      return {
        platform: 'instagram',
        handle,
        profileUrl: `https://instagram.com/${handle}`,
      };
    }

    // YouTube URLs
    if (trimmed.includes('youtube.com/') || trimmed.includes('youtu.be/')) {
      if (trimmed.includes('/channel/') || trimmed.includes('/c/') || trimmed.includes('/@')) {
        // Channel URL - extract channel ID/handle
        const match = trimmed.match(/\/(?:channel\/|c\/|@)([^/?]+)/);
        return {
          platform: 'youtube',
          channelUrl: trimmed,
          handle: match ? match[1] : undefined,
        };
      }
      // Video URL - we can still extract channel info
      return {
        platform: 'youtube',
        url: trimmed,
      };
    }

    // Twitter / X URLs
    if (trimmed.includes('twitter.com/') || trimmed.includes('x.com/')) {
      const match = trimmed.match(/(?:twitter\.com|x\.com)\/([^/?]+)/);
      return {
        platform: 'twitter',
        handle: match ? match[1] : undefined,
        url: trimmed,
        profileUrl: trimmed.split('?')[0],
      };
    }

    // Facebook URLs
    if (trimmed.includes('facebook.com/') || trimmed.includes('fb.com/')) {
      return {
        platform: 'facebook',
        url: trimmed,
        profileUrl: trimmed.split('?')[0],
      };
    }

    // Spotify URLs
    if (trimmed.includes('spotify.com/')) {
      if (trimmed.includes('/artist/')) {
        return {
          platform: 'spotify',
          url: trimmed,
        };
      }
      if (trimmed.includes('/show/') || trimmed.includes('/episode/')) {
        return {
          platform: 'spotify',
          url: trimmed,
        };
      }
    }

    // SoundCloud URLs
    if (trimmed.includes('soundcloud.com/')) {
      return {
        platform: 'soundcloud',
        url: trimmed,
        handle: trimmed.split('soundcloud.com/')[1]?.split('/')[0],
      };
    }

    // TikTok URLs
    if (trimmed.includes('tiktok.com/')) {
      const match = trimmed.match(/@([^/?]+)/);
      return {
        platform: 'tiktok',
        handle: match ? match[1] : undefined,
        url: trimmed,
        profileUrl: trimmed.split('?')[0],
      };
    }

    // LinkedIn URLs
    if (trimmed.includes('linkedin.com/')) {
      return {
        platform: 'linkedin',
        url: trimmed,
        profileUrl: trimmed.split('?')[0],
      };
    }

    // Default: treat as Instagram handle if no special pattern
    if (!trimmed.includes('/') && !trimmed.includes('.')) {
      return {
        platform: 'instagram',
        handle: trimmed,
        profileUrl: `https://instagram.com/${trimmed}`,
      };
    }

    throw new Error(`Could not detect platform from input: ${input}`);
  }

  /**
   * Fetch content from a platform based on parsed input
   */
  async fetchContent(parsed: ParsedHandle, tenantId: string): Promise<IntegrationContent> {
    switch (parsed.platform) {
      case 'instagram':
        return await this.fetchInstagramContent(parsed, tenantId);

      case 'youtube':
        return await this.fetchYouTubeContent(parsed);

      case 'twitter':
        return await this.fetchTwitterContent(parsed);

      default:
        // For unsupported platforms, return empty content
        return {};
    }
  }

  /**
   * Fetch Instagram posts using existing InstagramSyncService
   */
  private async fetchInstagramContent(parsed: ParsedHandle, tenantId: string): Promise<IntegrationContent> {
    try {
      // The Instagram service works with tenant_id
      // We need to sync first, then get posts
      await this.instagramService.syncLatestPosts(tenantId);

      const posts = await this.instagramService.getPosts(tenantId, 9);

      return {
        posts: posts.map((post: any) => ({
          externalId: post.externalId,
          mediaUrl: post.mediaUrl,
          permalink: post.permalink,
          caption: post.caption?.substring(0, 200) + '...', // Truncate long captions
          mediaType: post.mediaType,
          postedAt: post.postedAt,
        })),
      };
    } catch (error) {
      console.error('[IntegrationService] Failed to fetch Instagram content:', error);
      return { posts: [] };
    }
  }

  /**
   * Fetch YouTube videos (placeholder for future implementation)
   */
  private async fetchYouTubeContent(parsed: ParsedHandle): Promise<IntegrationContent> {
    // TODO: Implement YouTube Data API integration
    // For now, return empty
    return { videos: [] };
  }

  /**
   * Fetch Twitter tweets (placeholder for future implementation)
   */
  private async fetchTwitterContent(parsed: ParsedHandle): Promise<IntegrationContent> {
    // TODO: Implement Twitter API v2 integration
    // For now, return empty
    return { tweets: [] };
  }

  /**
   * Create integration record in database
   */
  async createIntegration(siteId: string, parsed: ParsedHandle, tenantId: string): Promise<string> {
    const result = await this.db.queryInSchema(
      'public',
      `INSERT INTO site_integrations (site_id, integration_type, credentials, auto_sync, sync_status)
       VALUES ($1, $2, $3, true, 'pending')
       RETURNING id`,
      [siteId, parsed.platform, JSON.stringify(parsed)]
    );

    return result.rows[0].id;
  }

  /**
   * Update integration with fetched content
   */
  async updateIntegrationContent(
    integrationId: string,
    content: IntegrationContent,
    syncStatus: string = 'active'
  ): Promise<void> {
    await this.db.query(
      `UPDATE site_integrations
       SET cached_content = $1,
           sync_status = $2,
           last_sync_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(content), syncStatus, integrationId]
    );
  }

  /**
   * Set integration error status
   */
  async setIntegrationError(integrationId: string, errorMessage: string): Promise<void> {
    await this.db.query(
      `UPDATE site_integrations
       SET sync_status = 'error',
           last_error = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [errorMessage, integrationId]
    );
  }

  /**
   * Process integration input: parse, fetch content, create records
   */
  async processIntegrationInput(
    siteId: string,
    input: string,
    tenantId: string
  ): Promise<{
    parsed: ParsedHandle;
    integrationId: string;
    content: IntegrationContent;
  }> {
    // Step 1: Parse the input
    const parsed = this.parseHandleInput(input);

    // Step 2: Create integration record
    const integrationId = await this.createIntegration(siteId, parsed, tenantId);

    // Step 3: Fetch content from platform
    try {
      const content = await this.fetchContent(parsed, tenantId);

      // Step 4: Update integration with cached content
      await this.updateIntegrationContent(integrationId, content, 'active');

      return { parsed, integrationId, content };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.setIntegrationError(integrationId, errorMessage);
      throw error;
    }
  }

  /**
   * Get zone ID for a site by zone type
   */
  async getZoneForSite(siteId: string, zoneType: string): Promise<string | null> {
    const result = await this.db.query(
      `SELECT id FROM zones WHERE site_id = $1 AND zone_type = $2 LIMIT 1`,
      [siteId, zoneType]
    );

    return result.rows[0]?.id || null;
  }

  /**
   * Create a component linked to an integration
   */
  async createIntegrationComponent(
    siteId: string,
    integrationId: string,
    parsed: ParsedHandle,
    zoneType: string
  ): Promise<string | null> {
    // Get or create the target zone
    let zoneId = await this.getZoneForSite(siteId, zoneType);

    if (!zoneId) {
      // Create the zone if it doesn't exist
      const zoneResult = await this.db.query(
        `INSERT INTO zones (site_id, zone_type, position)
         VALUES ($1, $2, 0)
         RETURNING id`,
        [siteId, zoneType]
      );
      zoneId = zoneResult.rows[0].id;
    }

    // Determine component type based on platform
    const componentMap: Record<string, { componentId: string; props: Record<string, any> }> = {
      instagram: {
        componentId: 'content-gallery',
        props: {
          title: 'Latest from Instagram',
          gridLayout: 'masonry',
          showCaptions: true,
        },
      },
      youtube: {
        componentId: 'content-gallery',
        props: {
          title: 'Videos',
          gridLayout: 'grid',
          showThumbnails: true,
        },
      },
      twitter: {
        componentId: 'trust-quotes',
        props: {
          title: 'Latest Tweets',
          layout: 'carousel',
        },
      },
    };

    const config = componentMap[parsed.platform] || componentMap.instagram;

    // Create the component
    const result = await this.db.query(
      `INSERT INTO components (zone_id, component_type, component_id, props, integration_refs, position)
       VALUES ($1, 'organism', $2, $3, $4, 0)
       RETURNING id`,
      [zoneId, config.componentId, JSON.stringify(config.props), JSON.stringify({ [parsed.platform]: integrationId })]
    );

    return result.rows[0]?.id || null;
  }
}

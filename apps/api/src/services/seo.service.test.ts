import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SEOService } from './seo.service';
import { DatabaseManager } from '@codename/database';

// Mock DatabaseManager
vi.mock('@codename/database', () => ({
  DatabaseManager: vi.fn(),
}));

describe('SEOService', () => {
  let seoService: SEOService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      query: vi.fn(),
    };
    seoService = new SEOService(mockDb as unknown as DatabaseManager);
  });

  describe('generateMetaTags', () => {
    it('generates basic SEO meta tags', async () => {
      const tenantId = 'tenant_test';
      const pageData = {
        title: 'Test Business | Services',
        description: 'Quality services for your needs',
        url: '/about',
        type: 'website' as const,
      };

      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{
          id: tenantId,
          business_name: 'Test Business',
          business_type: 'salon',
          description: 'A great salon',
          domain: null,
        }],
      });

      const tags = await seoService.generateMetaTags(tenantId, pageData);

      expect(tags).toContainEqual({ name: 'title', content: 'Test Business | Services' });
      expect(tags).toContainEqual({ name: 'description', content: 'Quality services for your needs' });
      expect(tags).toContainEqual({ name: 'keywords', content: '' });
      expect(tags).toContainEqual({ name: 'canonical', content: 'https://tenant_test.znapsite.com/about' });
    });

    it('generates Open Graph tags', async () => {
      const pageData = {
        title: 'Test Page',
        description: 'Test description',
        url: '/test',
        type: 'website' as const,
      };

      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{ business_name: 'Test Business', domain: null }],
      });

      const tags = await seoService.generateMetaTags('tenant_test', pageData);

      expect(tags).toContainEqual({ property: 'og:type', content: 'website' });
      expect(tags).toContainEqual({ property: 'og:title', content: 'Test Page' });
      expect(tags).toContainEqual({ property: 'og:description', content: 'Test description' });
      expect(tags).toContainEqual({ property: 'og:url', content: 'https://tenant_test.znapsite.com/test' });
      expect(tags).toContainEqual({ property: 'og:site_name', content: 'Test Business' });
    });

    it('generates Twitter Card tags', async () => {
      const pageData = {
        title: 'Test Page',
        description: 'Test description',
        url: '/test',
      };

      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{ business_name: 'Test Business', domain: null }],
      });

      const tags = await seoService.generateMetaTags('tenant_test', pageData);

      expect(tags).toContainEqual({ name: 'twitter:card', content: 'summary_large_image' });
      expect(tags).toContainEqual({ name: 'twitter:title', content: 'Test Page' });
      expect(tags).toContainEqual({ name: 'twitter:description', content: 'Test description' });
    });

    it('includes image tags when imageUrl is provided', async () => {
      const pageData = {
        title: 'Test Page',
        description: 'Test description',
        url: '/test',
        imageUrl: 'https://example.com/image.jpg',
      };

      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{ business_name: 'Test Business', domain: null }],
      });

      const tags = await seoService.generateMetaTags('tenant_test', pageData);

      expect(tags).toContainEqual({ property: 'og:image', content: 'https://example.com/image.jpg' });
      expect(tags).toContainEqual({ name: 'twitter:image', content: 'https://example.com/image.jpg' });
    });

    it('generates article-specific tags for article type', async () => {
      const pageData = {
        title: 'Test Article',
        description: 'Article content',
        url: '/blog/test',
        type: 'article' as const,
        publishedAt: '2026-01-10T00:00:00Z',
        modifiedAt: '2026-01-10T12:00:00Z',
        author: 'John Doe',
      };

      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{ business_name: 'Test Business', domain: null }],
      });

      const tags = await seoService.generateMetaTags('tenant_test', pageData);

      expect(tags).toContainEqual({ property: 'article:published_time', content: '2026-01-10T00:00:00Z' });
      expect(tags).toContainEqual({ property: 'article:modified_time', content: '2026-01-10T12:00:00Z' });
      expect(tags).toContainEqual({ property: 'article:author', content: 'John Doe' });
    });

    it('uses custom domain when available', async () => {
      const pageData = {
        title: 'Test Page',
        description: 'Test',
        url: '/test',
      };

      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{
          business_name: 'Test Business',
          domain: 'https://custom.com',
        }],
      });

      const tags = await seoService.generateMetaTags('tenant_test', pageData);

      expect(tags).toContainEqual({ name: 'canonical', content: 'https://custom.com/test' });
      expect(tags).toContainEqual({ property: 'og:url', content: 'https://custom.com/test' });
    });

    it('handles keywords array', async () => {
      const pageData = {
        title: 'Test Page',
        description: 'Test',
        url: '/test',
        keywords: ['salon', 'hair', 'beauty'],
      };

      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{ business_name: 'Test Business', domain: null }],
      });

      const tags = await seoService.generateMetaTags('tenant_test', pageData);

      expect(tags).toContainEqual({ name: 'keywords', content: 'salon, hair, beauty' });
    });
  });

  describe('generateStructuredData', () => {
    it('generates LocalBusiness schema for salon', async () => {
      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{
          business_name: 'Test Salon',
          business_type: 'salon',
          description: 'A great salon',
          domain: null,
          logo_url: 'https://example.com/logo.png',
          phone: '555-1234',
          email: 'test@example.com',
        }],
      });

      const pageData = {
        title: 'Test Page',
        description: 'Test',
        url: '/test',
      };

      const schema = await seoService.generateStructuredData('tenant_test', pageData);

      expect(schema['@type']).toBe('HairSalon');
      expect(schema.name).toBe('Test Salon');
      expect(schema.description).toBe('A great salon');
      expect(schema.url).toBe('https://tenant_test.znapsite.com');
      expect(schema.logo).toBe('https://example.com/logo.png');
      expect(schema.telephone).toBe('555-1234');
      expect(schema.email).toBe('test@example.com');
    });

    it('includes address when available', async () => {
      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{
          business_name: 'Test Business',
          business_type: 'salon',
          description: 'Test',
          domain: null,
          address: JSON.stringify({
            street: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62701',
            country: 'USA',
          }),
        }],
      });

      const schema = await seoService.generateStructuredData('tenant_test', {
        title: 'Test',
        description: 'Test',
        url: '/test',
      });

      expect(schema.address).toEqual({
        '@type': 'PostalAddress',
        streetAddress: '123 Main St',
        addressLocality: 'Springfield',
        addressRegion: 'IL',
        postalCode: '62701',
        addressCountry: 'USA',
      });
    });

    it('includes social links', async () => {
      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{
          business_name: 'Test Business',
          business_type: 'salon',
          description: 'Test',
          domain: null,
          social_links: JSON.stringify({
            instagram: 'https://instagram.com/test',
            facebook: 'https://facebook.com/test',
            twitter: 'https://twitter.com/test',
          }),
        }],
      });

      const schema = await seoService.generateStructuredData('tenant_test', {
        title: 'Test',
        description: 'Test',
        url: '/test',
      });

      expect(schema.sameAs).toEqual([
        'https://instagram.com/test',
        'https://facebook.com/test',
        'https://twitter.com/test',
      ]);
    });

    it('generates Article schema for article type', async () => {
      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{
          business_name: 'Test Business',
          business_type: 'blog',
          description: 'Test',
          domain: null,
          logo_url: 'https://example.com/logo.png',
        }],
      });

      const schema = await seoService.generateStructuredData('tenant_test', {
        title: 'Test Article',
        description: 'Article content',
        url: '/blog/test',
        type: 'article',
        publishedAt: '2026-01-10T00:00:00Z',
        modifiedAt: '2026-01-10T12:00:00Z',
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(schema['@type']).toBe('Article');
      expect(schema.headline).toBe('Test Article');
      expect(schema.image).toBe('https://example.com/image.jpg');
      expect(schema.datePublished).toBe('2026-01-10T00:00:00Z');
      expect(schema.author).toEqual({
        '@type': 'Organization',
        name: 'Test Business',
      });
    });

    it('maps business types to correct Schema.org types', async () => {
      const businessTypes = [
        ['salon', 'HairSalon'],
        ['restaurant', 'Restaurant'],
        ['retail', 'Store'],
        ['podcaster', 'PodcastSeries'],
        ['influencer', 'Person'],
        ['unknown', 'LocalBusiness'],
      ];

      for (const [input, expected] of businessTypes) {
        mockDb.query = vi.fn().mockResolvedValue({
          rows: [{
            business_name: 'Test',
            business_type: input,
            description: 'Test',
            domain: null,
          }],
        });

        const schema = await seoService.generateStructuredData('tenant_test', {
          title: 'Test',
          description: 'Test',
          url: '/test',
        });

        expect(schema['@type']).toBe(expected);
      }
    });
  });

  describe('generateSitemap', () => {
    it('generates valid sitemap XML', async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{
            business_name: 'Test Business',
            business_type: 'salon',
            description: 'Test',
            domain: null,
          }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: '1',
              name: 'Home',
              path: '/',
              page_type: 'home',
              is_active: true,
              updated_at: '2026-01-10T00:00:00Z',
            },
            {
              id: '2',
              name: 'About',
              path: '/about',
              page_type: 'about',
              is_active: true,
              updated_at: '2026-01-09T00:00:00Z',
            },
          ],
        });

      const sitemap = await seoService.generateSitemap('tenant_test');

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(sitemap).toContain('<loc>https://tenant_test.znapsite.com/</loc>');
      expect(sitemap).toContain('<loc>https://tenant_test.znapsite.com/about</loc>');
      expect(sitemap).toContain('<priority>1.0</priority>');
      expect(sitemap).toContain('<priority>0.6</priority>');
    });

    it('excludes inactive pages from sitemap', async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ business_name: 'Test', business_type: 'salon', description: 'Test', domain: null }],
        })
        .mockResolvedValueOnce({
          rows: [
            { id: '1', name: 'Home', path: '/', page_type: 'home', is_active: true, updated_at: '2026-01-10T00:00:00Z' },
            { id: '2', name: 'Draft', path: '/draft', page_type: 'blog', is_active: false, updated_at: '2026-01-10T00:00:00Z' },
          ],
        });

      const sitemap = await seoService.generateSitemap('tenant_test');

      expect(sitemap).toContain('https://tenant_test.znapsite.com/');
      expect(sitemap).not.toContain('https://tenant_test.znapsite.com/draft');
    });
  });

  describe('generateRobotsTxt', () => {
    it('generates robots.txt with sitemap reference', async () => {
      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{
          business_name: 'Test Business',
          business_type: 'salon',
          description: 'Test',
          domain: null,
        }],
      });

      const robots = await seoService.generateRobotsTxt('tenant_test');

      expect(robots).toContain('User-agent: *');
      expect(robots).toContain('Allow: /');
      expect(robots).toContain('Sitemap: https://tenant_test.znapsite.com/sitemap.xml');
      expect(robots).toContain('Disallow: /admin/');
      expect(robots).toContain('Disallow: /api/');
    });

    it('uses custom domain in sitemap URL', async () => {
      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{
          business_name: 'Test Business',
          business_type: 'salon',
          description: 'Test',
          domain: 'https://custom.com',
        }],
      });

      const robots = await seoService.generateRobotsTxt('tenant_test');

      expect(robots).toContain('Sitemap: https://custom.com/sitemap.xml');
    });
  });

  describe('updatePageTitle', () => {
    it('updates page title in database', async () => {
      mockDb.query = vi.fn().mockResolvedValue({ rowCount: 1 });

      await seoService.updatePageTitle('tenant_test', 'page_123', 'New Title');

      expect(mockDb.query).toHaveBeenCalledWith(
        'tenant_test',
        expect.stringContaining('UPDATE components'),
        ['"New Title"', 'page_123', 'tenant_test']
      );
    });
  });

  describe('addOpenGraphTags', () => {
    it('adds OG image to page', async () => {
      mockDb.query = vi.fn().mockResolvedValue({ rowCount: 1 });

      const imageData = {
        url: 'https://example.com/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Open Graph image',
      };

      await seoService.addOpenGraphTags('tenant_test', 'page_123', imageData);

      expect(mockDb.query).toHaveBeenCalledWith(
        'tenant_test',
        expect.stringContaining('UPDATE components'),
        [JSON.stringify(imageData), 'page_123', 'tenant_test']
      );
    });
  });

  describe('addTwitterCardTags', () => {
    it('adds Twitter card data to page', async () => {
      mockDb.query = vi.fn().mockResolvedValue({ rowCount: 1 });

      const cardData = {
        title: 'Test Card',
        description: 'Test description',
        image: 'https://example.com/card.jpg',
        url: 'https://example.com',
      };

      await seoService.addTwitterCardTags('tenant_test', 'page_123', cardData);

      expect(mockDb.query).toHaveBeenCalledWith(
        'tenant_test',
        expect.stringContaining('UPDATE components'),
        [JSON.stringify(cardData), 'page_123', 'tenant_test']
      );
    });
  });

  describe('edge cases', () => {
    it('throws error when tenant not found', async () => {
      mockDb.query = vi.fn().mockResolvedValue({ rows: [] });

      await expect(
        seoService.generateMetaTags('nonexistent', {
          title: 'Test',
          description: 'Test',
          url: '/test',
        })
      ).rejects.toThrow('Tenant not found: nonexistent');
    });

    it('handles missing tenant data gracefully', async () => {
      mockDb.query = vi.fn().mockResolvedValue({
        rows: [{
          id: 'tenant_test',
          business_name: null,
          business_type: null,
          description: null,
          domain: null,
        }],
      });

      const schema = await seoService.generateStructuredData('tenant_test', {
        title: 'Test',
        description: 'Test',
        url: '/test',
      });

      expect(schema.name).toBe('My Site');
      expect(schema['@type']).toBe('LocalBusiness');
    });

    it('handles empty pages array for sitemap', async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ business_name: 'Test', business_type: 'salon', description: 'Test', domain: null }],
        })
        .mockResolvedValueOnce({ rows: [] });

      const sitemap = await seoService.generateSitemap('tenant_test');

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<urlset');
    });
  });
});

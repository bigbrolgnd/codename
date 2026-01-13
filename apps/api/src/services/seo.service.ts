/**
 * SEO Service
 *
 * Generates SEO-friendly meta tags, structured data, and sitemaps for tenant sites.
 * Helps improve search engine visibility for free tier users.
 */

import { DatabaseManager } from '@codename/database';

// Types
export interface PageData {
  title: string;
  description: string;
  keywords?: string[];
  url: string;
  imageUrl?: string;
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
}

export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

export interface JSONLD {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export interface ImageData {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface CardData {
  title: string;
  description: string;
  image?: string;
  url: string;
}

export interface TenantSiteData {
  tenantId: string;
  businessName: string;
  businessType: string;
  description: string;
  domain?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  social?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export class SEOService {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Generate meta tags for a page
   */
  async generateMetaTags(tenantId: string, pageData: PageData): Promise<MetaTag[]> {
    const tenant = await this.getTenantData(tenantId);
    const siteUrl = tenant.domain || `https://${tenantId}.znapsite.com`;

    const tags: MetaTag[] = [
      // Basic SEO
      { name: 'title', content: pageData.title },
      { name: 'description', content: pageData.description },
      { name: 'keywords', content: (pageData.keywords || []).join(', ') },

      // Canonical URL
      { name: 'canonical', content: `${siteUrl}${pageData.url}` },

      // Open Graph
      { property: 'og:type', content: pageData.type || 'website' },
      { property: 'og:title', content: pageData.title },
      { property: 'og:description', content: pageData.description },
      { property: 'og:url', content: `${siteUrl}${pageData.url}` },
      { property: 'og:site_name', content: tenant.businessName },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: pageData.title },
      { name: 'twitter:description', content: pageData.description },
    ];

    // Add image tags if provided
    if (pageData.imageUrl) {
      tags.push(
        { property: 'og:image', content: pageData.imageUrl },
        { name: 'twitter:image', content: pageData.imageUrl }
      );
    }

    // Add article-specific tags
    if (pageData.type === 'article') {
      if (pageData.publishedAt) {
        tags.push({ property: 'article:published_time', content: pageData.publishedAt });
      }
      if (pageData.modifiedAt) {
        tags.push({ property: 'article:modified_time', content: pageData.modifiedAt });
      }
      if (pageData.author) {
        tags.push({ property: 'article:author', content: pageData.author });
      }
    }

    return tags;
  }

  /**
   * Generate JSON-LD structured data
   */
  async generateStructuredData(tenantId: string, pageData: PageData): Promise<JSONLD> {
    const tenant = await this.getTenantData(tenantId);
    const siteUrl = tenant.domain || `https://${tenantId}.znapsite.com`;

    // Base LocalBusiness schema
    const schema: JSONLD = {
      '@context': 'https://schema.org',
      '@type': this.getBusinessSchemaType(tenant.businessType),
      name: tenant.businessName,
      description: tenant.description,
      url: siteUrl,
    };

    // Add logo if available
    if (tenant.logo) {
      schema.logo = tenant.logo;
      schema.image = tenant.logo;
    }

    // Add contact info
    if (tenant.phone) {
      schema.telephone = tenant.phone;
    }
    if (tenant.email) {
      schema.email = tenant.email;
    }

    // Add address if available
    if (tenant.address) {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: tenant.address.street,
        addressLocality: tenant.address.city,
        addressRegion: tenant.address.state,
        postalCode: tenant.address.postalCode,
        addressCountry: tenant.address.country,
      };
    }

    // Add social links
    if (tenant.social) {
      const sameAs = [];
      if (tenant.social.instagram) sameAs.push(tenant.social.instagram);
      if (tenant.social.facebook) sameAs.push(tenant.social.facebook);
      if (tenant.social.twitter) sameAs.push(tenant.social.twitter);
      if (tenant.social.linkedin) sameAs.push(tenant.social.linkedin);
      if (sameAs.length > 0) {
        schema.sameAs = sameAs;
      }
    }

    // Add article schema for blog posts
    if (pageData.type === 'article') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: pageData.title,
        description: pageData.description,
        image: pageData.imageUrl || tenant.logo,
        datePublished: pageData.publishedAt,
        dateModified: pageData.modifiedAt,
        author: {
          '@type': 'Organization',
          name: tenant.businessName,
        },
        publisher: {
          '@type': 'Organization',
          name: tenant.businessName,
          logo: tenant.logo,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${siteUrl}${pageData.url}`,
        },
      };
    }

    return schema;
  }

  /**
   * Generate sitemap XML
   */
  async generateSitemap(tenantId: string): Promise<string> {
    const tenant = await this.getTenantData(tenantId);
    const siteUrl = tenant.domain || `https://${tenantId}.znapsite.com`;

    // Get all pages for tenant
    const pages = await this.getTenantPages(tenantId);

    const urlset = pages
      .filter(page => page.is_active)
      .map(page => {
        const lastmod = page.updated_at ? page.updated_at.split('T')[0] : new Date().toISOString().split('T')[0];
        const changefreq = this.getChangeFrequency(page.page_type);
        const priority = this.getPriority(page.page_type);

        return `  <url>
    <loc>${siteUrl}${page.path || '/'}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
  }

  /**
   * Generate robots.txt
   */
  async generateRobotsTxt(tenantId: string): Promise<string> {
    const tenant = await this.getTenantData(tenantId);
    const siteUrl = tenant.domain || `https://${tenantId}.znapsite.com`;

    return `# Robots.txt for ${tenant.businessName}
User-agent: *
Allow: /

# Sitemap
Sitemap: ${siteUrl}/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# Crawl delay (optional, respectful crawling)
Crawl-delay: 1`;
  }

  /**
   * Update page title for SEO
   */
  async updatePageTitle(tenantId: string, pageId: string, title: string): Promise<void> {
    const query = `
      UPDATE components
      SET content = jsonb_set(
        content,
        '{props,seoTitle}',
        $1
      ),
      updated_at = NOW()
      WHERE id = $2
      AND tenant_id = $3
    `;

    await this.db.query(query, [JSON.stringify(title), pageId, tenantId]);
  }

  /**
   * Add Open Graph tags
   */
  async addOpenGraphTags(tenantId: string, pageId: string, imageData: ImageData): Promise<void> {
    const query = `
      UPDATE components
      SET content = jsonb_set(
        content,
        '{props,ogImage}',
        $1
      ),
      updated_at = NOW()
      WHERE id = $2
      AND tenant_id = $3
    `;

    await this.db.query(query, [JSON.stringify(imageData), pageId, tenantId]);
  }

  /**
   * Add Twitter Card tags
   */
  async addTwitterCardTags(tenantId: string, pageId: string, cardData: CardData): Promise<void> {
    const query = `
      UPDATE components
      SET content = jsonb_set(
        content,
        '{props,twitterCard}',
        $1
      ),
      updated_at = NOW()
      WHERE id = $2
      AND tenant_id = $3
    `;

    await this.db.query(query, [JSON.stringify(cardData), pageId, tenantId]);
  }

  /**
   * Get tenant data for SEO
   */
  private async getTenantData(tenantId: string): Promise<TenantSiteData> {
    const query = `
      SELECT
        id,
        business_name,
        business_type,
        description,
        domain,
        logo_url,
        phone,
        email,
        address,
        social_links
      FROM tenants
      WHERE id = $1
    `;

    const result = await this.db.query(query, [tenantId]);

    if (!result.rows[0]) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const row = result.rows[0];

    return {
      tenantId,
      businessName: row.business_name || 'My Site',
      businessType: row.business_type || 'LocalBusiness',
      description: row.description || '',
      domain: row.domain,
      logo: row.logo_url,
      phone: row.phone,
      email: row.email,
      address: row.address ? JSON.parse(row.address) : undefined,
      social: row.social_links ? JSON.parse(row.social_links) : undefined,
    };
  }

  /**
   * Get all pages for tenant sitemap
   */
  private async getTenantPages(tenantId: string): Promise<any[]> {
    const query = `
      SELECT
        id,
        name,
        path,
        page_type,
        is_active,
        created_at,
        updated_at
      FROM zones
      WHERE tenant_id = $1
      ORDER BY created_at ASC
    `;

    const result = await this.db.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Map business type to Schema.org type
   */
  private getBusinessSchemaType(businessType: string): string {
    const typeMap: Record<string, string> = {
      'salon': 'HairSalon',
      'restaurant': 'Restaurant',
      'retail': 'Store',
      'professional': 'ProfessionalService',
      'health': 'HealthAndBeautyBusiness',
      'fitness': 'SportsActivityLocation',
      'creative': 'VisualArtist',
      'podcaster': 'PodcastSeries',
      'influencer': 'Person',
      'default': 'LocalBusiness',
    };

    return typeMap[businessType.toLowerCase()] || typeMap.default;
  }

  /**
   * Get change frequency for sitemap
   */
  private getChangeFrequency(pageType: string): string {
    const freqMap: Record<string, string> = {
      'home': 'daily',
      'blog': 'weekly',
      'about': 'monthly',
      'contact': 'monthly',
      'services': 'weekly',
      'default': 'monthly',
    };

    return freqMap[pageType.toLowerCase()] || freqMap.default;
  }

  /**
   * Get priority for sitemap
   */
  private getPriority(pageType: string): string {
    const priorityMap: Record<string, string> = {
      'home': '1.0',
      'services': '0.8',
      'about': '0.6',
      'blog': '0.7',
      'contact': '0.5',
      'default': '0.5',
    };

    return priorityMap[pageType.toLowerCase()] || priorityMap.default;
  }
}

export default SEOService;

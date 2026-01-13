/**
 * GLM Vision Service
 * Zhipu AI (GLM) Vision API integration for business data extraction
 * Extracts business context from logos, photos, and price lists
 */

import { Readable } from 'stream';

interface ExtractionResult {
  id: string;
  data: Record<string, any>;
  confidence: number;
  warnings: Array<{ type: string; message: string }>;
  processingTimeMs: number;
}

interface ServiceExtraction {
  name: string;
  price: number;
  duration?: number;
  category?: string;
  description?: string;
}

interface BusinessContext {
  businessName?: string;
  businessType?: string;
  colors?: string[];
  vibe?: string;
  services?: ServiceExtraction[];
  description?: string;
  tagline?: string;
}

const GLM_API_KEY = process.env.GLM_API_KEY || '';
const GLM_API_BASE = process.env.GLM_API_BASE || 'https://open.bigmodel.cn/api/paas/v4/';
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4v-plus';

export class GLMVisionService {
  private headers: Record<string, string>;

  constructor() {
    this.headers = {
      'Authorization': `Bearer ${GLM_API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Extract business information from a logo image
   * Extracts: colors, business type indicators, style/vibe
   */
  async extractFromLogo(imageUrl: string): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      const response = await this.callGLMVision(
        imageUrl,
        `You are analyzing a business logo. Extract the following information:
1. Business name (if visible in text)
2. Primary colors (hex codes, top 3 most dominant)
3. Industry/business type (salon, restaurant, tech, etc.)
4. Style/vibe (modern, vintage, playful, professional, luxury, etc.)

Return ONLY valid JSON in this format:
{
  "businessName": "Name or null",
  "colors": ["#hex1", "#hex2", "#hex3"],
  "businessType": "type",
  "vibe": "style descriptor"
}

If you cannot determine a field, return null for that field.`
      );

      const parsed = JSON.parse(response);
      const processingTimeMs = Date.now() - startTime;

      return {
        id: crypto.randomUUID(),
        data: {
          businessName: parsed.businessName,
          colors: parsed.colors || [],
          businessType: parsed.businessType,
          vibe: parsed.vibe,
        },
        confidence: 85,
        warnings: [],
        processingTimeMs,
      };
    } catch (error: any) {
      console.error('[GLMVisionService] Error extracting from logo:', error.message);
      return this.errorResult(startTime, error.message);
    }
  }

  /**
   * Extract business information from photos
   * Extracts: business type, services, atmosphere/vibe, content quality
   */
  async extractFromPhotos(imageUrl: string): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      const response = await this.callGLMVision(
        imageUrl,
        `You are analyzing a business photo (interior, work being done, or products).
Extract the following information:
1. Business type (salon, restaurant, retail, office, etc.)
2. Services visible (what is being offered/done)
3. Atmosphere/vibe (luxury, casual, professional, creative, etc.)
4. Content quality assessment (resolution, lighting, composition)

Return ONLY valid JSON in this format:
{
  "businessType": "type",
  "services": ["service1", "service2"],
  "atmosphere": "atmosphere descriptor",
  "quality": "high/medium/low"
}`
      );

      const parsed = JSON.parse(response);
      const processingTimeMs = Date.now() - startTime;

      return {
        id: crypto.randomUUID(),
        data: {
          businessType: parsed.businessType,
          services: parsed.services || [],
          vibe: parsed.atmosphere,
          quality: parsed.quality,
        },
        confidence: 80,
        warnings: [],
        processingTimeMs,
      };
    } catch (error: any) {
      console.error('[GLMVisionService] Error extracting from photos:', error.message);
      return this.errorResult(startTime, error.message);
    }
  }

  /**
   * Extract services and pricing from a price list image
   * Extracts: service names, prices, duration, categories
   */
  async extractFromPriceList(imageUrl: string): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      const response = await this.callGLMVision(
        imageUrl,
        `You are analyzing a price list, menu, or service list. Extract ALL services with their prices.

IMPORTANT RULES:
- Prices must be in CENTS (multiply dollar amounts by 100)
- Duration in MINUTES (estimate if not shown)
- Provide categories for grouping
- Return ALL items visible

Return ONLY valid JSON in this format:
{
  "services": [
    {
      "name": "Service Name",
      "price": 5000,
      "duration": 60,
      "category": "Category",
      "description": "Brief description if available"
    }
  ],
  "businessName": "Business name if visible",
  "overallConfidence": 90
}

If the image is unreadable, return empty services array with a warning.`
      );

      const parsed = JSON.parse(response);
      const processingTimeMs = Date.now() - startTime;

      return {
        id: crypto.randomUUID(),
        data: {
          businessName: parsed.businessName,
          services: parsed.services || [],
          overallConfidence: parsed.overallConfidence || 85,
        },
        confidence: parsed.overallConfidence || 85,
        warnings: [],
        processingTimeMs,
      };
    } catch (error: any) {
      console.error('[GLMVisionService] Error extracting from price list:', error.message);
      return this.errorResult(startTime, error.message);
    }
  }

  /**
   * Extract comprehensive business context from multiple sources
   * Combines extractions into a single business context
   */
  async extractBusinessContext(
    logoUrl?: string,
    photos?: string[],
    priceListUrl?: string
  ): Promise<BusinessContext & { confidence: number }> {
    const startTime = Date.now();
    const context: BusinessContext = {};
    let maxConfidence = 0;

    // Extract from logo if provided
    if (logoUrl) {
      try {
        const logoResult = await this.extractFromLogo(logoUrl);
        Object.assign(context, logoResult.data);
        maxConfidence = Math.max(maxConfidence, logoResult.confidence);
      } catch (e) {
        // Continue with other sources
      }
    }

    // Extract from photos if provided
    if (photos && photos.length > 0) {
      for (const photoUrl of photos) {
        try {
          const photoResult = await this.extractFromPhotos(photoUrl);
          if (photoResult.data.services) {
            context.services = [...(context.services || []), ...photoResult.data.services];
          }
          if (!context.vibe && photoResult.data.vibe) {
            context.vibe = photoResult.data.vibe;
          }
          maxConfidence = Math.max(maxConfidence, photoResult.confidence);
        } catch (e) {
          // Continue with other sources
        }
      }
    }

    // Extract from price list if provided
    if (priceListUrl) {
      try {
        const priceListResult = await this.extractFromPriceList(priceListUrl);
        if (priceListResult.data.businessName && !context.businessName) {
          context.businessName = priceListResult.data.businessName;
        }
        if (priceListResult.data.services) {
          context.services = [...(context.services || []), ...priceListResult.data.services];
        }
        maxConfidence = Math.max(maxConfidence, priceListResult.confidence);
      } catch (e) {
        // Continue
      }
    }

    return {
      ...context,
      confidence: maxConfidence,
      processingTimeMs: Date.now() - startTime,
    } as any;
  }

  /**
   * Call GLM Vision API
   */
  private async callGLMVision(imageUrl: string, systemPrompt: string): Promise<string> {
    const requestBody = {
      model: GLM_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: 'Analyze this image and return the requested information as valid JSON only.',
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    };

    const response = await fetch(`${GLM_API_BASE}chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GLM API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from GLM Vision API');
    }

    return content;
  }

  /**
   * Create error result
   */
  private errorResult(startTime: number, message: string): ExtractionResult {
    return {
      id: crypto.randomUUID(),
      data: {},
      confidence: 0,
      warnings: [
        {
          type: 'extraction_error',
          message: message || 'Failed to extract data. Please try again or enter manually.',
        },
      ],
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Ask clarifying questions based on extracted context
   */
  generateClarifyingQuestions(context: BusinessContext): string[] {
    const questions: string[] = [];

    if (!context.businessName) {
      questions.push("What is your business name?");
    }

    if (!context.colors || context.colors.length === 0) {
      questions.push("What are your brand colors?");
    }

    if (!context.vibe) {
      questions.push("How would you describe your brand style? (modern, vintage, playful, professional, etc.)");
    }

    if (!context.services || context.services.length === 0) {
      questions.push("What services do you offer? Please list them with prices.");
    }

    if (!context.description) {
      questions.push("Can you provide a brief description of your business?");
    }

    return questions;
  }
}

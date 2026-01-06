import { ExtractedService, ExtractionResult } from '@codename/api';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const VISION_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export class VisionService {
  async processImage(imageUrl: string): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      // Call OpenAI Vision API with structured JSON output
      const response = await openai.chat.completions.create({
        model: VISION_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting service information from images of menus, price lists, and service boards.
Extract ALL services with their prices, durations, categories, and descriptions.

IMPORTANT RULES:
- Prices must be in CENTS (multiply dollar amounts by 100)
- Duration in MINUTES (estimate if not shown: haircuts ~30-60min, braids ~120-240min, nails ~60-90min)
- Provide confidence score 0-100 for each service
- Categories: Hair, Braids, Nails, Waxing, Massage, Spa, Other
- If image is unreadable or contains no services, return empty services array with warning

Return ONLY valid JSON in this exact format:
{
  "services": [
    {
      "name": "Service Name",
      "price": 5000,
      "duration": 60,
      "category": "Hair",
      "description": "Brief description if available",
      "confidence": 95
    }
  ],
  "overallConfidence": 90,
  "warnings": []
}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all services from this image. Return valid JSON only.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for consistent extraction
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Vision AI');
      }

      // Parse JSON response
      const parsed = JSON.parse(content);

      // Add IDs to each service
      const services: ExtractedService[] = (parsed.services || []).map((svc: any) => ({
        id: crypto.randomUUID(),
        name: svc.name || 'Unnamed Service',
        price: svc.price || 0,
        duration: svc.duration || 60,
        category: svc.category || 'Other',
        description: svc.description || '',
        confidence: svc.confidence || 80,
      }));

      // Extract unique categories
      const categories = [...new Set(services.map((s) => s.category))].filter((c): c is string => c !== null);

      const processingTimeMs = Date.now() - startTime;

      return {
        id: crypto.randomUUID(),
        services,
        categories,
        overallConfidence: parsed.overallConfidence || 85,
        sourceImageUrl: imageUrl,
        processingTimeMs,
        warnings: parsed.warnings || [],
      };
    } catch (error: any) {
      console.error('[VisionService] Error processing image:', error.message);

      // Return empty result with error warning
      return {
        id: crypto.randomUUID(),
        services: [],
        categories: [],
        overallConfidence: 0,
        sourceImageUrl: imageUrl,
        processingTimeMs: Date.now() - startTime,
        warnings: [
          {
            type: 'unreadable_section',
            message: error.message || 'Failed to process image. Please try again or enter services manually.',
          },
        ],
      };
    }
  }
}

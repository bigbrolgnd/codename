import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VisionService } from './vision.service';

// Mock OpenAI module
vi.mock('openai', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            services: [
              {
                name: 'Goddess Braids',
                price: 15000,
                duration: 240,
                category: 'Braids',
                description: 'Waist length, pre-stretched hair included.',
                confidence: 98,
              },
              {
                name: 'Silk Press',
                price: 8500,
                duration: 90,
                category: 'Hair',
                description: 'Includes wash, deep condition, and trim.',
                confidence: 95,
              },
            ],
            overallConfidence: 96,
            warnings: [],
          }),
        },
      },
    ],
  });

  class MockOpenAI {
    chat = {
      completions: {
        create: mockCreate,
      },
    };
  }

  return {
    default: MockOpenAI,
  };
});

describe('VisionService', () => {
  let service: VisionService;

  beforeEach(() => {
    service = new VisionService();
    vi.clearAllMocks();
  });

  describe('processImage', () => {
    it('returns a valid extraction result', async () => {
      const result = await service.processImage('https://example.com/test-image.jpg');

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });

    it('returns an array of extracted services', async () => {
      const result = await service.processImage('https://example.com/test-image.jpg');

      expect(Array.isArray(result.services)).toBe(true);
      expect(result.services.length).toBeGreaterThan(0);
    });

    it('returns services with required fields', async () => {
      const result = await service.processImage('https://example.com/test-image.jpg');

      const service1 = result.services[0];
      expect(service1).toHaveProperty('id');
      expect(service1).toHaveProperty('name');
      expect(service1).toHaveProperty('price');
      expect(service1).toHaveProperty('duration');
      expect(service1).toHaveProperty('category');
      expect(service1).toHaveProperty('confidence');
    });

    it('returns confidence scores between 0 and 100', async () => {
      const result = await service.processImage('https://example.com/test-image.jpg');

      expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(100);

      result.services.forEach((svc) => {
        expect(svc.confidence).toBeGreaterThanOrEqual(0);
        expect(svc.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('returns prices in cents (integers)', async () => {
      const result = await service.processImage('https://example.com/test-image.jpg');

      result.services.forEach((svc) => {
        expect(Number.isInteger(svc.price)).toBe(true);
        expect(svc.price).toBeGreaterThan(0);
      });
    });

    it('returns duration in minutes (integers)', async () => {
      const result = await service.processImage('https://example.com/test-image.jpg');

      result.services.forEach((svc) => {
        expect(Number.isInteger(svc.duration)).toBe(true);
        expect(svc.duration).toBeGreaterThan(0);
      });
    });

    it('returns detected categories', async () => {
      const result = await service.processImage('https://example.com/test-image.jpg');

      expect(Array.isArray(result.categories)).toBe(true);
      expect(result.categories.length).toBeGreaterThan(0);
    });

    it('includes source image URL in result', async () => {
      const testUrl = 'https://example.com/my-price-list.jpg';
      const result = await service.processImage(testUrl);

      expect(result.sourceImageUrl).toBe(testUrl);
    });

    it('includes processing time in result', async () => {
      const result = await service.processImage('https://example.com/test-image.jpg');

      expect(result.processingTimeMs).toBeDefined();
      expect(typeof result.processingTimeMs).toBe('number');
    });

    it('returns warnings array', async () => {
      const result = await service.processImage('https://example.com/test-image.jpg');

      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});

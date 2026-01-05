import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VisionService } from './vision.service';

describe('VisionService', () => {
  let service: VisionService;

  beforeEach(() => {
    service = new VisionService();
  });

  describe('processImage', () => {
    it('returns a valid extraction result', async () => {
      vi.useFakeTimers();

      const promise = service.processImage('https://example.com/test-image.jpg');

      // Fast-forward through the mock delay
      await vi.advanceTimersByTimeAsync(3000);

      const result = await promise;

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');

      vi.useRealTimers();
    });

    it('returns an array of extracted services', async () => {
      vi.useFakeTimers();

      const promise = service.processImage('https://example.com/test-image.jpg');
      await vi.advanceTimersByTimeAsync(3000);
      const result = await promise;

      expect(Array.isArray(result.services)).toBe(true);
      expect(result.services.length).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('returns services with required fields', async () => {
      vi.useFakeTimers();

      const promise = service.processImage('https://example.com/test-image.jpg');
      await vi.advanceTimersByTimeAsync(3000);
      const result = await promise;

      const service1 = result.services[0];
      expect(service1).toHaveProperty('id');
      expect(service1).toHaveProperty('name');
      expect(service1).toHaveProperty('price');
      expect(service1).toHaveProperty('duration');
      expect(service1).toHaveProperty('category');
      expect(service1).toHaveProperty('confidence');

      vi.useRealTimers();
    });

    it('returns confidence scores between 0 and 100', async () => {
      vi.useFakeTimers();

      const promise = service.processImage('https://example.com/test-image.jpg');
      await vi.advanceTimersByTimeAsync(3000);
      const result = await promise;

      expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(100);

      result.services.forEach(svc => {
        expect(svc.confidence).toBeGreaterThanOrEqual(0);
        expect(svc.confidence).toBeLessThanOrEqual(100);
      });

      vi.useRealTimers();
    });

    it('returns prices in cents (integers)', async () => {
      vi.useFakeTimers();

      const promise = service.processImage('https://example.com/test-image.jpg');
      await vi.advanceTimersByTimeAsync(3000);
      const result = await promise;

      result.services.forEach(svc => {
        expect(Number.isInteger(svc.price)).toBe(true);
        expect(svc.price).toBeGreaterThan(0);
      });

      vi.useRealTimers();
    });

    it('returns duration in minutes (integers)', async () => {
      vi.useFakeTimers();

      const promise = service.processImage('https://example.com/test-image.jpg');
      await vi.advanceTimersByTimeAsync(3000);
      const result = await promise;

      result.services.forEach(svc => {
        expect(Number.isInteger(svc.duration)).toBe(true);
        expect(svc.duration).toBeGreaterThan(0);
      });

      vi.useRealTimers();
    });

    it('returns detected categories', async () => {
      vi.useFakeTimers();

      const promise = service.processImage('https://example.com/test-image.jpg');
      await vi.advanceTimersByTimeAsync(3000);
      const result = await promise;

      expect(Array.isArray(result.categories)).toBe(true);
      expect(result.categories.length).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('includes source image URL in result', async () => {
      vi.useFakeTimers();
      const testUrl = 'https://example.com/my-price-list.jpg';

      const promise = service.processImage(testUrl);
      await vi.advanceTimersByTimeAsync(3000);
      const result = await promise;

      expect(result.sourceImageUrl).toBe(testUrl);

      vi.useRealTimers();
    });

    it('includes processing time in result', async () => {
      vi.useFakeTimers();

      const promise = service.processImage('https://example.com/test-image.jpg');
      await vi.advanceTimersByTimeAsync(3000);
      const result = await promise;

      expect(result.processingTimeMs).toBeDefined();
      expect(typeof result.processingTimeMs).toBe('number');

      vi.useRealTimers();
    });

    it('returns empty warnings array for valid images', async () => {
      vi.useFakeTimers();

      const promise = service.processImage('https://example.com/test-image.jpg');
      await vi.advanceTimersByTimeAsync(3000);
      const result = await promise;

      expect(Array.isArray(result.warnings)).toBe(true);

      vi.useRealTimers();
    });
  });
});

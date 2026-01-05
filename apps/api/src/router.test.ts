import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appRouter } from './router';

// Create a caller for testing the router directly (tRPC v10 style)
const caller = appRouter.createCaller({});

describe('Extraction API Endpoints', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('extraction.start', () => {
    it('accepts a valid image URL and returns a jobId', async () => {
      const result = await caller.extraction.start({
        imageUrl: 'https://example.com/test-image.jpg'
      });

      expect(result).toBeDefined();
      expect(result.jobId).toBeDefined();
      expect(typeof result.jobId).toBe('string');
      expect(result.jobId.length).toBeGreaterThan(0);
    });

    it('returns different jobIds for different requests', async () => {
      const result1 = await caller.extraction.start({
        imageUrl: 'https://example.com/image1.jpg'
      });
      const result2 = await caller.extraction.start({
        imageUrl: 'https://example.com/image2.jpg'
      });

      expect(result1.jobId).not.toBe(result2.jobId);
    });

    it('validates URL format', async () => {
      await expect(
        caller.extraction.start({
          imageUrl: 'not-a-valid-url'
        })
      ).rejects.toThrow();
    });
  });

  describe('extraction.status', () => {
    it('returns status for a valid jobId', async () => {
      // Start a job first
      const { jobId } = await caller.extraction.start({
        imageUrl: 'https://example.com/test-image.jpg'
      });

      // Check initial status
      const status = await caller.extraction.status({ jobId });

      expect(status).toBeDefined();
      expect(status.phase).toBeDefined();
      expect(['uploading', 'enhancing', 'reading', 'structuring', 'complete', 'error']).toContain(status.phase);
    });

    it('throws error for non-existent jobId', async () => {
      await expect(
        caller.extraction.status({ jobId: 'non-existent-job-id' })
      ).rejects.toThrow('Job not found');
    });

    it('shows progress through phases over time', async () => {
      const { jobId } = await caller.extraction.start({
        imageUrl: 'https://example.com/test-image.jpg'
      });

      // Initial status should be uploading
      const status1 = await caller.extraction.status({ jobId });
      expect(status1.phase).toBe('uploading');

      // Advance time and check for phase progression
      await vi.advanceTimersByTimeAsync(600);
      const status2 = await caller.extraction.status({ jobId });
      expect(['uploading', 'enhancing']).toContain(status2.phase);

      // Advance more time
      await vi.advanceTimersByTimeAsync(2000);
      const status3 = await caller.extraction.status({ jobId });
      expect(['enhancing', 'reading', 'structuring']).toContain(status3.phase);
    });

    it('eventually reaches complete phase with result', async () => {
      const { jobId } = await caller.extraction.start({
        imageUrl: 'https://example.com/test-image.jpg'
      });

      // Advance time until job completes (total ~7.5s based on router implementation)
      await vi.advanceTimersByTimeAsync(8000);

      const status = await caller.extraction.status({ jobId });
      expect(status.phase).toBe('complete');

      if (status.phase === 'complete') {
        expect(status.result).toBeDefined();
        expect(status.result.services).toBeDefined();
        expect(Array.isArray(status.result.services)).toBe(true);
        expect(status.result.services.length).toBeGreaterThan(0);
        expect(status.result.overallConfidence).toBeDefined();
        expect(status.result.categories).toBeDefined();
      }
    });
  });

  describe('extraction.result', () => {
    it('returns result for completed job', async () => {
      const { jobId } = await caller.extraction.start({
        imageUrl: 'https://example.com/test-image.jpg'
      });

      // Wait for job to complete
      await vi.advanceTimersByTimeAsync(8000);

      const result = await caller.extraction.result({ jobId });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.services).toBeDefined();
      expect(Array.isArray(result.services)).toBe(true);
      expect(result.categories).toBeDefined();
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(100);
    });

    it('throws error for non-existent job', async () => {
      await expect(
        caller.extraction.result({ jobId: 'non-existent-job' })
      ).rejects.toThrow('Job not found');
    });

    it('throws error for incomplete job', async () => {
      const { jobId } = await caller.extraction.start({
        imageUrl: 'https://example.com/test-image.jpg'
      });

      // Don't wait for completion
      await expect(
        caller.extraction.result({ jobId })
      ).rejects.toThrow('Extraction not complete');
    });

    it('returns services with all required fields', async () => {
      const { jobId } = await caller.extraction.start({
        imageUrl: 'https://example.com/test-image.jpg'
      });

      await vi.advanceTimersByTimeAsync(8000);

      const result = await caller.extraction.result({ jobId });

      result.services.forEach(service => {
        expect(service.id).toBeDefined();
        expect(service.name).toBeDefined();
        expect(typeof service.name).toBe('string');
        expect(service.price).toBeDefined();
        expect(Number.isInteger(service.price)).toBe(true);
        expect(service.duration).toBeDefined();
        expect(Number.isInteger(service.duration)).toBe(true);
        expect(service.confidence).toBeDefined();
        expect(service.confidence).toBeGreaterThanOrEqual(0);
        expect(service.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('returns source image URL in result', async () => {
      const testUrl = 'https://example.com/my-price-list.jpg';
      const { jobId } = await caller.extraction.start({
        imageUrl: testUrl
      });

      await vi.advanceTimersByTimeAsync(8000);

      const result = await caller.extraction.result({ jobId });

      expect(result.sourceImageUrl).toBe(testUrl);
    });
  });

  describe('Full extraction workflow', () => {
    it('completes full start -> poll -> result workflow', async () => {
      // 1. Start extraction
      const { jobId } = await caller.extraction.start({
        imageUrl: 'https://example.com/menu.jpg'
      });
      expect(jobId).toBeDefined();

      // 2. Poll for status until complete
      let attempts = 0;
      let status = await caller.extraction.status({ jobId });

      while (status.phase !== 'complete' && status.phase !== 'error' && attempts < 20) {
        await vi.advanceTimersByTimeAsync(500);
        status = await caller.extraction.status({ jobId });
        attempts++;
      }

      expect(status.phase).toBe('complete');

      // 3. Get final result
      const result = await caller.extraction.result({ jobId });

      expect(result.services.length).toBeGreaterThan(0);
      expect(result.overallConfidence).toBeGreaterThan(0);
      expect(result.processingTimeMs).toBeDefined();
    });
  });
});

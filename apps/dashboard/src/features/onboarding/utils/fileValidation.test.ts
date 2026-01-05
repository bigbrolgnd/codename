import { describe, it, expect } from 'vitest';
import {
  validateFile,
  formatFileSize,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from './fileValidation';

describe('fileValidation', () => {
  describe('validateFile', () => {
    it('accepts valid JPEG files under 10MB', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB

      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts valid PNG files under 10MB', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('accepts valid WEBP files under 10MB', () => {
      const file = new File([''], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB

      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('rejects files over 10MB', () => {
      const file = new File([''], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB

      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File must be less than 10MB');
    });

    it('rejects non-image files', () => {
      const file = new File([''], 'document.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 }); // 1KB

      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects GIF files', () => {
      const file = new File([''], 'animation.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 1024 }); // 1KB

      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects video files', () => {
      const file = new File([''], 'video.mp4', { type: 'video/mp4' });
      Object.defineProperty(file, 'size', { value: 1024 }); // 1KB

      const result = validateFile(file);
      expect(result.valid).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2560)).toBe('2.5 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10.0 MB');
    });
  });

  describe('constants', () => {
    it('exports correct accepted image types', () => {
      expect(ACCEPTED_IMAGE_TYPES).toContain('image/jpeg');
      expect(ACCEPTED_IMAGE_TYPES).toContain('image/png');
      expect(ACCEPTED_IMAGE_TYPES).toContain('image/webp');
      expect(ACCEPTED_IMAGE_TYPES).toHaveLength(3);
    });

    it('exports correct max file size (10MB)', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });
});

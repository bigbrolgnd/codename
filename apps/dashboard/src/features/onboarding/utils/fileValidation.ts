import { z } from 'zod';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type AcceptedImageType = typeof ACCEPTED_IMAGE_TYPES[number];

export const fileValidationSchema = z.object({
  type: z.enum(ACCEPTED_IMAGE_TYPES as unknown as [string, ...string[]], {
    message: 'Only JPG, PNG, and WEBP images are accepted',
  }),
  size: z.number().max(MAX_FILE_SIZE, 'File must be less than 10MB'),
});

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  const result = fileValidationSchema.safeParse({
    type: file.type,
    size: file.size,
  });

  if (!result.success) {
    const issues = result.error.issues;
    return {
      valid: false,
      error: issues[0]?.message ?? 'Invalid file',
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

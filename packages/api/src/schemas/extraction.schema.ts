import { z } from 'zod';

export const ExtractedServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number().int().nonnegative(), // Cents
  duration: z.number().int().positive(), // Minutes
  category: z.string().nullable(),
  confidence: z.number().min(0).max(100),
  boundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  description: z.string().optional(),
});

export const ExtractionWarningSchema = z.object({
  type: z.enum(['low_confidence', 'missing_price', 'unreadable_section']),
  message: z.string(),
  affectedServiceIds: z.array(z.string()).optional(),
});

export const ExtractionErrorSchema = z.object({
  code: z.enum(['UNREADABLE_IMAGE', 'NO_SERVICES_FOUND', 'TIMEOUT', 'SERVER_ERROR']),
  message: z.string(),
  canRetry: z.boolean(),
  suggestions: z.array(z.string()).optional(),
});

export const ExtractionResultSchema = z.object({
  id: z.string().uuid(),
  services: z.array(ExtractedServiceSchema),
  categories: z.array(z.string()),
  overallConfidence: z.number().min(0).max(100),
  sourceImageUrl: z.string().url(),
  processingTimeMs: z.number(),
  warnings: z.array(ExtractionWarningSchema),
});

export const ExtractionStatusSchema = z.discriminatedUnion('phase', [
  z.object({ phase: z.literal('uploading'), progress: z.number() }),
  z.object({ phase: z.literal('enhancing'), progress: z.number() }),
  z.object({ phase: z.literal('reading'), progress: z.number() }),
  z.object({ phase: z.literal('structuring'), progress: z.number() }),
  z.object({ phase: z.literal('complete'), result: ExtractionResultSchema }),
  z.object({ phase: z.literal('error'), error: ExtractionErrorSchema }),
]);

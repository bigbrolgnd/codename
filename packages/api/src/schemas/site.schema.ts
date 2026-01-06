import { z } from 'zod';

export const IngestIntakeSchema = z.object({
  method: z.enum(['upload', 'text']),
  content: z.string(), // Image URL or typed text
});

export const IngestIntakeResponseSchema = z.object({
  success: z.boolean(),
  extractionJobId: z.string().uuid(),
  message: z.string(),
});

export const InstagramPostSchema = z.object({
  externalId: z.string(),
  mediaUrl: z.string().url(),
  permalink: z.string().url(),
  caption: z.string(),
  mediaType: z.string(),
  postedAt: z.string(),
});

export const InstagramFeedResponseSchema = z.object({
  posts: z.array(InstagramPostSchema),
});

export type IngestIntake = z.infer<typeof IngestIntakeSchema>;
export type IngestIntakeResponse = z.infer<typeof IngestIntakeResponseSchema>;
export type InstagramPost = z.infer<typeof InstagramPostSchema>;
export type InstagramFeedResponse = z.infer<typeof InstagramFeedResponseSchema>;

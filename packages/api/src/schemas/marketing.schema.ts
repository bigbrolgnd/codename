import { z } from 'zod';

export const MarketingFrequencySchema = z.enum(['weekly', 'bi-weekly']);
export const MarketingToneSchema = z.enum(['professional', 'enthusiastic', 'educational']);
export const MarketingPlatformSchema = z.enum(['google', 'instagram']);

export const MarketingSettingsSchema = z.object({
  autoPilotEnabled: z.boolean(),
  frequency: MarketingFrequencySchema,
  tone: MarketingToneSchema,
  platforms: z.array(MarketingPlatformSchema),
  nextPostAt: z.string().nullable(),
});

export const UpdateMarketingSettingsSchema = z.object({
  autoPilotEnabled: z.boolean(),
  frequency: MarketingFrequencySchema,
  tone: MarketingToneSchema,
  platforms: z.array(MarketingPlatformSchema),
}).refine((data) => {
  if (data.autoPilotEnabled && data.platforms.length === 0) {
    return false;
  }
  return true;
}, {
  message: "At least one platform must be selected when Auto-Pilot is enabled",
  path: ["platforms"],
});

export type MarketingSettings = z.infer<typeof MarketingSettingsSchema>;
export type UpdateMarketingSettings = z.infer<typeof UpdateMarketingSettingsSchema>;

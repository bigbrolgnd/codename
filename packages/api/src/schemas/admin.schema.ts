import { z } from 'zod';

export const ActionItemTypeSchema = z.enum(['booking', 'review', 'system', 'alert']);

export const ActionItemSchema = z.object({
  id: z.string().uuid(),
  type: ActionItemTypeSchema,
  title: z.string(),
  description: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
  isRead: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type ActionItem = z.infer<typeof ActionItemSchema>;

export const ActionFeedResponseSchema = z.object({
  items: z.array(ActionItemSchema),
  totalCount: z.number(),
});

export const AgentMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string().datetime(),
  intentDetected: z.string().optional(),
});

export type AgentMessage = z.infer<typeof AgentMessageSchema>;

export const SendAgentMessageResponseSchema = z.object({
  response: AgentMessageSchema,
  actionRequired: z.boolean().default(false),
});

export const StaffRoleSchema = z.enum(['admin', 'manager', 'staff']);

export const StaffSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email().nullable(),
  role: StaffRoleSchema,
  createdAt: z.string().datetime(),
});

export type Staff = z.infer<typeof StaffSchema>;

export const StaffListResponseSchema = z.array(StaffSchema);

export const InsightSummarySchema = z.object({
  message: z.string(),
  trend: z.enum(['positive', 'neutral', 'negative']),
  percentage: z.number().optional(),
});

export type InsightSummary = z.infer<typeof InsightSummarySchema>;

export const HeatmapItemSchema = z.object({
  location: z.string(),
  count: z.number(),
  percentage: z.number(),
  type: z.enum(['city', 'county']),
});

export type HeatmapItem = z.infer<typeof HeatmapItemSchema>;

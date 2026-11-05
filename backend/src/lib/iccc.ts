import { z } from 'zod';

export const ICCCAlertSchema = z.object({
  alertId: z.string().min(1),
  level: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    ghatId: z.string().optional(),
    ghatName: z.string().optional(),
  }),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ICCCAlert = z.infer<typeof ICCCAlertSchema>;

export const ICCCIssueSchema = z.object({
  issueId: z.string().min(1),
  category: z.enum([
    'sanitation',
    'crowd',
    'medical',
    'infrastructure',
    'lost_found',
    'other',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['open', 'assigned', 'in_progress', 'resolved', 'closed']),
  description: z.string().min(1),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    ghatId: z.string().optional(),
  }),
  reporterPhoneMasked: z.string().optional(),
  reportedAt: z.string().datetime(),
});

export type ICCCIssue = z.infer<typeof ICCCIssueSchema>;


import { z } from 'zod';
import { LEAD_PRIORITIES, LEAD_SORT_FIELDS, LEAD_SOURCES, LEAD_STATUSES } from '../../domain/constants.js';

export const aiLeadParamsSchema = z.object({ id: z.string().uuid('Invalid lead id') });

export const aiInsightSchema = z.object({
  summary: z.string().trim().min(10).max(2000),
  score: z.number().int().min(1).max(100),
  conversionProbability: z.number().int().min(0).max(100),
  reasoning: z.string().trim().min(10).max(2000),
  positiveSignals: z.array(z.string().trim().min(1).max(200)).max(8),
  riskFactors: z.array(z.string().trim().min(1).max(200)).max(8),
  missingInformation: z.array(z.string().trim().min(1).max(200)).max(8),
  nextBestAction: z.string().trim().min(5).max(1000),
  suggestedMessage: z.string().trim().min(10).max(3000),
});

export const chatSchema = z.object({
  question: z.string().trim().min(3).max(500),
});

export const naturalLanguageSearchSchema = z.object({
  query: z.string().trim().min(3).max(300),
});

/** Explicit allowlist of filters the AI may return. No SQL, no arbitrary fields. */
export const aiLeadFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  priority: z.enum(LEAD_PRIORITIES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  assignedToMe: z.boolean().optional(),
  createdWithinDays: z.number().int().min(1).max(365).optional(),
  sortBy: z.enum(LEAD_SORT_FIELDS).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const emailDraftSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  body: z.string().trim().min(10).max(8000),
});

export const sendEmailSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  body: z.string().trim().min(10).max(8000),
});

export type AiInsightPayload = z.infer<typeof aiInsightSchema>;
export type AiLeadFilters = z.infer<typeof aiLeadFiltersSchema>;
export type EmailDraft = z.infer<typeof emailDraftSchema>;

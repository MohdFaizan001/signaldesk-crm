import { z } from 'zod';
import {
  LEAD_PRIORITIES,
  LEAD_SORT_FIELDS,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from '../../domain/constants.js';

const emptyToUndefined = (value: unknown) => (value === '' || value === undefined || value === null ? undefined : value);

export const leadIdParamsSchema = z.object({
  id: z.string().uuid('Invalid lead id'),
});

export const leadListQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(LEAD_STATUSES).optional()),
  priority: z.preprocess(emptyToUndefined, z.enum(LEAD_PRIORITIES).optional()),
  source: z.preprocess(emptyToUndefined, z.enum(LEAD_SOURCES).optional()),
  assignedTo: z.preprocess(emptyToUndefined, z.string().max(64).optional()),
  createdWithinDays: z.coerce.number().int().min(1).max(365).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.preprocess(emptyToUndefined, z.enum(LEAD_SORT_FIELDS).default('created_at')),
  sortDir: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).default('desc')),
});

export const createLeadSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(''),
  company: z.string().trim().min(1).max(160),
  jobTitle: z.string().trim().max(120).optional().default(''),
  source: z.enum(LEAD_SOURCES).default('website'),
  status: z.enum(LEAD_STATUSES).default('new'),
  priority: z.enum(LEAD_PRIORITIES).default('medium'),
  notes: z.string().trim().max(5000).optional().nullable(),
  dealValue: z.coerce.number().min(0).max(1_000_000_000).optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  website: z.string().trim().max(200).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  assignedToId: z.string().uuid().optional(),
});

export const updateLeadSchema = createLeadSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field must be provided'
);

export const importLeadRowSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(''),
  company: z.string().trim().min(1).max(160),
  jobTitle: z.string().trim().max(120).optional().default(''),
  source: z.enum(LEAD_SOURCES).default('website'),
  status: z.enum(LEAD_STATUSES).default('new'),
  priority: z.enum(LEAD_PRIORITIES).default('medium'),
  notes: z.string().trim().max(5000).optional().nullable(),
  dealValue: z.coerce.number().min(0).max(1_000_000_000).optional().nullable(),
});

export const importLeadsSchema = z.object({
  // Rows are validated individually so the API can return precise per-row results.
  leads: z.array(z.unknown()).min(1).max(500),
});

export const exportLeadsQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(LEAD_STATUSES).optional()),
  priority: z.preprocess(emptyToUndefined, z.enum(LEAD_PRIORITIES).optional()),
  source: z.preprocess(emptyToUndefined, z.enum(LEAD_SOURCES).optional()),
  assignedTo: z.preprocess(emptyToUndefined, z.string().max(64).optional()),
});

export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ImportLeadRow = z.infer<typeof importLeadRowSchema>;
export type ExportLeadsQuery = z.infer<typeof exportLeadsQuerySchema>;

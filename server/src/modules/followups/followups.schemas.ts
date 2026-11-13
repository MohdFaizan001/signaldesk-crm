import { z } from 'zod';
import { FOLLOW_UP_TYPES, LEAD_PRIORITIES } from '../../domain/constants.js';

const emptyToUndefined = (value: unknown) => (value === '' || value === undefined || value === null ? undefined : value);

export const followUpIdParamsSchema = z.object({ id: z.string().uuid('Invalid follow-up id') });

export const followUpListQuerySchema = z.object({
  view: z.preprocess(emptyToUndefined, z.enum(['all', 'upcoming', 'overdue', 'completed']).default('all')),
  assignedTo: z.preprocess(emptyToUndefined, z.string().max(64).optional()),
  leadId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const createFollowUpSchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(3000).optional().default(''),
  type: z.enum(FOLLOW_UP_TYPES).default('call'),
  dueAt: z.string().datetime({ offset: true }),
  priority: z.enum(LEAD_PRIORITIES).default('medium'),
  assignedToId: z.string().uuid().optional(),
});

export const updateFollowUpSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(3000).optional(),
    type: z.enum(FOLLOW_UP_TYPES).optional(),
    dueAt: z.string().datetime({ offset: true }).optional(),
    priority: z.enum(LEAD_PRIORITIES).optional(),
    assignedToId: z.string().uuid().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided');

export type FollowUpListQuery = z.infer<typeof followUpListQuerySchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;

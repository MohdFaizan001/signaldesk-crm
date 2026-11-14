import { z } from 'zod';
import { ACTIVITY_TYPES } from '../../domain/constants.js';

export const activityIdParamsSchema = z.object({ id: z.string().uuid('Invalid activity id') });
export const leadIdParamsSchema = z.object({ id: z.string().uuid('Invalid lead id') });

export const createActivitySchema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(3000).optional().default(''),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});

export const updateActivitySchema = z
  .object({
    type: z.enum(ACTIVITY_TYPES).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(3000).optional(),
    occurredAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided');

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

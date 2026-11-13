import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getAuth } from '../../middleware/auth.middleware.js';
import { getLeadOrThrow } from '../leads/leads.service.js';
import {
  activityIdParamsSchema,
  createActivitySchema,
  leadIdParamsSchema,
  updateActivitySchema,
} from './activities.schemas.js';
import {
  createActivity,
  deleteActivity,
  listActivities,
  updateActivity,
} from './activities.service.js';

export const leadActivitiesRouter = Router();

// GET /api/leads/:id/activities
leadActivitiesRouter.get(
  '/:id/activities',
  validate({ params: leadIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    await getLeadOrThrow(auth.supabase, id); // RLS-scoped existence check → 404 when not permitted
    const activities = await listActivities(auth.supabase, id);
    sendSuccess(res, activities, 'Activities loaded');
  })
);

// POST /api/leads/:id/activities
leadActivitiesRouter.post(
  '/:id/activities',
  validate({ params: leadIdParamsSchema, body: createActivitySchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const body = res.locals.body as Parameters<typeof createActivity>[2];
    await getLeadOrThrow(auth.supabase, id);
    const activity = await createActivity(auth.supabase, id, body, auth);
    sendSuccess(res, activity, 'Activity recorded', 201);
  })
);

export const activitiesRouter = Router();

// PATCH /api/activities/:id
activitiesRouter.patch(
  '/:id',
  validate({ params: activityIdParamsSchema, body: updateActivitySchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const body = res.locals.body as Parameters<typeof updateActivity>[2];
    const activity = await updateActivity(auth.supabase, id, body, auth);
    sendSuccess(res, activity, 'Activity updated');
  })
);

// DELETE /api/activities/:id
activitiesRouter.delete(
  '/:id',
  validate({ params: activityIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    await deleteActivity(auth.supabase, id, auth);
    sendSuccess(res, null, 'Activity deleted');
  })
);

import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getAuth } from '../../middleware/auth.middleware.js';
import {
  createFollowUpSchema,
  followUpIdParamsSchema,
  followUpListQuerySchema,
  updateFollowUpSchema,
} from './followups.schemas.js';
import {
  completeFollowUp,
  createFollowUp,
  deleteFollowUp,
  getFollowUpOrThrow,
  listFollowUps,
  updateFollowUp,
} from './followups.service.js';

export const followUpsRouter = Router();

followUpsRouter.get(
  '/',
  validate({ query: followUpListQuerySchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const query = res.locals.query as Parameters<typeof listFollowUps>[1];
    const result = await listFollowUps(auth.supabase, query, auth);
    sendSuccess(res, result, 'Follow-ups loaded');
  })
);

followUpsRouter.post(
  '/',
  validate({ body: createFollowUpSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const body = res.locals.body as Parameters<typeof createFollowUp>[1];
    const followUp = await createFollowUp(auth.supabase, body, auth);
    sendSuccess(res, followUp, 'Follow-up created', 201);
  })
);

followUpsRouter.get(
  '/:id',
  validate({ params: followUpIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const followUp = await getFollowUpOrThrow(auth.supabase, id);
    sendSuccess(res, followUp, 'Follow-up loaded');
  })
);

followUpsRouter.patch(
  '/:id/complete',
  validate({ params: followUpIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const followUp = await completeFollowUp(auth.supabase, id, auth);
    sendSuccess(res, followUp, 'Follow-up completed');
  })
);

followUpsRouter.patch(
  '/:id',
  validate({ params: followUpIdParamsSchema, body: updateFollowUpSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const body = res.locals.body as Parameters<typeof updateFollowUp>[2];
    const followUp = await updateFollowUp(auth.supabase, id, body, auth);
    sendSuccess(res, followUp, 'Follow-up updated');
  })
);

followUpsRouter.delete(
  '/:id',
  validate({ params: followUpIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    await deleteFollowUp(auth.supabase, id, auth);
    sendSuccess(res, null, 'Follow-up deleted');
  })
);

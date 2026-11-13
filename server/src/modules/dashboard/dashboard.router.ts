import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { getAuth } from '../../middleware/auth.middleware.js';
import { getLeadSources, getMonthlyActivity, getPipeline, getSummary } from './dashboard.service.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const summary = await getSummary(auth.supabase, auth.profile);
    sendSuccess(res, summary, 'Dashboard summary loaded');
  })
);

dashboardRouter.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const activity = await getMonthlyActivity(auth.supabase);
    sendSuccess(res, activity, 'Dashboard activity loaded');
  })
);

dashboardRouter.get(
  '/lead-sources',
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const sources = await getLeadSources(auth.supabase);
    sendSuccess(res, sources, 'Lead sources loaded');
  })
);

dashboardRouter.get(
  '/pipeline',
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const pipeline = await getPipeline(auth.supabase);
    sendSuccess(res, pipeline, 'Pipeline loaded');
  })
);

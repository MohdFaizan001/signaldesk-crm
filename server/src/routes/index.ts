import { Router } from 'express';
import { isEmailConfigured, isGeminiConfigured } from '../config/env.js';
import { aiProvider } from '../config/gemini.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { profilesRouter } from '../modules/profiles/profiles.router.js';
import { leadsRouter } from '../modules/leads/leads.router.js';
import { leadActivitiesRouter, activitiesRouter } from '../modules/activities/activities.router.js';
import { followUpsRouter } from '../modules/followups/followups.router.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.router.js';
import { aiRouter } from '../modules/ai/ai.router.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      ai: { configured: isGeminiConfigured, model: aiProvider.model },
      email: { configured: isEmailConfigured },
    },
    message: 'SignalDesk API is running',
  });
});

// Everything below requires a valid Supabase access token.
apiRouter.use(authenticate);

apiRouter.use(profilesRouter);
apiRouter.use('/leads', leadsRouter);
apiRouter.use('/leads', leadActivitiesRouter);
apiRouter.use('/activities', activitiesRouter);
apiRouter.use('/follow-ups', followUpsRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/ai', aiRouter);

import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getAuth } from '../../middleware/auth.middleware.js';
import { aiLimiter } from '../../middleware/rateLimit.middleware.js';
import { aiProvider } from '../../config/gemini.js';
import {
  aiLeadParamsSchema,
  chatSchema,
  naturalLanguageSearchSchema,
  sendEmailSchema,
} from './ai.schemas.js';
import {
  chat,
  dailySummary,
  generateEmailDraft,
  generateLeadInsight,
  getLatestInsight,
  listLatestInsights,
  naturalLanguageSearch,
  sendLeadEmail,
} from './ai.service.js';

export const aiRouter = Router();

aiRouter.get(
  '/status',
  asyncHandler(async (req, res) => {
    getAuth(req);
    sendSuccess(
      res,
      {
        ...aiProvider,
        mode: aiProvider.configured ? 'gemini' : 'mock',
        message: aiProvider.configured
          ? `Gemini (${aiProvider.model}) is configured.`
          : 'Gemini is not configured; AI features return clearly labelled demo output.',
      },
      'AI status loaded'
    );
  })
);

aiRouter.get(
  '/insights',
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const insights = await listLatestInsights(auth.supabase);
    sendSuccess(res, insights, 'AI insights loaded');
  })
);

aiRouter.get(
  '/leads/:id/insight',
  validate({ params: aiLeadParamsSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const insight = await getLatestInsight(auth.supabase, id);
    sendSuccess(res, insight, insight ? 'AI insight loaded' : 'No AI insight generated yet');
  })
);

aiRouter.post(
  '/leads/:id/insight',
  aiLimiter,
  validate({ params: aiLeadParamsSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const insight = await generateLeadInsight(auth.supabase, id, auth);
    sendSuccess(res, insight, 'AI insight generated', 201);
  })
);

aiRouter.post(
  '/chat',
  aiLimiter,
  validate({ body: chatSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { question } = res.locals.body as { question: string };
    const result = await chat(auth.supabase, question, auth);
    sendSuccess(res, result, 'AI response generated');
  })
);

aiRouter.post(
  '/search',
  aiLimiter,
  validate({ body: naturalLanguageSearchSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { query } = res.locals.body as { query: string };
    const result = await naturalLanguageSearch(auth.supabase, query, auth);
    sendSuccess(res, result, 'Search interpreted');
  })
);

aiRouter.get(
  '/daily-summary',
  aiLimiter,
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const result = await dailySummary(auth.supabase, auth);
    sendSuccess(res, result, 'Daily summary generated');
  })
);

aiRouter.post(
  '/leads/:id/email-draft',
  aiLimiter,
  validate({ params: aiLeadParamsSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const draft = await generateEmailDraft(auth.supabase, id, auth);
    sendSuccess(res, draft, 'Email draft generated');
  })
);

aiRouter.post(
  '/leads/:id/send-email',
  aiLimiter,
  validate({ params: aiLeadParamsSchema, body: sendEmailSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const { subject, body } = res.locals.body as { subject: string; body: string };
    const result = await sendLeadEmail(auth.supabase, id, subject, body, auth);
    sendSuccess(res, result, 'Email sent');
  })
);

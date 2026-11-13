import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getAuth } from '../../middleware/auth.middleware.js';
import {
  createLeadSchema,
  exportLeadsQuerySchema,
  importLeadsSchema,
  leadIdParamsSchema,
  leadListQuerySchema,
  updateLeadSchema,
} from './leads.schemas.js';
import {
  createLead,
  deleteLead,
  getLeadOrThrow,
  leadsToCsv,
  listLeads,
  listLeadsForExport,
  updateLead,
} from './leads.service.js';
import { importLeads } from '../imports/imports.service.js';

export const leadsRouter = Router();

leadsRouter.get(
  '/',
  validate({ query: leadListQuerySchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const query = res.locals.query as Parameters<typeof listLeads>[1];
    const result = await listLeads(auth.supabase, query, auth);
    sendSuccess(res, result, 'Leads loaded');
  })
);

leadsRouter.post(
  '/',
  validate({ body: createLeadSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const body = res.locals.body as Parameters<typeof createLead>[1];
    const lead = await createLead(auth.supabase, body, auth);
    sendSuccess(res, lead, 'Lead created', 201);
  })
);

// Export must be declared before /:id so "export" is not parsed as a UUID.
leadsRouter.get(
  '/export',
  validate({ query: exportLeadsQuerySchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const query = res.locals.query as Parameters<typeof listLeadsForExport>[1];
    const leads = await listLeadsForExport(auth.supabase, query, auth);
    const csv = leadsToCsv(leads);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="signaldesk-leads.csv"');
    res.send(csv);
  })
);

leadsRouter.post(
  '/import',
  validate({ body: importLeadsSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { leads } = res.locals.body as { leads: unknown[] };
    const result = await importLeads(auth.supabase, leads, auth);
    sendSuccess(res, result, 'Import completed', 201);
  })
);

leadsRouter.get(
  '/:id',
  validate({ params: leadIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const lead = await getLeadOrThrow(auth.supabase, id);
    sendSuccess(res, lead, 'Lead loaded');
  })
);

leadsRouter.patch(
  '/:id',
  validate({ params: leadIdParamsSchema, body: updateLeadSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const body = res.locals.body as Parameters<typeof updateLead>[2];
    const lead = await updateLead(auth.supabase, id, body, auth);
    sendSuccess(res, lead, 'Lead updated');
  })
);

leadsRouter.delete(
  '/:id',
  validate({ params: leadIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    await deleteLead(auth.supabase, id, auth);
    sendSuccess(res, null, 'Lead deleted');
  })
);

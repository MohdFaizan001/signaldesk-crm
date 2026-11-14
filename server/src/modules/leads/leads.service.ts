import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthContext } from '../../types/express.js';
import { LEAD_SELECT, mapLead, type Lead, type LeadRow } from './leads.types.js';
import type { CreateLeadInput, ExportLeadsQuery, LeadListQuery, UpdateLeadInput } from './leads.schemas.js';

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function sanitizeSearch(value: string): string {
  return value.replace(/[%,()*\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Supabase's PostgREST builder is generically typed per table; the filter chain
// is identical for each caller, so a structural builder type keeps this readable.
function applyFilters(
  builder: any,
  query: Pick<LeadListQuery, 'search' | 'status' | 'priority' | 'source' | 'assignedTo' | 'createdWithinDays'>,
  userId: string
) {
  let qb = builder;
  if (query.search) {
    const term = sanitizeSearch(query.search);
    if (term) {
      qb = qb.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%`);
    }
  }
  if (query.status) qb = qb.eq('status', query.status);
  if (query.priority) qb = qb.eq('priority', query.priority);
  if (query.source) qb = qb.eq('source', query.source);
  if (query.assignedTo) {
    qb = qb.eq('assigned_to', query.assignedTo === 'me' ? userId : query.assignedTo);
  }
  if (query.createdWithinDays) {
    const since = new Date(Date.now() - query.createdWithinDays * 86_400_000).toISOString();
    qb = qb.gte('created_at', since);
  }
  return qb;
}

export async function listLeads(
  supabase: SupabaseClient,
  query: LeadListQuery,
  auth: AuthContext
): Promise<{ items: Lead[]; pagination: Pagination }> {
  const from = (query.page - 1) * query.pageSize;
  const base = supabase.from('leads').select(LEAD_SELECT, { count: 'exact' });
  const filtered = applyFilters(base, query, auth.user.id);
  const { data, error, count } = await filtered
    .order(query.sortBy, { ascending: query.sortDir === 'asc' })
    .range(from, from + query.pageSize - 1);

  if (error) throw new ApiError(500, 'Failed to load leads');

  const total = count ?? 0;
  return {
    items: ((data ?? []) as unknown as LeadRow[]).map(mapLead),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function listLeadsForExport(
  supabase: SupabaseClient,
  query: ExportLeadsQuery,
  auth: AuthContext
): Promise<Lead[]> {
  const base = supabase.from('leads').select(LEAD_SELECT);
  const filtered = applyFilters(base, query, auth.user.id);
  const { data, error } = await filtered.order('created_at', { ascending: false }).range(0, 999);
  if (error) throw new ApiError(500, 'Failed to export leads');
  return ((data ?? []) as unknown as LeadRow[]).map(mapLead);
}

export async function getLeadOrThrow(supabase: SupabaseClient, id: string): Promise<Lead> {
  const { data, error } = await supabase.from('leads').select(LEAD_SELECT).eq('id', id).maybeSingle();
  if (error) throw new ApiError(500, 'Failed to load lead');
  if (!data) throw ApiError.notFound('Lead not found or not accessible');
  return mapLead(data as unknown as LeadRow);
}

function assertCanMutate(lead: Lead, auth: AuthContext) {
  if (auth.profile.role === 'admin') return;
  if (lead.createdById !== auth.user.id && lead.assignedToId !== auth.user.id) {
    throw ApiError.forbidden('You can only update leads you created or are assigned to');
  }
}

export async function createLead(supabase: SupabaseClient, input: CreateLeadInput, auth: AuthContext): Promise<Lead> {
  const assignedToId = input.assignedToId ?? auth.user.id;
  if (auth.profile.role !== 'admin' && assignedToId !== auth.user.id) {
    throw ApiError.forbidden('Only admins can assign leads to other users');
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone || null,
      company: input.company,
      job_title: input.jobTitle || null,
      source: input.source,
      status: input.status,
      priority: input.priority,
      notes: input.notes ?? null,
      deal_value: input.dealValue ?? null,
      location: input.location ?? null,
      website: input.website ?? null,
      tags: input.tags ?? [],
      created_by: auth.user.id,
      assigned_to: assignedToId,
    })
    .select(LEAD_SELECT)
    .single();

  if (error) throw new ApiError(400, 'Could not create lead', { errors: [{ message: error.message }] });
  return mapLead(data as unknown as LeadRow);
}

export async function updateLead(
  supabase: SupabaseClient,
  id: string,
  input: UpdateLeadInput,
  auth: AuthContext
): Promise<Lead> {
  const lead = await getLeadOrThrow(supabase, id);
  assertCanMutate(lead, auth);

  if (input.assignedToId && input.assignedToId !== lead.assignedToId && auth.profile.role !== 'admin') {
    throw ApiError.forbidden('Only admins can reassign leads');
  }

  const patch: Record<string, unknown> = {};
  if (input.fullName !== undefined) patch.full_name = input.fullName;
  if (input.email !== undefined) patch.email = input.email;
  if (input.phone !== undefined) patch.phone = input.phone || null;
  if (input.company !== undefined) patch.company = input.company;
  if (input.jobTitle !== undefined) patch.job_title = input.jobTitle || null;
  if (input.source !== undefined) patch.source = input.source;
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.dealValue !== undefined) patch.deal_value = input.dealValue;
  if (input.location !== undefined) patch.location = input.location;
  if (input.website !== undefined) patch.website = input.website;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.assignedToId !== undefined) patch.assigned_to = input.assignedToId;

  const { data, error } = await supabase
    .from('leads')
    .update(patch)
    .eq('id', id)
    .select(LEAD_SELECT)
    .single();

  if (error) throw new ApiError(400, 'Could not update lead', { errors: [{ message: error.message }] });
  return mapLead(data as unknown as LeadRow);
}

export async function deleteLead(supabase: SupabaseClient, id: string, auth: AuthContext): Promise<void> {
  const lead = await getLeadOrThrow(supabase, id);
  if (auth.profile.role !== 'admin' && lead.createdById !== auth.user.id) {
    throw ApiError.forbidden('Only admins or the lead creator can delete a lead');
  }
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw new ApiError(500, 'Could not delete lead');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const CSV_ESCAPE = /[",\n\r]/;

export function leadsToCsv(leads: Lead[]): string {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Company',
    'Job Title',
    'Source',
    'Status',
    'Priority',
    'Assigned To',
    'Deal Value',
    'Created',
  ];
  const escape = (value: string) => (CSV_ESCAPE.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const rows = leads.map((lead) =>
    [
      lead.fullName,
      lead.email,
      lead.phone,
      lead.company,
      lead.jobTitle,
      lead.source,
      lead.status,
      lead.priority,
      lead.assignedTo,
      lead.dealValue == null ? '' : String(lead.dealValue),
      lead.createdAt,
    ]
      .map((value) => escape(value))
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

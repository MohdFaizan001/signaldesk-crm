import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthContext } from '../../types/express.js';
import type { FollowUpType, LeadPriority } from '../../domain/constants.js';
import { getLeadOrThrow } from '../leads/leads.service.js';
import type { CreateFollowUpInput, FollowUpListQuery, UpdateFollowUpInput } from './followups.schemas.js';

export type FollowUpStatus = 'upcoming' | 'overdue' | 'completed';

export interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  type: FollowUpType;
  title: string;
  description: string;
  dueDate: string;
  status: FollowUpStatus;
  priority: LeadPriority;
  assignedTo: string;
  assignedToId: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FollowUpRow {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  type: string;
  due_at: string;
  priority: string;
  assigned_to: string;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  lead?: { id: string; full_name: string; company: string } | null;
  assigned?: { id: string; full_name: string } | null;
}

export const FOLLOW_UP_SELECT =
  'id, lead_id, title, description, type, due_at, priority, assigned_to, completed_at, created_by, created_at, updated_at, lead:leads!follow_ups_lead_id_fkey(id, full_name, company), assigned:profiles!follow_ups_assigned_to_fkey(id, full_name)';

/** Overdue is derived — never stored — so it cannot drift from the due date. */
export function deriveFollowUpStatus(dueAt: string, completedAt: string | null): FollowUpStatus {
  if (completedAt) return 'completed';
  return new Date(dueAt).getTime() < Date.now() ? 'overdue' : 'upcoming';
}

export function mapFollowUp(row: FollowUpRow): FollowUp {
  return {
    id: row.id,
    leadId: row.lead_id,
    leadName: row.lead?.full_name ?? 'Unknown lead',
    company: row.lead?.company ?? '',
    type: row.type as FollowUpType,
    title: row.title,
    description: row.description ?? '',
    dueDate: row.due_at,
    status: deriveFollowUpStatus(row.due_at, row.completed_at),
    priority: row.priority as LeadPriority,
    assignedTo: row.assigned?.full_name ?? 'Unassigned',
    assignedToId: row.assigned_to,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFollowUps(
  supabase: SupabaseClient,
  query: FollowUpListQuery,
  auth: AuthContext
): Promise<{ items: FollowUp[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> {
  const now = new Date().toISOString();
  let builder = supabase.from('follow_ups').select(FOLLOW_UP_SELECT, { count: 'exact' });

  if (query.view === 'completed') builder = builder.not('completed_at', 'is', null);
  if (query.view === 'upcoming') builder = builder.is('completed_at', null).gte('due_at', now);
  if (query.view === 'overdue') builder = builder.is('completed_at', null).lt('due_at', now);
  if (query.leadId) builder = builder.eq('lead_id', query.leadId);
  if (query.assignedTo) {
    builder = builder.eq('assigned_to', query.assignedTo === 'me' ? auth.user.id : query.assignedTo);
  }

  const ascending = query.view !== 'completed';
  const from = (query.page - 1) * query.pageSize;
  const { data, error, count } = await builder
    .order('due_at', { ascending })
    .range(from, from + query.pageSize - 1);

  if (error) throw new ApiError(500, 'Failed to load follow-ups');
  const total = count ?? 0;
  return {
    items: ((data ?? []) as unknown as FollowUpRow[]).map(mapFollowUp),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function getFollowUpOrThrow(supabase: SupabaseClient, id: string): Promise<FollowUp> {
  const { data, error } = await supabase.from('follow_ups').select(FOLLOW_UP_SELECT).eq('id', id).maybeSingle();
  if (error) throw new ApiError(500, 'Failed to load follow-up');
  if (!data) throw ApiError.notFound('Follow-up not found or not accessible');
  return mapFollowUp(data as unknown as FollowUpRow);
}

export async function createFollowUp(
  supabase: SupabaseClient,
  input: CreateFollowUpInput,
  auth: AuthContext
): Promise<FollowUp> {
  await getLeadOrThrow(supabase, input.leadId);
  const assignedToId = input.assignedToId ?? auth.user.id;
  if (auth.profile.role !== 'admin' && assignedToId !== auth.user.id) {
    throw ApiError.forbidden('Only admins can assign follow-ups to other users');
  }

  const { data, error } = await supabase
    .from('follow_ups')
    .insert({
      lead_id: input.leadId,
      title: input.title,
      description: input.description || null,
      type: input.type,
      due_at: input.dueAt,
      priority: input.priority,
      assigned_to: assignedToId,
      created_by: auth.user.id,
    })
    .select(FOLLOW_UP_SELECT)
    .single();

  if (error) throw new ApiError(400, 'Could not create follow-up', { errors: [{ message: error.message }] });
  return mapFollowUp(data as unknown as FollowUpRow);
}

function assertCanModify(followUp: FollowUp, auth: AuthContext) {
  if (auth.profile.role === 'admin') return;
  if (followUp.assignedToId !== auth.user.id) {
    throw ApiError.forbidden('You can only modify follow-ups assigned to you');
  }
}

export async function updateFollowUp(
  supabase: SupabaseClient,
  id: string,
  input: UpdateFollowUpInput,
  auth: AuthContext
): Promise<FollowUp> {
  const existing = await getFollowUpOrThrow(supabase, id);
  assertCanModify(existing, auth);

  if (input.assignedToId && input.assignedToId !== existing.assignedToId && auth.profile.role !== 'admin') {
    throw ApiError.forbidden('Only admins can reassign follow-ups');
  }

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.type !== undefined) patch.type = input.type;
  if (input.dueAt !== undefined) patch.due_at = input.dueAt;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.assignedToId !== undefined) patch.assigned_to = input.assignedToId;

  const { data, error } = await supabase.from('follow_ups').update(patch).eq('id', id).select(FOLLOW_UP_SELECT).single();
  if (error) throw new ApiError(400, 'Could not update follow-up');
  return mapFollowUp(data as unknown as FollowUpRow);
}

export async function completeFollowUp(
  supabase: SupabaseClient,
  id: string,
  auth: AuthContext
): Promise<FollowUp> {
  const existing = await getFollowUpOrThrow(supabase, id);
  assertCanModify(existing, auth);

  if (existing.completedAt) return existing;

  const { data, error } = await supabase
    .from('follow_ups')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
    .select(FOLLOW_UP_SELECT)
    .single();

  if (error) throw new ApiError(400, 'Could not complete follow-up');
  return mapFollowUp(data as unknown as FollowUpRow);
}

export async function deleteFollowUp(supabase: SupabaseClient, id: string, auth: AuthContext): Promise<void> {
  const existing = await getFollowUpOrThrow(supabase, id);
  assertCanModify(existing, auth);
  const { error } = await supabase.from('follow_ups').delete().eq('id', id);
  if (error) throw new ApiError(500, 'Could not delete follow-up');
}

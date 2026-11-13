import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthContext } from '../../types/express.js';
import type { ActivityType } from '../../domain/constants.js';
import type { CreateActivityInput, UpdateActivityInput } from './activities.schemas.js';

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  title: string;
  description: string;
  occurredAt: string;
  createdAt: string;
  createdBy: string;
  createdById: string;
}

interface ActivityRow {
  id: string;
  lead_id: string;
  type: string;
  subject: string;
  description: string | null;
  occurred_at: string;
  created_at: string;
  created_by: string;
  creator?: { id: string; full_name: string } | null;
}

const ACTIVITY_SELECT =
  'id, lead_id, type, subject, description, occurred_at, created_at, created_by, creator:profiles!activities_created_by_fkey(id, full_name)';

function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    leadId: row.lead_id,
    type: row.type as ActivityType,
    title: row.subject,
    description: row.description ?? '',
    occurredAt: row.occurred_at,
    createdAt: row.occurred_at ?? row.created_at,
    createdBy: row.creator?.full_name ?? 'Unknown user',
    createdById: row.created_by,
  };
}

export async function listActivities(supabase: SupabaseClient, leadId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select(ACTIVITY_SELECT)
    .eq('lead_id', leadId)
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (error) throw new ApiError(500, 'Failed to load activities');
  return ((data ?? []) as unknown as ActivityRow[]).map(mapActivity);
}

export async function listRecentActivities(supabase: SupabaseClient, limit = 6): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select(ACTIVITY_SELECT)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) throw new ApiError(500, 'Failed to load recent activity');
  return ((data ?? []) as unknown as ActivityRow[]).map(mapActivity);
}

export async function createActivity(
  supabase: SupabaseClient,
  leadId: string,
  input: CreateActivityInput,
  auth: AuthContext
): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert({
      lead_id: leadId,
      type: input.type,
      subject: input.title,
      description: input.description || null,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      created_by: auth.user.id,
    })
    .select(ACTIVITY_SELECT)
    .single();

  if (error) throw new ApiError(400, 'Could not record activity', { errors: [{ message: error.message }] });
  return mapActivity(data as unknown as ActivityRow);
}

async function getActivityOrThrow(supabase: SupabaseClient, id: string): Promise<Activity> {
  const { data, error } = await supabase.from('activities').select(ACTIVITY_SELECT).eq('id', id).maybeSingle();
  if (error) throw new ApiError(500, 'Failed to load activity');
  if (!data) throw ApiError.notFound('Activity not found or not accessible');
  return mapActivity(data as unknown as ActivityRow);
}

export async function updateActivity(
  supabase: SupabaseClient,
  id: string,
  input: UpdateActivityInput,
  auth: AuthContext
): Promise<Activity> {
  const existing = await getActivityOrThrow(supabase, id);
  if (auth.profile.role !== 'admin' && existing.createdById !== auth.user.id) {
    throw ApiError.forbidden('You can only edit activities you recorded');
  }

  const patch: Record<string, unknown> = {};
  if (input.type !== undefined) patch.type = input.type;
  if (input.title !== undefined) patch.subject = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.occurredAt !== undefined) patch.occurred_at = input.occurredAt;

  const { data, error } = await supabase.from('activities').update(patch).eq('id', id).select(ACTIVITY_SELECT).single();
  if (error) throw new ApiError(400, 'Could not update activity');
  return mapActivity(data as unknown as ActivityRow);
}

export async function deleteActivity(supabase: SupabaseClient, id: string, auth: AuthContext): Promise<void> {
  const existing = await getActivityOrThrow(supabase, id);
  if (auth.profile.role !== 'admin' && existing.createdById !== auth.user.id) {
    throw ApiError.forbidden('You can only delete activities you recorded');
  }
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw new ApiError(500, 'Could not delete activity');
}

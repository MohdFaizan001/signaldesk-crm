import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthContext } from '../../types/express.js';
import type { Profile, UserRole } from './profiles.types.js';

export const profileIdParamsSchema = z.object({ id: z.string().uuid('Invalid profile id') });

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    avatarUrl: z.string().trim().url().max(500).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided');

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'sales_rep']),
});

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role as UserRole,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PROFILE_SELECT = 'id, full_name, email, role, avatar_url, created_at, updated_at';

export async function getMe(supabase: SupabaseClient, userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_SELECT).eq('id', userId).single();
  if (error || !data) throw new ApiError(404, 'Profile not found');
  return mapProfile(data as ProfileRow);
}

export async function listProfiles(supabase: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_SELECT).order('full_name', { ascending: true });
  if (error) throw new ApiError(500, 'Failed to load profiles');
  return ((data ?? []) as ProfileRow[]).map(mapProfile);
}

export async function updateMyProfile(
  supabase: SupabaseClient,
  userId: string,
  input: { fullName?: string; avatarUrl?: string | null }
): Promise<Profile> {
  const patch: Record<string, unknown> = {};
  if (input.fullName !== undefined) patch.full_name = input.fullName;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;

  const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select(PROFILE_SELECT).single();
  if (error) throw new ApiError(400, 'Could not update profile');
  return mapProfile(data as ProfileRow);
}

export async function updateUserRole(
  supabase: SupabaseClient,
  targetId: string,
  role: UserRole,
  auth: AuthContext
): Promise<Profile> {
  if (targetId === auth.user.id) {
    throw ApiError.forbidden('You cannot change your own role');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', targetId)
    .select(PROFILE_SELECT)
    .single();

  if (error || !data) {
    throw new ApiError(400, 'Could not update role', { errors: [{ message: error?.message ?? 'Profile not found' }] });
  }
  return mapProfile(data as ProfileRow);
}

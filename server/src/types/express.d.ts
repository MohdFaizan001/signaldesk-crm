import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '../modules/profiles/profiles.types.js';

export interface AuthProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
}

export interface AuthContext {
  user: { id: string; email: string };
  profile: AuthProfile;
  token: string;
  supabase: SupabaseClient;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};

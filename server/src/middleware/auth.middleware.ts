import type { NextFunction, Request, Response } from 'express';
import { createUserClient, supabaseAuth } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthContext } from '../types/express.js';
import type { UserRole } from '../modules/profiles/profiles.types.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing Bearer access token');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) throw ApiError.unauthorized('Missing Bearer access token');

    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data.user) {
      throw ApiError.unauthorized('Invalid or expired access token');
    }

    const supabase = createUserClient(token);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw ApiError.forbidden('Profile not found for this account. Contact an administrator.');
    }

    const auth: AuthContext = {
      user: { id: data.user.id, email: data.user.email ?? profile.email },
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        role: profile.role as UserRole,
        avatarUrl: profile.avatar_url,
      },
      token,
      supabase,
    };

    req.auth = auth;
    next();
  } catch (error) {
    next(error);
  }
}

/** Route middleware factory for role-restricted endpoints. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) return next(ApiError.unauthorized());
    if (!roles.includes(auth.profile.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}

/** Access the guaranteed auth context inside protected handlers. */
export function getAuth(req: Request): AuthContext {
  if (!req.auth) throw ApiError.unauthorized();
  return req.auth;
}

export function isAdmin(req: Request): boolean {
  return req.auth?.profile.role === 'admin';
}

import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  getMe,
  listProfiles,
  profileIdParamsSchema,
  updateMyProfile,
  updateProfileSchema,
  updateRoleSchema,
  updateUserRole,
} from './profiles.service.js';
import type { UserRole } from './profiles.types.js';

export const profilesRouter = Router();

profilesRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const profile = await getMe(auth.supabase, auth.user.id);
    sendSuccess(res, profile, 'Profile loaded');
  })
);

profilesRouter.get(
  '/profiles',
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const profiles = await listProfiles(auth.supabase);
    sendSuccess(res, profiles, 'Profiles loaded');
  })
);

profilesRouter.patch(
  '/profiles/me',
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const body = res.locals.body as { fullName?: string; avatarUrl?: string | null };
    const profile = await updateMyProfile(auth.supabase, auth.user.id, body);
    sendSuccess(res, profile, 'Profile updated');
  })
);

profilesRouter.patch(
  '/profiles/:id/role',
  requireRole('admin'),
  validate({ params: profileIdParamsSchema, body: updateRoleSchema }),
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const { id } = res.locals.params as { id: string };
    const { role } = res.locals.body as { role: UserRole };
    const profile = await updateUserRole(auth.supabase, id, role, auth);
    sendSuccess(res, profile, 'Role updated');
  })
);

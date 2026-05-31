import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AuthUser } from '../domain';
import { store } from '../store';
import { AppError } from '../utils/http';
import { supabaseAdmin } from '../config/supabase';

function buildDemoUser(req: Request): AuthUser {
  const role = req.header('x-demo-role') === 'admin' ? 'admin' : 'user';
  return {
    id: req.header('x-demo-user-id') || 'demo-user',
    email: req.header('x-demo-user-email') || 'demo@safeswitch.local',
    name: req.header('x-demo-user-name') || 'Demo User',
    role
  };
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.header('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    let user: AuthUser | null = null;

    if (token && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data.user) {
        user = {
          id: data.user.id,
          email: data.user.email || 'unknown@safeswitch.local',
          name: (data.user.user_metadata?.name as string | undefined) || data.user.email || 'User',
          role: (data.user.user_metadata?.role as 'user' | 'admin' | undefined) || 'user'
        };
      }
    }

    if (!user) {
      if (!env.allowDemoAuth) {
        throw new AppError(401, 'Authentication required');
      }
      user = buildDemoUser(req);
    }

    req.user = user;
    req.profile = await store.ensureUserProfile(user);
    next();
  } catch (error) {
    next(error);
  }
}

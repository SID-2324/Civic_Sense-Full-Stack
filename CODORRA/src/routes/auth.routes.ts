import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { asyncHandler, AppError } from '../utils/http';
import { bootstrapSession } from '../services/auth.service';

const sessionSchema = z.object({
  mode: z.enum(['signin', 'signup']),
  role: z.enum(['user', 'government']),
  name: z.string().trim().min(1),
  email: z.string().email(),
  governmentId: z.string().trim().optional().nullable()
});

export const authRouter = Router();

authRouter.post('/session', asyncHandler(async (req, res) => {
  if (!env.allowDemoAuth) {
    throw new AppError(403, 'Demo authentication is disabled');
  }

  const payload = sessionSchema.parse(req.body);
  const profile = await bootstrapSession(payload);

  res.status(201).json({
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      government_id: profile.government_id ?? null
    }
  });
}));
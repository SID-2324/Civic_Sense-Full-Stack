import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/http';
import { activateEmergencyMode, getEmergencySnapshot } from '../services/emergency.service';

const emergencySchema = z.object({
  reason: z.string().min(3).optional(),
  caseId: z.string().min(3).optional(),
  exposureAnswers: z.object({
    publicInstagram: z.boolean().default(false),
    locationSharing: z.boolean().default(false),
    publicEmail: z.boolean().default(false),
    strangersFollow: z.boolean().default(false),
    sharedAddress: z.boolean().default(false),
    sharedPhone: z.boolean().default(false)
  }),
  threatAnswers: z.object({
    knowsAddress: z.boolean().default(false),
    knowsPhone: z.boolean().default(false),
    directThreats: z.boolean().default(false),
    stalking: z.boolean().default(false),
    violenceHistory: z.boolean().default(false)
  })
});

export const emergencyRouter = Router();

emergencyRouter.get('/current', authenticate, asyncHandler(async (req, res) => {
  const profile = await getEmergencySnapshot(req.profile!.id);
  res.json({ profile });
}));

emergencyRouter.post('/activate', authenticate, asyncHandler(async (req, res) => {
  const payload = emergencySchema.parse(req.body);
  const result = await activateEmergencyMode(req.profile!, payload);
  res.status(201).json(result);
}));

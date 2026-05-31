import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/http';
import { generateSafetyPlan, runExposureAssessment, runThreatAssessment } from '../services/assessment.service';

const exposureSchema = z.object({
  publicInstagram: z.boolean().default(false),
  locationSharing: z.boolean().default(false),
  publicEmail: z.boolean().default(false),
  strangersFollow: z.boolean().default(false),
  sharedAddress: z.boolean().default(false),
  sharedPhone: z.boolean().default(false)
});

const threatSchema = z.object({
  knowsAddress: z.boolean().default(false),
  knowsPhone: z.boolean().default(false),
  directThreats: z.boolean().default(false),
  stalking: z.boolean().default(false),
  violenceHistory: z.boolean().default(false)
});

const checklistSchema = z.object({
  exposureAnswers: exposureSchema,
  threatAnswers: threatSchema
});

export const assessmentRouter = Router();

assessmentRouter.post('/exposure', authenticate, asyncHandler(async (req, res) => {
  const answers = exposureSchema.parse(req.body);
  res.json(runExposureAssessment(answers));
}));

assessmentRouter.post('/threat', authenticate, asyncHandler(async (req, res) => {
  const answers = threatSchema.parse(req.body);
  res.json(runThreatAssessment(answers));
}));

assessmentRouter.post('/checklist', authenticate, asyncHandler(async (req, res) => {
  const payload = checklistSchema.parse(req.body);
  res.json(generateSafetyPlan(payload.exposureAnswers, payload.threatAnswers));
}));

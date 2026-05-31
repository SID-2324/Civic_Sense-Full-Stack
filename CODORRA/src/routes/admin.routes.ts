import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/require-role';
import { asyncHandler } from '../utils/http';
import { createAccessRequest, decideAccessRequest, listAccessRequests, listCitizens } from '../services/admin.service';

const createRequestSchema = z.object({
  targetUserId: z.string().min(1),
  officerName: z.string().min(2),
  reason: z.string().min(3),
  caseId: z.string().min(3)
});

const decideSchema = z.object({
  decision: z.enum(['approved', 'rejected'])
});

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('admin'));

adminRouter.get('/requests', asyncHandler(async (req, res) => {
  const targetUserId = typeof req.query.targetUserId === 'string' ? req.query.targetUserId : undefined;
  const requests = await listAccessRequests(targetUserId);
  res.json({ requests });
}));

adminRouter.get('/citizens', asyncHandler(async (_req, res) => {
  const citizens = await listCitizens();
  res.json({ citizens });
}));

adminRouter.post('/requests', asyncHandler(async (req, res) => {
  const payload = createRequestSchema.parse(req.body);
  const request = await createAccessRequest(req.profile!, payload);
  res.status(201).json(request);
}));

adminRouter.patch('/requests/:requestId', asyncHandler(async (req, res) => {
  const payload = decideSchema.parse(req.body);
  const requestId = String(req.params.requestId);
  const request = await decideAccessRequest(req.profile!, requestId, payload.decision);
  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  res.json(request);
}));

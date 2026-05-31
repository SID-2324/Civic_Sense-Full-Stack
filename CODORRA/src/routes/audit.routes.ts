import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/http';
import { listAuditLogs } from '../services/audit.service';

export const auditRouter = Router();

auditRouter.get('/', authenticate, asyncHandler(async (req, res) => {
  const actorId = typeof req.query.actorId === 'string' ? req.query.actorId : req.profile?.id;
  const logs = await listAuditLogs(actorId);
  res.json({ logs });
}));

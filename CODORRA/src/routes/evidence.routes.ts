import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { asyncHandler, AppError } from '../utils/http';
import { evidenceFileFilter, listUserEvidence, uploadEvidence } from '../services/evidence.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: evidenceFileFilter
});

const querySchema = z.object({
  caseId: z.string().optional(),
  label: z.string().min(1).optional()
});

export const evidenceRouter = Router();

evidenceRouter.get('/', authenticate, asyncHandler(async (req, res) => {
  const records = await listUserEvidence(req.profile!.id);
  res.json({ records });
}));

evidenceRouter.post('/', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, 'Evidence file is required');
  }

  const label = typeof req.body.label === 'string' && req.body.label.trim().length > 0 ? req.body.label.trim() : 'Evidence file';
  const parsed = querySchema.parse(req.body);
  const record = await uploadEvidence({
    user: req.profile!,
    label,
    caseId: parsed.caseId,
    file: req.file
  });

  res.status(201).json(record);
}));

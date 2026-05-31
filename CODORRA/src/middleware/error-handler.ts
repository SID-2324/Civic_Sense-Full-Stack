import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/http';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      issues: error.issues
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      details: error.details ?? null
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';
  res.status(500).json({ error: message });
}

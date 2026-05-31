import { NextFunction, Request, Response } from 'express';
import { Role } from '../domain';
import { AppError } from '../utils/http';

export function requireRole(requiredRole: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.profile || req.profile.role !== requiredRole) {
      return next(new AppError(403, 'Forbidden'));
    }

    return next();
  };
}

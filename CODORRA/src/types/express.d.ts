import { AuthUser, UserProfile } from '../domain';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      profile?: UserProfile;
    }
  }
}

export {};

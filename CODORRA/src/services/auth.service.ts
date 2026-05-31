import { randomUUID } from 'crypto';
import { AuthUser, UserProfile, Role } from '../domain';
import { store } from '../store';

export interface BootstrapSessionInput {
  mode: 'signin' | 'signup';
  role: 'user' | 'government';
  name: string;
  email: string;
  governmentId?: string | null;
}

function resolveStoredRole(role: BootstrapSessionInput['role']): Role {
  return role === 'government' ? 'admin' : 'user';
}

export async function bootstrapSession(input: BootstrapSessionInput): Promise<UserProfile> {
  const user: AuthUser = {
    id: randomUUID(),
    email: input.email,
    name: input.name,
    role: resolveStoredRole(input.role),
    government_id: input.governmentId ?? null
  };

  return store.ensureUserProfile(user);
}
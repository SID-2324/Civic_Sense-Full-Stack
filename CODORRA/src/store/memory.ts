import { randomUUID } from 'crypto';
import {
  AuditLogEntry,
  AuthUser,
  EmergencyProfile,
  EvidenceRecord,
  GovernmentRequest,
  NewAuditLogEntry,
  NewEmergencyProfile,
  NewEvidenceRecord,
  NewGovernmentRequest,
  NewSocialAccount,
  SocialAccount,
  UpdateGovernmentRequest,
  UpdateSocialAccount,
  UserProfile
} from '../domain';
import { DataStore } from './types';

function now(): string {
  return new Date().toISOString();
}

export class MemoryStore implements DataStore {
  kind: 'memory' = 'memory';
  private users = new Map<string, UserProfile>();
  private emergencyProfiles = new Map<string, EmergencyProfile>();
  private evidence: EvidenceRecord[] = [];
  private socialAccounts: SocialAccount[] = [];
  private requests: GovernmentRequest[] = [];
  private auditLogs: AuditLogEntry[] = [];

  async ensureUserProfile(user: AuthUser): Promise<UserProfile> {
    const existing = this.users.get(user.id);
    if (existing) {
      const updated: UserProfile = {
        ...existing,
        ...user,
        updated_at: now()
      };
      this.users.set(user.id, updated);
      return updated;
    }

    const profile: UserProfile = {
      ...user,
      created_at: now(),
      updated_at: now()
    };
    this.users.set(user.id, profile);
    return profile;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.users.get(userId) ?? null;
  }

  async upsertEmergencyProfile(profile: NewEmergencyProfile): Promise<EmergencyProfile> {
    const existing = this.emergencyProfiles.get(profile.user_id);
    const next: EmergencyProfile = {
      id: existing?.id ?? randomUUID(),
      created_at: existing?.created_at ?? now(),
      updated_at: now(),
      ...profile
    };
    this.emergencyProfiles.set(profile.user_id, next);
    return next;
  }

  async getEmergencyProfile(userId: string): Promise<EmergencyProfile | null> {
    return this.emergencyProfiles.get(userId) ?? null;
  }

  async addEvidence(record: NewEvidenceRecord): Promise<EvidenceRecord> {
    const saved: EvidenceRecord = {
      id: randomUUID(),
      created_at: now(),
      ...record
    };
    this.evidence.unshift(saved);
    return saved;
  }

  async listEvidence(userId: string): Promise<EvidenceRecord[]> {
    return this.evidence.filter((item) => item.user_id === userId);
  }

  async listSocialAccounts(userId: string): Promise<SocialAccount[]> {
    return this.socialAccounts.filter((item) => item.user_id === userId);
  }

  async createSocialAccount(account: NewSocialAccount): Promise<SocialAccount> {
    const saved: SocialAccount = {
      id: randomUUID(),
      created_at: now(),
      updated_at: now(),
      ...account
    };
    this.socialAccounts.unshift(saved);
    return saved;
  }

  async updateSocialAccount(accountId: string, patch: UpdateSocialAccount): Promise<SocialAccount | null> {
    const index = this.socialAccounts.findIndex((item) => item.id === accountId);
    if (index < 0) {
      return null;
    }

    const updated: SocialAccount = {
      ...this.socialAccounts[index],
      ...patch,
      updated_at: now()
    };
    this.socialAccounts[index] = updated;
    return updated;
  }

  async deleteSocialAccount(accountId: string): Promise<boolean> {
    const index = this.socialAccounts.findIndex((item) => item.id === accountId);
    if (index < 0) {
      return false;
    }

    this.socialAccounts.splice(index, 1);
    return true;
  }

  async createGovernmentRequest(request: NewGovernmentRequest): Promise<GovernmentRequest> {
    const saved: GovernmentRequest = {
      id: randomUUID(),
      created_at: now(),
      ...request
    };
    this.requests.unshift(saved);
    return saved;
  }

  async updateGovernmentRequest(requestId: string, patch: UpdateGovernmentRequest): Promise<GovernmentRequest | null> {
    const index = this.requests.findIndex((item) => item.id === requestId);
    if (index < 0) {
      return null;
    }

    const updated: GovernmentRequest = {
      ...this.requests[index],
      ...patch
    };
    this.requests[index] = updated;
    return updated;
  }

  async listGovernmentRequests(targetUserId?: string): Promise<GovernmentRequest[]> {
    const items = targetUserId ? this.requests.filter((item) => item.target_user_id === targetUserId) : this.requests;
    return [...items];
  }

  async addAuditLog(entry: NewAuditLogEntry): Promise<AuditLogEntry> {
    const saved: AuditLogEntry = {
      id: randomUUID(),
      created_at: now(),
      ...entry
    };
    this.auditLogs.unshift(saved);
    return saved;
  }

  async listAuditLogs(actorId?: string): Promise<AuditLogEntry[]> {
    const items = actorId ? this.auditLogs.filter((item) => item.actor_id === actorId) : this.auditLogs;
    return [...items];
  }
}

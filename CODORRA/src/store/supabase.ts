import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../config/supabase';
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
import { AppError } from '../utils/http';
import { DataStore } from './types';

function getClient() {
  if (!supabaseAdmin) {
    throw new AppError(500, 'Supabase is not configured');
  }

  return supabaseAdmin;
}

function mapUser(row: any): UserProfile {
  return row as UserProfile;
}

function mapEmergencyProfile(row: any): EmergencyProfile {
  return row as EmergencyProfile;
}

function mapEvidence(row: any): EvidenceRecord {
  return row as EvidenceRecord;
}

function mapRequest(row: any): GovernmentRequest {
  return row as GovernmentRequest;
}

function mapAudit(row: any): AuditLogEntry {
  return row as AuditLogEntry;
}

function mapSocialAccount(row: any): SocialAccount {
  return row as SocialAccount;
}

export class SupabaseStore implements DataStore {
  kind: 'supabase' = 'supabase';

  async ensureUserProfile(user: AuthUser): Promise<UserProfile> {
    const client = getClient();
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      government_id: user.government_id ?? null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client.from('users').upsert(payload, { onConflict: 'id' }).select('*').single();
    if (error) throw new AppError(500, error.message);
    return mapUser(data);
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const client = getClient();
    const { data, error } = await client.from('users').select('*').eq('id', userId).maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data ? mapUser(data) : null;
  }

  async upsertEmergencyProfile(profile: NewEmergencyProfile): Promise<EmergencyProfile> {
    const client = getClient();
    const payload = {
      id: randomUUID(),
      ...profile,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client.from('emergency_profiles').upsert(payload, { onConflict: 'user_id' }).select('*').single();
    if (error) throw new AppError(500, error.message);
    return mapEmergencyProfile(data);
  }

  async getEmergencyProfile(userId: string): Promise<EmergencyProfile | null> {
    const client = getClient();
    const { data, error } = await client.from('emergency_profiles').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data ? mapEmergencyProfile(data) : null;
  }

  async addEvidence(record: NewEvidenceRecord): Promise<EvidenceRecord> {
    const client = getClient();
    const payload = {
      id: randomUUID(),
      ...record
    };

    const { data, error } = await client.from('evidence').insert(payload).select('*').single();
    if (error) throw new AppError(500, error.message);
    return mapEvidence(data);
  }

  async listEvidence(userId: string): Promise<EvidenceRecord[]> {
    const client = getClient();
    const { data, error } = await client.from('evidence').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new AppError(500, error.message);
    return (data ?? []).map(mapEvidence);
  }

  async listSocialAccounts(userId: string): Promise<SocialAccount[]> {
    const client = getClient();
    const { data, error } = await client.from('social_accounts').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    if (error) throw new AppError(500, error.message);
    return (data ?? []).map(mapSocialAccount);
  }

  async createSocialAccount(account: NewSocialAccount): Promise<SocialAccount> {
    const client = getClient();
    const { data, error } = await client.from('social_accounts').insert(account).select('*').single();
    if (error) throw new AppError(500, error.message);
    return mapSocialAccount(data);
  }

  async updateSocialAccount(accountId: string, patch: UpdateSocialAccount): Promise<SocialAccount | null> {
    const client = getClient();
    const { data, error } = await client.from('social_accounts').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', accountId).select('*').maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data ? mapSocialAccount(data) : null;
  }

  async deleteSocialAccount(accountId: string): Promise<boolean> {
    const client = getClient();
    const { error } = await client.from('social_accounts').delete().eq('id', accountId);
    if (error) throw new AppError(500, error.message);
    return true;
  }

  async createGovernmentRequest(request: NewGovernmentRequest): Promise<GovernmentRequest> {
    const client = getClient();
    const payload = {
      id: randomUUID(),
      ...request
    };

    const { data, error } = await client.from('government_requests').insert(payload).select('*').single();
    if (error) throw new AppError(500, error.message);
    return mapRequest(data);
  }

  async updateGovernmentRequest(requestId: string, patch: UpdateGovernmentRequest): Promise<GovernmentRequest | null> {
    const client = getClient();
    const { data, error } = await client.from('government_requests').update(patch).eq('id', requestId).select('*').maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data ? mapRequest(data) : null;
  }

  async listGovernmentRequests(targetUserId?: string): Promise<GovernmentRequest[]> {
    const client = getClient();
    const query = client.from('government_requests').select('*').order('created_at', { ascending: false });
    const { data, error } = targetUserId ? await query.eq('target_user_id', targetUserId) : await query;
    if (error) throw new AppError(500, error.message);
    return (data ?? []).map(mapRequest);
  }

  async addAuditLog(entry: NewAuditLogEntry): Promise<AuditLogEntry> {
    const client = getClient();
    const payload = {
      ...entry
    };

    const { data, error } = await client.from('audit_logs').insert(payload).select('*').single();
    if (error) throw new AppError(500, error.message);
    return mapAudit(data);
  }

  async listAuditLogs(actorId?: string): Promise<AuditLogEntry[]> {
    const client = getClient();
    const query = client.from('audit_logs').select('*').order('created_at', { ascending: false });
    const { data, error } = actorId ? await query.eq('actor_id', actorId) : await query;
    if (error) throw new AppError(500, error.message);
    return (data ?? []).map(mapAudit);
  }
}

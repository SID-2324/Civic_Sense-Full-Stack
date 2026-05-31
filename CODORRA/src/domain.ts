export type Role = 'user' | 'admin';
export type EmergencyStatus = 'inactive' | 'active';
export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  government_id?: string | null;
}

export interface UserProfile extends AuthUser {
  created_at: string;
  updated_at: string;
}

export interface ExposureAnswers {
  publicInstagram?: boolean;
  locationSharing?: boolean;
  publicEmail?: boolean;
  strangersFollow?: boolean;
  sharedAddress?: boolean;
  sharedPhone?: boolean;
}

export interface ThreatAnswers {
  knowsAddress?: boolean;
  knowsPhone?: boolean;
  directThreats?: boolean;
  stalking?: boolean;
  violenceHistory?: boolean;
}

export interface EmergencyProfile {
  id: string;
  user_id: string;
  status: EmergencyStatus;
  risk_score: number;
  threat_level: ThreatLevel;
  exposure_score: number;
  case_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewEmergencyProfile {
  user_id: string;
  status: EmergencyStatus;
  risk_score: number;
  threat_level: ThreatLevel;
  exposure_score: number;
  case_id: string;
  active: boolean;
}

export interface EvidenceRecord {
  id: string;
  user_id: string;
  case_id: string;
  label: string;
  file_name: string;
  mime_type: string;
  file_url: string;
  encrypted: boolean;
  created_at: string;
}

export interface NewEvidenceRecord {
  user_id: string;
  case_id: string;
  label: string;
  file_name: string;
  mime_type: string;
  file_url: string;
  encrypted: boolean;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  name: string;
  handle: string;
  active: boolean;
  linked_since: string;
  created_at: string;
  updated_at: string;
}

export interface NewSocialAccount {
  user_id: string;
  name: string;
  handle: string;
  active: boolean;
  linked_since: string;
}

export interface UpdateSocialAccount {
  name?: string;
  handle?: string;
  active?: boolean;
  linked_since?: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface GovernmentRequest {
  id: string;
  target_user_id: string;
  officer_name: string;
  reason: string;
  case_id: string;
  status: RequestStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface NewGovernmentRequest {
  target_user_id: string;
  officer_name: string;
  reason: string;
  case_id: string;
  status: RequestStatus;
  decided_by: string | null;
  decided_at: string | null;
}

export interface UpdateGovernmentRequest {
  status?: RequestStatus;
  decided_by?: string | null;
  decided_at?: string | null;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_role: Role;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NewAuditLogEntry {
  actor_id: string | null;
  actor_role: Role;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
}

import { supabaseAdmin } from '../config/supabase';
import { AuthUser } from '../domain';
import { store } from '../store';
import { AppError } from '../utils/http';

export interface CitizenDocumentSummary {
  id: string;
  name: string;
  issuer: string;
  size: string;
  accessGranted: boolean;
  lastAccessed: string | null;
}

export interface CitizenSocialSummary {
  id: string;
  name: string;
  handle: string;
  active: boolean;
}

export interface CitizenRequestSummary {
  docId: string;
  docName: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface CitizenPortalEntry {
  id: string;
  name: string;
  uid: string;
  city: string;
  docs: CitizenDocumentSummary[];
  social: CitizenSocialSummary[];
  requests: CitizenRequestSummary[];
}

function requireClient() {
  if (!supabaseAdmin) {
    throw new AppError(500, 'Supabase is not configured');
  }

  return supabaseAdmin;
}

export async function createAccessRequest(actor: AuthUser, input: { targetUserId: string; officerName: string; reason: string; caseId: string }) {
  const request = await store.createGovernmentRequest({
    target_user_id: input.targetUserId,
    officer_name: input.officerName,
    reason: input.reason,
    case_id: input.caseId,
    status: 'pending',
    decided_by: null,
    decided_at: null
  });

  await store.addAuditLog({
    actor_id: actor.id,
    actor_role: actor.role,
    action: 'Access Requested',
    entity_type: 'government_requests',
    entity_id: request.id,
    metadata: {
      targetUserId: input.targetUserId,
      officerName: input.officerName,
      reason: input.reason,
      caseId: input.caseId
    }
  });

  return request;
}

export async function decideAccessRequest(actor: AuthUser, requestId: string, decision: 'approved' | 'rejected') {
  const request = await store.updateGovernmentRequest(requestId, {
    status: decision,
    decided_by: actor.id,
    decided_at: new Date().toISOString()
  });

  if (request) {
    await store.addAuditLog({
      actor_id: actor.id,
      actor_role: actor.role,
      action: decision === 'approved' ? 'Access Granted' : 'Access Denied',
      entity_type: 'government_requests',
      entity_id: request.id,
      metadata: {
        caseId: request.case_id,
        targetUserId: request.target_user_id,
        officerName: request.officer_name
      }
    });
  }

  return request;
}

export async function listAccessRequests(targetUserId?: string) {
  return store.listGovernmentRequests(targetUserId);
}

export async function listCitizens(): Promise<CitizenPortalEntry[]> {
  const client = requireClient();

  const [usersResult, docsResult, socialResult, requestsResult] = await Promise.all([
    client.from('users').select('*').order('created_at', { ascending: true }),
    client.from('documents').select('*').order('created_at', { ascending: true }),
    client.from('social_accounts').select('*').order('created_at', { ascending: true }),
    client.from('government_requests').select('*').order('created_at', { ascending: false })
  ]);

  const results = [usersResult, docsResult, socialResult, requestsResult];
  const firstError = results.find((result) => result.error);
  if (firstError?.error) {
    throw new AppError(500, firstError.error.message);
  }

  const users = usersResult.data ?? [];
  const documents = docsResult.data ?? [];
  const socialAccounts = socialResult.data ?? [];
  const requests = requestsResult.data ?? [];

  const documentsByOwner = new Map<string, any[]>();
  for (const document of documents) {
    const ownerId = String(document.owner_id ?? document.user_id ?? '');
    if (!ownerId) continue;
    const list = documentsByOwner.get(ownerId) ?? [];
    list.push(document);
    documentsByOwner.set(ownerId, list);
  }

  const socialByUser = new Map<string, any[]>();
  for (const account of socialAccounts) {
    const userId = String(account.user_id ?? '');
    if (!userId) continue;
    const list = socialByUser.get(userId) ?? [];
    list.push(account);
    socialByUser.set(userId, list);
  }

  const requestsByTarget = new Map<string, any[]>();
  for (const request of requests) {
    const userId = String(request.target_user_id ?? '');
    if (!userId) continue;
    const list = requestsByTarget.get(userId) ?? [];
    list.push(request);
    requestsByTarget.set(userId, list);
  }

  return users.map((user: any) => {
    const userDocuments = documentsByOwner.get(user.id) ?? [];
    const userRequests = requestsByTarget.get(user.id) ?? [];

    return {
      id: user.id,
      name: user.name,
      uid: user.government_id || user.id,
      city: user.city || 'Unknown',
      docs: userDocuments.map((document) => ({
        id: document.id,
        name: document.name || document.label || 'Document',
        issuer: document.issuer || document.source || 'Issued Record',
        size: document.size || document.file_size || '—',
        accessGranted: Boolean(document.access_granted ?? document.metadata?.accessGranted ?? false),
        lastAccessed: document.last_accessed ?? null
      })),
      social: (socialByUser.get(user.id) ?? []).map((account) => ({
        id: account.id,
        name: account.name,
        handle: account.handle,
        active: Boolean(account.active)
      })),
      requests: userRequests.map((request) => ({
        docId: request.case_id || request.document_id || request.id,
        docName: request.reason || 'Access request',
        status: request.status,
        date: new Date(request.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      }))
    };
  });
}

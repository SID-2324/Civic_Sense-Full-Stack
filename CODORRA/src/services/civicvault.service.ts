import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { AuthUser } from '../domain';
import { store } from '../store';
import { AppError } from '../utils/http';

type CivicVaultSection = 'bank' | 'govt';
type AccessStatus = 'pending' | 'approved' | 'denied';

type SocialAccount = {
  id: string;
  name: string;
  handle: string;
  active: boolean;
  linkedSince: string;
};

interface CivicVaultRequest {
  id: string;
  by: string;
  date: string;
  status: AccessStatus;
}

interface CivicVaultDocumentBase {
  id: string;
  name: string;
  size: string;
  accessGranted: boolean;
  lastAccessed: string | null;
  requests: CivicVaultRequest[];
}

interface BankDocument extends CivicVaultDocumentBase {
  period: string;
}

interface GovtDocument extends CivicVaultDocumentBase {
  issuer: string;
}

interface CivicVaultState {
  bank: BankDocument[];
  govt: GovtDocument[];
  social: SocialAccount[];
}

type CivicVaultMetadata = {
  size?: string;
  period?: string;
  issuer?: string;
  accessGranted?: boolean;
  lastAccessed?: string | null;
};

type CivicVaultSocialAccountRow = {
  id: string;
  user_id: string;
  name: string;
  handle: string;
  active: boolean;
  linked_since: string;
  created_at: string;
  updated_at: string;
};

type CivicVaultSectionRow = {
  id: string;
  name: string;
  description: string | null;
};

type CivicVaultDocumentRow = {
  id: string;
  section_id: string | null;
  title: string;
  owner_id: string | null;
  metadata: CivicVaultMetadata | null;
  uploaded_at: string;
};

type CivicVaultAccessRow = {
  id: string;
  document_id: string;
  grantee_id: string | null;
  permission: string;
  granted_by: string | null;
  revoked: boolean;
  revoked_at: string | null;
  created_at: string;
};

type CivicVaultRequestRow = {
  id: string;
  document_id: string;
  requester_id: string | null;
  reason: string | null;
  status: AccessStatus;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
};

interface CivicVaultActivityEntry {
  doc: string;
  action: string;
  date: string;
  color: string;
}

interface CivicVaultDashboard {
  sections: {
    bank: BankDocument[];
    govt: GovtDocument[];
  };
  social: SocialAccount[];
  stats: {
    totalDocs: number;
    openDocs: number;
    pendingCount: number;
  };
  activity: CivicVaultActivityEntry[];
}

function now(): string {
  return new Date().toISOString();
}

function displayDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function buildActivity(state: CivicVaultState): CivicVaultActivityEntry[] {
  const events: CivicVaultActivityEntry[] = [];

  const documents = [...state.bank, ...state.govt];
  documents.forEach((document) => {
    if (document.lastAccessed) {
      events.push({
        doc: document.name,
        action: 'Accessed',
        date: document.lastAccessed,
        color: '#3b82f6'
      });
    }

    document.requests.forEach((request) => {
      events.push({
        doc: document.name,
        action: request.status === 'pending' ? `Request by ${request.by}` : `${request.status} - ${request.by}`,
        date: request.date,
        color: request.status === 'pending' ? '#f59e0b' : request.status === 'approved' ? '#22c55e' : '#ef4444'
      });
    });
  });

  state.social.forEach((account) => {
    events.push({
      doc: account.name,
      action: account.active ? 'Account Active' : 'Account Inactive',
      date: `Linked ${account.linkedSince}`,
      color: account.active ? '#22c55e' : '#94a3b8'
    });
  });

  return events;
}

function buildDashboard(state: CivicVaultState): CivicVaultDashboard {
  const docs = [...state.bank, ...state.govt];
  const pendingCount = docs.reduce(
    (count, document) => count + document.requests.filter((request) => request.status === 'pending').length,
    0
  );

  return {
    sections: {
      bank: state.bank.map((doc) => ({ ...doc, requests: doc.requests.map((request) => ({ ...request })) })),
      govt: state.govt.map((doc) => ({ ...doc, requests: doc.requests.map((request) => ({ ...request })) }))
    },
    social: state.social.map((account) => ({ ...account })),
    stats: {
      totalDocs: docs.length,
      openDocs: docs.filter((document) => document.accessGranted).length,
      pendingCount
    },
    activity: buildActivity(state)
  };
}

function getSupabaseClient() {
  if (!supabaseAdmin) {
    throw new AppError(500, 'Supabase is not configured');
  }

  return supabaseAdmin;
}

function normalizeMetadata(metadata: unknown): CivicVaultMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  return metadata as CivicVaultMetadata;
}

function formatLinkedSince(date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function mapSocialAccountRow(row: CivicVaultSocialAccountRow): SocialAccount {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    active: row.active,
    linkedSince: row.linked_since
  };
}

function mapRequests(rows: CivicVaultRequestRow[] | null | undefined): CivicVaultRequest[] {
  return (rows ?? []).map((request) => ({
    id: request.id,
    by: request.reason ?? 'Unknown requester',
    date: displayDate(request.created_at),
    status: request.status
  }));
}

function mapDocumentRow(
  section: CivicVaultSection,
  row: CivicVaultDocumentRow,
  requests: CivicVaultRequest[]
): BankDocument | GovtDocument | null {
  const metadata = normalizeMetadata(row.metadata);
  const accessGranted = typeof metadata.accessGranted === 'boolean' ? metadata.accessGranted : false;
  const lastAccessed = metadata.lastAccessed ?? null;

  if (section === 'bank') {
    return {
      id: row.id,
      name: row.title,
      period: metadata.period ?? 'Unknown period',
      size: metadata.size ?? 'Unknown size',
      accessGranted,
      lastAccessed,
      requests
    };
  }

  if (section === 'govt') {
    return {
      id: row.id,
      name: row.title,
      issuer: metadata.issuer ?? 'Unknown issuer',
      size: metadata.size ?? 'Unknown size',
      accessGranted,
      lastAccessed,
      requests
    };
  }

  return null;
}

async function loadSupabaseDashboard(user: AuthUser): Promise<CivicVaultDashboard> {
  const client = getSupabaseClient();
  const { data: sectionRows, error: sectionsError } = await client
    .from('document_sections')
    .select('id,name,description')
    .order('name', { ascending: true });

  if (sectionsError) {
    throw new AppError(500, sectionsError.message);
  }

  const sections = (sectionRows ?? []) as CivicVaultSectionRow[];
  const { data: documentRows, error: documentsError } = await client
    .from('documents')
    .select('id,section_id,title,owner_id,metadata,uploaded_at')
    .eq('owner_id', user.id)
    .order('uploaded_at', { ascending: true });

  if (documentsError) {
    throw new AppError(500, documentsError.message);
  }

  const documents = (documentRows ?? []) as CivicVaultDocumentRow[];
  const documentIds = documents.map((document) => document.id);

  const { data: accessRows, error: accessError } = await client
    .from('document_access')
    .select('id,document_id,grantee_id,permission,granted_by,revoked,revoked_at,created_at')
    .eq('grantee_id', user.id)
    .order('created_at', { ascending: false });

  if (accessError) {
    throw new AppError(500, accessError.message);
  }

  const accessByDocument = new Map<string, CivicVaultAccessRow>();
  ((accessRows ?? []) as CivicVaultAccessRow[]).forEach((row) => {
    if (!accessByDocument.has(row.document_id)) {
      accessByDocument.set(row.document_id, row);
    }
  });

  const { data: requestRows, error: requestError } = documentIds.length > 0
    ? await client
      .from('access_requests')
      .select('id,document_id,requester_id,reason,status,decided_by,decided_at,decision_note,created_at')
      .in('document_id', documentIds)
      .order('created_at', { ascending: true })
    : { data: [], error: null };

  if (requestError) {
    throw new AppError(500, requestError.message);
  }

  const requestsByDocument = new Map<string, CivicVaultRequest[]>();
  ((requestRows ?? []) as CivicVaultRequestRow[]).forEach((row) => {
    const requests = requestsByDocument.get(row.document_id) ?? [];
    requests.push({
      id: row.id,
      by: row.reason ?? 'Unknown requester',
      date: displayDate(row.created_at),
      status: row.status
    });
    requestsByDocument.set(row.document_id, requests);
  });

  const { data: socialRows, error: socialError } = await client
    .from('social_accounts')
    .select('id,user_id,name,handle,active,linked_since,created_at,updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (socialError) {
    throw new AppError(500, socialError.message);
  }

  const sectionLookup = new Map(sections.map((section) => [section.id, section.name as CivicVaultSection]));
  const state: CivicVaultState = {
    bank: [],
    govt: [],
    social: []
  };

  documents.forEach((document) => {
    const section = document.section_id ? sectionLookup.get(document.section_id) : null;
    if (!section) {
      return;
    }

    const metadata = normalizeMetadata(document.metadata);
    const accessRow = accessByDocument.get(document.id);
    const accessGranted = accessRow ? !accessRow.revoked : Boolean(metadata.accessGranted);
    const requests = requestsByDocument.get(document.id) ?? [];
    const mapped = mapDocumentRow(
      section,
      {
        ...document,
        metadata: {
          ...metadata,
          accessGranted,
          lastAccessed: metadata.lastAccessed ?? null
        }
      },
      requests
    );

    if (!mapped) {
      return;
    }

    state[section].push(mapped as BankDocument & GovtDocument);
  });

  (socialRows ?? []).forEach((row) => {
    state.social.push(mapSocialAccountRow(row as CivicVaultSocialAccountRow));
  });

  return buildDashboard(state);
}

async function updateSupabaseDocumentAccess(user: AuthUser, documentId: string, accessGranted: boolean): Promise<void> {
  const client = getSupabaseClient();

  const { data: documentRow, error: documentError } = await client
    .from('documents')
    .select('id,metadata')
    .eq('id', documentId)
    .maybeSingle();

  if (documentError) {
    throw new AppError(500, documentError.message);
  }

  if (!documentRow) {
    throw new Error('Document not found');
  }

  const currentMetadata = normalizeMetadata(documentRow.metadata);
  const nextMetadata = {
    ...currentMetadata,
    accessGranted,
    lastAccessed: accessGranted ? displayDate(now()) : currentMetadata.lastAccessed ?? null
  };

  const { error: updateError } = await client.from('documents').update({ metadata: nextMetadata }).eq('id', documentId);

  if (updateError) {
    throw new AppError(500, updateError.message);
  }

  const { data: accessRow, error: accessRowError } = await client
    .from('document_access')
    .select('id')
    .eq('document_id', documentId)
    .eq('grantee_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (accessRowError) {
    throw new AppError(500, accessRowError.message);
  }

  if (accessRow) {
    const { error: accessUpdateError } = await client
      .from('document_access')
      .update({
        revoked: !accessGranted,
        revoked_at: accessGranted ? null : now()
      })
      .eq('id', accessRow.id);

    if (accessUpdateError) {
      throw new AppError(500, accessUpdateError.message);
    }
    return;
  }

  const { error: accessInsertError } = await client.from('document_access').insert({
    document_id: documentId,
    grantee_id: user.id,
    permission: 'read',
    granted_by: user.id,
    revoked: !accessGranted,
    revoked_at: accessGranted ? null : now()
  });

  if (accessInsertError) {
    throw new AppError(500, accessInsertError.message);
  }
}

async function updateSupabaseRequestDecision(
  user: AuthUser,
  documentId: string,
  requestId: string,
  decision: 'approved' | 'denied'
): Promise<void> {
  const client = getSupabaseClient();

  const { data: requestRow, error: requestError } = await client
    .from('access_requests')
    .select('id,document_id,status')
    .eq('id', requestId)
    .eq('document_id', documentId)
    .maybeSingle();

  if (requestError) {
    throw new AppError(500, requestError.message);
  }

  if (!requestRow) {
    throw new Error('Request not found');
  }

  const { error: updateError } = await client
    .from('access_requests')
    .update({
      status: decision,
      decided_by: user.id,
      decided_at: now(),
      decision_note: decision === 'approved' ? 'Access approved from CivicVault dashboard' : 'Access denied from CivicVault dashboard'
    })
    .eq('id', requestId);

  if (updateError) {
    throw new AppError(500, updateError.message);
  }

  if (decision === 'approved') {
    await updateSupabaseDocumentAccess(user, documentId, true);
  }
}

async function revokeAllSupabaseAccess(user: AuthUser): Promise<void> {
  const client = getSupabaseClient();

  const { data: documentRows, error: documentsError } = await client
    .from('documents')
    .select('id,metadata')
    .eq('owner_id', user.id);

  if (documentsError) {
    throw new AppError(500, documentsError.message);
  }

  const documents = (documentRows ?? []) as Array<{ id: string; metadata: CivicVaultMetadata | null }>;

  for (const document of documents) {
    const nextMetadata = {
      ...normalizeMetadata(document.metadata),
      accessGranted: false
    };

    const { error: updateError } = await client.from('documents').update({ metadata: nextMetadata }).eq('id', document.id);

    if (updateError) {
      throw new AppError(500, updateError.message);
    }
  }

  const { data: accessRows, error: accessError } = await client
    .from('document_access')
    .select('id')
    .eq('grantee_id', user.id)
    .eq('revoked', false);

  if (accessError) {
    throw new AppError(500, accessError.message);
  }

  for (const accessRow of (accessRows ?? []) as Array<{ id: string }>) {
    const { error: updateError } = await client.from('document_access').update({ revoked: true, revoked_at: now() }).eq('id', accessRow.id);

    if (updateError) {
      throw new AppError(500, updateError.message);
    }
  }

  const { error: socialUpdateError } = await client
    .from('social_accounts')
    .update({ active: false, updated_at: now() })
    .eq('user_id', user.id)
    .eq('active', true);

  if (socialUpdateError) {
    throw new AppError(500, socialUpdateError.message);
  }
}

async function recordAudit(
  user: AuthUser,
  action: string,
  entityId: string | null,
  metadata: Record<string, unknown>,
  entityType = 'civicvault_documents'
) {
  await store.addAuditLog({
    actor_id: user.id,
    actor_role: user.role,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata
  });
}

async function loadSocialAccount(user: AuthUser, accountId: string): Promise<SocialAccount | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('social_accounts')
    .select('id,user_id,name,handle,active,linked_since,created_at,updated_at')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message);
  }

  return data ? mapSocialAccountRow(data as CivicVaultSocialAccountRow) : null;
}

async function toggleSupabaseSocialAccount(user: AuthUser, accountId: string): Promise<void> {
  const client = getSupabaseClient();
  const account = await loadSocialAccount(user, accountId);

  if (!account) {
    throw new Error('Social account not found');
  }

  const nextActive = !account.active;
  const { error: updateError } = await client
    .from('social_accounts')
    .update({ active: nextActive, updated_at: now() })
    .eq('id', accountId)
    .eq('user_id', user.id);

  if (updateError) {
    throw new AppError(500, updateError.message);
  }

  await recordAudit(
    user,
    nextActive ? 'CivicVault Social Account Activated' : 'CivicVault Social Account Deactivated',
    accountId,
    { name: account.name, handle: account.handle, active: nextActive },
    'social_accounts'
  );
}

async function createSupabaseSocialAccount(user: AuthUser, name: string, handle: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('social_accounts').insert({
    user_id: user.id,
    name,
    handle,
    active: false,
    linked_since: formatLinkedSince()
  });

  if (error) {
    throw new AppError(500, error.message);
  }

  await recordAudit(user, 'CivicVault Social Account Linked', null, { name, handle }, 'social_accounts');
}

async function deleteSupabaseSocialAccount(user: AuthUser, accountId: string): Promise<void> {
  const account = await loadSocialAccount(user, accountId);

  if (!account) {
    throw new Error('Social account not found');
  }

  const client = getSupabaseClient();
  const { error } = await client.from('social_accounts').delete().eq('id', accountId).eq('user_id', user.id);

  if (error) {
    throw new AppError(500, error.message);
  }

  await recordAudit(user, 'CivicVault Social Account Deleted', accountId, { name: account.name, handle: account.handle }, 'social_accounts');
}

export async function getDashboard(user: AuthUser): Promise<CivicVaultDashboard> {
  if (!supabaseAdmin) {
    throw new AppError(500, 'Supabase is not configured');
  }

  return loadSupabaseDashboard(user);
}

export async function toggleDocumentAccess(user: AuthUser, section: CivicVaultSection, documentId: string): Promise<CivicVaultDashboard> {
  if (!supabaseAdmin) {
    throw new AppError(500, 'Supabase is not configured');
  }

  const dashboardBefore = await loadSupabaseDashboard(user);
  const document = dashboardBefore.sections[section].find((item) => item.id === documentId);

  if (!document) {
    throw new Error('Document not found');
  }

  const nextAccessGranted = !document.accessGranted;
  await updateSupabaseDocumentAccess(user, documentId, nextAccessGranted);

  await recordAudit(
    user,
    nextAccessGranted ? 'CivicVault Access Opened' : 'CivicVault Access Closed',
    documentId,
    { section, documentId, accessGranted: nextAccessGranted }
  );

  return loadSupabaseDashboard(user);
}

export async function decideDocumentRequest(
  user: AuthUser,
  section: CivicVaultSection,
  documentId: string,
  requestId: string,
  decision: 'approved' | 'denied'
): Promise<CivicVaultDashboard> {
  if (!supabaseAdmin) {
    throw new AppError(500, 'Supabase is not configured');
  }

  const dashboardBefore = await loadSupabaseDashboard(user);
  const document = dashboardBefore.sections[section].find((item) => item.id === documentId);

  if (!document) {
    throw new Error('Document not found');
  }

  const request = document.requests.find((item) => item.id === requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  // persist decision to Supabase
  await updateSupabaseRequestDecision(user, documentId, requestId, decision);

  await recordAudit(
    user,
    decision === 'approved' ? 'CivicVault Request Approved' : 'CivicVault Request Denied',
    documentId,
    { section, documentId, requestId, decision, requester: request.by }
  );

  return loadSupabaseDashboard(user);
}

export async function emergencyRevokeAll(user: AuthUser): Promise<CivicVaultDashboard> {
  if (!supabaseAdmin) {
    throw new AppError(500, 'Supabase is not configured');
  }

  await revokeAllSupabaseAccess(user);

  await recordAudit(user, 'CivicVault Emergency Revoke All', null, { revokedAt: now() });

  return loadSupabaseDashboard(user);
}

export async function toggleSocialAccount(user: AuthUser, accountId: string): Promise<CivicVaultDashboard> {
  if (!supabaseAdmin) {
    throw new AppError(500, 'Supabase is not configured');
  }

  await toggleSupabaseSocialAccount(user, accountId);
  return loadSupabaseDashboard(user);
}

export async function createSocialAccount(user: AuthUser, name: string, handle: string): Promise<CivicVaultDashboard> {
  if (!supabaseAdmin) {
    throw new AppError(500, 'Supabase is not configured');
  }

  await createSupabaseSocialAccount(user, name, handle);
  return loadSupabaseDashboard(user);
}

export async function deleteSocialAccount(user: AuthUser, accountId: string): Promise<CivicVaultDashboard> {
  if (!supabaseAdmin) {
    throw new AppError(500, 'Supabase is not configured');
  }

  await deleteSupabaseSocialAccount(user, accountId);
  return loadSupabaseDashboard(user);
}

export function generateRequestId(): string {
  return randomUUID();
}
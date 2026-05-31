import { randomUUID } from 'crypto';
import { FileFilterCallback } from 'multer';
import { env } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import { AuthUser } from '../domain';
import { store } from '../store';
import { encryptBuffer } from '../utils/crypto';
import { AppError } from '../utils/http';

export interface EvidenceUploadInput {
  user: AuthUser;
  label: string;
  caseId?: string;
  file: Express.Multer.File;
}

export function evidenceFileFilter(_req: Express.Request, file: Express.Multer.File, callback: FileFilterCallback): void {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain'
  ];

  if (!allowed.includes(file.mimetype)) {
    callback(new AppError(400, 'Unsupported evidence file type'));
    return;
  }

  callback(null, true);
}

export async function uploadEvidence(input: EvidenceUploadInput) {
  const encrypted = encryptBuffer(input.file.buffer);
  const caseId = input.caseId || `CASE-${randomUUID().slice(0, 8).toUpperCase()}`;
  const storagePath = `${input.user.id}/${caseId}/${Date.now()}-${input.file.originalname}.enc`;

  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.storage.from(env.supabaseStorageBucket).upload(storagePath, encrypted.ciphertext, {
      contentType: 'application/octet-stream',
      upsert: false
    });

    if (error) {
      throw new AppError(500, error.message);
    }
  }

  const record = await store.addEvidence({
    user_id: input.user.id,
    case_id: caseId,
    label: input.label,
    file_name: input.file.originalname,
    mime_type: input.file.mimetype,
    file_url: `storage://${storagePath}?iv=${encrypted.iv}&tag=${encrypted.authTag}`,
    encrypted: true
  });

  await store.addAuditLog({
    actor_id: input.user.id,
    actor_role: input.user.role,
    action: 'Evidence Uploaded',
    entity_type: 'evidence',
    entity_id: record.id,
    metadata: {
      caseId,
      label: input.label,
      fileName: input.file.originalname,
      mimeType: input.file.mimetype
    }
  });

  return record;
}

export async function listUserEvidence(userId: string) {
  return store.listEvidence(userId);
}

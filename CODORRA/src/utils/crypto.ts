import { createCipheriv, createHash, randomBytes } from 'crypto';
import { env } from '../config/env';

function deriveKey(): Buffer {
  return createHash('sha256').update(env.appEncryptionSecret).digest();
}

export function encryptBuffer(input: Buffer): { iv: string; authTag: string; ciphertext: Buffer } {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(input), cipher.final()]);
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    authTag,
    ciphertext
  };
}

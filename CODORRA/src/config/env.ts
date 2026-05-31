import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SUPABASE_STORAGE_BUCKET: z.string().default('safeswitch-evidence'),
  APP_ENCRYPTION_SECRET: z.string().default('change-me-in-production'),
  ALLOW_DEMO_AUTH: z.enum(['true', 'false']).default('true'),
  NODE_ENV: z.string().default('development')
});

const parsed = envSchema.parse(process.env);
const corsOrigins = parsed.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

export const env = {
  port: parsed.PORT,
  corsOrigin: parsed.CORS_ORIGIN,
  corsOrigins,
  supabaseUrl: parsed.SUPABASE_URL,
  supabaseServiceRoleKey: parsed.SUPABASE_SERVICE_ROLE_KEY,
  supabaseStorageBucket: parsed.SUPABASE_STORAGE_BUCKET,
  appEncryptionSecret: parsed.APP_ENCRYPTION_SECRET,
  allowDemoAuth: parsed.ALLOW_DEMO_AUTH === 'true',
  nodeEnv: parsed.NODE_ENV,
  hasSupabase: Boolean(parsed.SUPABASE_URL && parsed.SUPABASE_SERVICE_ROLE_KEY)
};

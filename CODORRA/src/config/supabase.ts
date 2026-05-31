import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabaseAdmin: SupabaseClient | null = env.hasSupabase
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

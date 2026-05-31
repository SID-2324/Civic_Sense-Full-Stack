import { env } from '../config/env';
import { DataStore } from './types';
import { MemoryStore } from './memory';
import { SupabaseStore } from './supabase';

export const store: DataStore = env.hasSupabase ? new SupabaseStore() : new MemoryStore();

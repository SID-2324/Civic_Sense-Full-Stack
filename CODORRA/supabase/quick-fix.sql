-- Quick fix: Apply only the missing tables and columns that smoke tests need.
-- This is extracted from 001_init.sql and 002_civicvault.sql
-- Paste this into Supabase SQL Editor and run.

-- Drop existing tables if they have wrong schema (to recreate them correctly)
DROP TABLE IF EXISTS emergency_profiles CASCADE;
DROP TABLE IF EXISTS evidence CASCADE;
DROP TABLE IF EXISTS government_requests CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- 1) emergency_profiles table (with UNIQUE constraint for ON CONFLICT)
create table emergency_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  status text not null default 'inactive',
  risk_score integer not null default 0,
  threat_level text not null default 'low',
  exposure_score integer not null default 0,
  case_id text,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) evidence table
create table evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  case_id text,
  label text not null,
  file_name text not null,
  mime_type text not null,
  file_url text not null,
  encrypted boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3) Ensure documents.created_at exists (backfill from uploaded_at if missing)
ALTER TABLE IF EXISTS public.documents
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

UPDATE public.documents SET created_at = uploaded_at WHERE created_at IS NULL AND uploaded_at IS NOT NULL;

ALTER TABLE IF EXISTS public.documents ALTER COLUMN created_at SET DEFAULT now();

-- 4) government_requests table
create table government_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  officer_id uuid references users(id) on delete set null,
  target_user_id text,
  officer_name text not null,
  reason text not null,
  case_id text,
  status text not null default 'pending',
  decision_reason text,
  decided_by text,
  documents_needed text[],
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 5) audit_logs table
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  actor_role text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 6) Create indexes (if not already exist)
create index if not exists emergency_profiles_user_id_idx on emergency_profiles(user_id);
create index if not exists evidence_user_id_idx on evidence(user_id);
create index if not exists documents_created_at_idx on documents(created_at desc);
create index if not exists government_requests_user_id_idx on government_requests(user_id);
create index if not exists audit_logs_actor_id_idx on audit_logs(actor_id);

-- Done. Tables are now ready for smoke tests.

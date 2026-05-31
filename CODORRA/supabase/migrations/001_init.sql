create extension if not exists "pgcrypto";

create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists emergency_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  status text not null default 'inactive',
  risk_score integer not null default 0,
  threat_level text not null default 'low',
  exposure_score integer not null default 0,
  case_id text,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  case_id text,
  label text not null,
  file_name text not null,
  mime_type text not null,
  file_url text not null,
  encrypted boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists government_requests (
  id uuid primary key default gen_random_uuid(),
  target_user_id text not null references users(id) on delete cascade,
  officer_name text not null,
  reason text not null,
  case_id text not null,
  status text not null default 'pending',
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  actor_role text not null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists emergency_profiles_user_id_idx on emergency_profiles(user_id);
create index if not exists evidence_user_id_idx on evidence(user_id);
create index if not exists government_requests_target_user_id_idx on government_requests(target_user_id);
create index if not exists audit_logs_actor_id_idx on audit_logs(actor_id);
create index if not exists audit_logs_created_at_idx on audit_logs(created_at desc);

-- CivicVault-specific tables: document sections, documents, access and requests

create table if not exists document_sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references document_sections(id) on delete set null,
  title text not null,
  owner_id text references users(id) on delete cascade,
  metadata jsonb default '{}'::jsonb,
  uploaded_at timestamptz not null default now()
);

create table if not exists document_access (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  grantee_id text references users(id) on delete set null,
  permission text not null,
  granted_by text,
  revoked boolean not null default false,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists access_requests (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  requester_id text references users(id) on delete set null,
  reason text,
  status text not null default 'pending',
  decided_by text,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now()
);

-- Seed basic sections and a demo user for local development when missing
insert into document_sections (name, description)
select 'bank', 'Banking and financial documents'
where not exists (select 1 from document_sections where name = 'bank');

insert into document_sections (name, description)
select 'govt', 'Government identity and compliance documents'
where not exists (select 1 from document_sections where name = 'govt');

insert into users (id, name, email, role)
select 'civicvault-demo', 'CivicVault Demo', 'demo@civicvault.local', 'user'
where not exists (select 1 from users where id = 'civicvault-demo');

alter table if exists public.users
  add column if not exists government_id text;

create index if not exists idx_users_government_id on public.users (government_id);

update public.users
set government_id = coalesce(government_id, id::text)
where government_id is null;

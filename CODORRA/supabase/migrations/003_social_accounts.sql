create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  handle text not null,
  active boolean not null default false,
  linked_since text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, handle)
);

create index if not exists social_accounts_user_id_idx on social_accounts(user_id);
create index if not exists social_accounts_active_idx on social_accounts(active);

insert into social_accounts (user_id, name, handle, active, linked_since)
values
  ('9764b712-eaf7-4836-895f-d5a4348b2bb5', 'Instagram', '@username', true, 'Jan 2023'),
  ('9764b712-eaf7-4836-895f-d5a4348b2bb5', 'Twitter / X', '@username', false, 'Mar 2022'),
  ('9764b712-eaf7-4836-895f-d5a4348b2bb5', 'LinkedIn', 'linkedin.com/in/username', true, 'Jun 2021'),
  ('9764b712-eaf7-4836-895f-d5a4348b2bb5', 'Facebook', 'facebook.com/username', false, 'Aug 2020'),
  ('9764b712-eaf7-4836-895f-d5a4348b2bb5', 'YouTube', '@username', true, 'Nov 2022')
on conflict (user_id, handle) do nothing;

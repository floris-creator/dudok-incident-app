create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'employee' check (role in ('manager', 'employee')),
  email text
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  location text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_behandeling', 'opgelost')),
  ai_risk_score int,
  ai_risk_label text check (ai_risk_label in ('Laag', 'Matig', 'Ernstig', 'Onaanvaardbaar')),
  manager_risk_label text check (manager_risk_label in ('Laag', 'Matig', 'Ernstig', 'Onaanvaardbaar')),
  final_risk_label text check (final_risk_label in ('Laag', 'Matig', 'Ernstig', 'Onaanvaardbaar')),
  risk_source text not null default 'AI' check (risk_source in ('AI', 'MANAGER'))
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  incident_id uuid references public.incidents(id) on delete cascade,
  title text,
  message text,
  read boolean not null default false
);

create index if not exists incidents_created_at_idx on public.incidents (created_at desc);
create index if not exists incidents_final_risk_label_idx on public.incidents (final_risk_label);
create index if not exists notifications_user_read_created_idx on public.notifications (user_id, read, created_at desc);

alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "incidents_select_manager_only"
on public.incidents
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
  )
);

create policy "incidents_update_manager_only"
on public.incidents
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'manager'
  )
);

create policy "notifications_select_own"
on public.notifications
for select
using (auth.uid() = user_id);

create policy "notifications_update_own"
on public.notifications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

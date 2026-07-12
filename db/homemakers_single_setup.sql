-- =============================================================================
-- HomeMakers — LEGACY OPEN-DEMO SETUP (not safe as the final production state)
-- Run homemakers_rls_hardening.sql immediately afterward. Never rerun this file
-- on a hardened production database.
-- Safe to re-run (idempotent). Works on empty DB or after v1/v1.1/v1.2.
--
-- Gives every signed-in user a persistent row: email + role + name + phone + city
-- Projects, v0 packs, portfolios, and storage for the React app.
--
-- MODE: OPEN DEMO (no-login persistence). The React app writes to Supabase with
-- the ANON key and no sign-in (AUTH_UI_ENABLED = false), so:
--   • portfolios      → anon can insert/update/select (pros save without login)
--   • projects + kids → RLS disabled (homeowner projects save without login)
--   • storage buckets → anon can upload v0 images + portfolio photos
-- Rows are SHARED (no per-user isolation) — fine pre-launch, NOT for real
-- multi-tenant. Before public launch: set AUTH_UI_ENABLED = true and run
-- db/homemakers_rls_hardening.sql to restore owner-scoped (auth.uid()) policies.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1) USER SESSION (email + role + profile — source of truth for the app)
-- -----------------------------------------------------------------------------
create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'homeowner' check (role in ('homeowner', 'pro')),
  full_name text,
  phone text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles add column if not exists email text;

create index if not exists idx_user_profiles_role on public.user_profiles (role);
create index if not exists idx_user_profiles_email on public.user_profiles (email);

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- Auto-create / refresh profile when someone signs up (Auth → Postgres)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
begin
  meta_role := coalesce(
    new.raw_user_meta_data ->> 'role',
    new.raw_app_meta_data ->> 'role',
    'homeowner'
  );
  if meta_role not in ('homeowner', 'pro') then
    meta_role := 'homeowner';
  end if;

  insert into public.user_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    meta_role
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), user_profiles.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep email in sync if user changes it in Auth
create or replace function public.handle_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_profiles
  set email = new.email, updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_updated();

-- Backfill profiles for users that already exist in Auth
insert into public.user_profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
  case
    when coalesce(u.raw_user_meta_data ->> 'role', u.raw_app_meta_data ->> 'role') = 'pro' then 'pro'
    else 'homeowner'
  end
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  full_name = coalesce(nullif(excluded.full_name, ''), user_profiles.full_name),
  updated_at = now();

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own" on public.user_profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own" on public.user_profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own" on public.user_profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- One query the app (or you) can use: returns role + email + profile for current user
create or replace function public.get_my_session()
returns table (
  user_id uuid,
  email text,
  role text,
  full_name text,
  phone text,
  city text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(p.email, u.email),
    p.role,
    p.full_name,
    p.phone,
    p.city
  from public.user_profiles p
  inner join auth.users u on u.id = p.id
  where p.id = auth.uid();
$$;

revoke all on function public.get_my_session() from public;
grant execute on function public.get_my_session() to authenticated;

-- -----------------------------------------------------------------------------
-- 2) PORTFOLIOS (pros)
-- -----------------------------------------------------------------------------
create table if not exists public.portfolios (
  id text primary key,
  owner_user_id uuid references auth.users (id) on delete set null,
  craft text not null,
  full_name text,
  business_name text,
  city text,
  address text,
  portfolio_theme text,
  portfolio_layout text,
  years_experience text,
  phone text,
  email text,
  license_number text,
  short_bio text,
  specialties jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  cover_photo text,
  profile_photo text,
  profile_strength integer not null default 15,
  step integer not null default 1,
  published boolean not null default false,
  slug text unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'abandoned')),
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolios add column if not exists owner_user_id uuid references auth.users (id) on delete set null;
-- Wizard fields added after the initial schema: street address (details step) and
-- look & feel (theme step). Without these columns Supabase rejects the whole write,
-- so details and theme silently fail to persist.
alter table public.portfolios add column if not exists address text;
alter table public.portfolios add column if not exists portfolio_theme text;
alter table public.portfolios add column if not exists portfolio_layout text;

create index if not exists idx_portfolios_published on public.portfolios (published);
create index if not exists idx_portfolios_owner_user on public.portfolios (owner_user_id);

drop trigger if exists trg_portfolios_updated_at on public.portfolios;
create trigger trg_portfolios_updated_at
  before update on public.portfolios
  for each row execute function public.set_updated_at();

-- OPEN DEMO MODE: anon (no-login) can create/edit/read portfolios so pros persist
-- without sign-in. Before real multi-tenant launch, run homemakers_rls_hardening.sql
-- to switch these back to owner-scoped (auth.uid()) policies.
alter table public.portfolios enable row level security;

-- Drop any prior owner-scoped policies (from hardened setup) so re-runs are clean.
drop policy if exists "portfolio_select_own_or_published" on public.portfolios;
drop policy if exists "portfolio_select_published_anon" on public.portfolios;
drop policy if exists "portfolio_insert_own" on public.portfolios;
drop policy if exists "portfolio_update_own" on public.portfolios;
drop policy if exists "portfolio_delete_own" on public.portfolios;

drop policy if exists "public_read_published_portfolios" on public.portfolios;
create policy "public_read_published_portfolios"
  on public.portfolios for select to anon, authenticated using (published = true);

drop policy if exists "anon_read_portfolios_mvp" on public.portfolios;
create policy "anon_read_portfolios_mvp"
  on public.portfolios for select to anon, authenticated using (true);

drop policy if exists "anon_insert_portfolios_mvp" on public.portfolios;
create policy "anon_insert_portfolios_mvp"
  on public.portfolios for insert to anon, authenticated with check (true);

drop policy if exists "anon_update_portfolios_mvp" on public.portfolios;
create policy "anon_update_portfolios_mvp"
  on public.portfolios for update to anon, authenticated using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 3) HOMEOWNER PROJECTS + BRIEFS + AI + V0 PACK
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete set null,
  title text,
  flow_type text not null check (flow_type in ('new_home', 'remodel')),
  status text not null default 'draft' check (status in (
    'draft', 'review', 'planning', 'active', 'on_hold', 'completed', 'archived'
  )),
  source text,
  location text,
  city text,
  state text,
  budget_min numeric,
  budget_max numeric,
  timeline_start text,
  timeline_completion text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects add column if not exists source text;
alter table public.projects add column if not exists owner_user_id uuid references auth.users (id) on delete set null;
alter table public.projects add column if not exists last_active_at timestamptz not null default now();

create index if not exists idx_projects_owner on public.projects (owner_user_id);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table if not exists public.project_briefs (
  project_id uuid primary key references public.projects (id) on delete cascade,
  brief_version integer not null default 1,
  brief_json jsonb not null default '{}'::jsonb,
  dream_vision text,
  inspirations_json jsonb not null default '[]'::jsonb,
  last_completed_step integer,
  flow_step text,
  flow_status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_briefs add column if not exists flow_step text;

alter table public.project_briefs drop constraint if exists project_briefs_flow_status_check;
alter table public.project_briefs
  add constraint project_briefs_flow_status_check
  check (flow_status in ('draft', 'v0_ready', 'open_for_quotes', 'submitted', 'abandoned'));

drop trigger if exists trg_project_briefs_updated_at on public.project_briefs;
create trigger trg_project_briefs_updated_at
  before update on public.project_briefs
  for each row execute function public.set_updated_at();

create table if not exists public.project_ai_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  run_type text not null check (run_type in ('v0_images', 'estimate_plan')),
  provider text,
  status text not null default 'completed' check (status in ('queued', 'running', 'completed', 'failed')),
  input_json jsonb,
  output_json jsonb,
  error_text text,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_ai_runs_project on public.project_ai_runs (project_id);

create table if not exists public.project_v0_packs (
  project_id uuid primary key references public.projects (id) on delete cascade,
  images_json jsonb,
  floor_plans_json jsonb,
  estimate_json jsonb,
  is_mock boolean not null default false,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_project_v0_packs_updated_at on public.project_v0_packs;
create trigger trg_project_v0_packs_updated_at
  before update on public.project_v0_packs
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4) PROJECT MANAGEMENT (stages, tasks, messages, documents)
-- -----------------------------------------------------------------------------
create table if not exists public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  status text not null default 'upcoming' check (status in ('upcoming', 'in_progress', 'blocked', 'done')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  start_date date,
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  stage_id uuid references public.project_stages (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_portfolio_id text references public.portfolios (id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  stage_id uuid references public.project_stages (id) on delete set null,
  author_portfolio_id text references public.portfolios (id) on delete set null,
  author_role text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  stage_id uuid references public.project_stages (id) on delete set null,
  uploaded_by_portfolio_id text references public.portfolios (id) on delete set null,
  kind text default 'file',
  file_name text not null,
  file_url text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

-- OPEN DEMO MODE: the frontend writes projects (and children) directly with the
-- anon key and no login, so RLS is disabled on these tables to let writes persist.
-- Before real multi-tenant launch, run homemakers_rls_hardening.sql to re-enable
-- RLS with owner-scoped (auth.uid()) policies.
alter table public.projects disable row level security;
alter table public.project_briefs disable row level security;
alter table public.project_stages disable row level security;
alter table public.project_tasks disable row level security;
alter table public.project_messages disable row level security;
alter table public.project_documents disable row level security;
alter table public.project_v0_packs disable row level security;
alter table public.project_ai_runs disable row level security;

-- -----------------------------------------------------------------------------
-- 5) STORAGE (v0 images + portfolio photos)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-v0', 'project-v0', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('portfolio-media', 'portfolio-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- OPEN DEMO MODE: allow anon (no-login) uploads to both public buckets so v0
-- images and portfolio photos persist. Drop prior owner-scoped upload policies.
drop policy if exists "project_v0_upload_own" on storage.objects;
drop policy if exists "project_v0_update_own" on storage.objects;
drop policy if exists "portfolio_media_upload_own" on storage.objects;
drop policy if exists "portfolio_media_update_own" on storage.objects;

drop policy if exists "demo_storage_insert" on storage.objects;
create policy "demo_storage_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id in ('project-v0', 'portfolio-media'));

drop policy if exists "demo_storage_update" on storage.objects;
create policy "demo_storage_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id in ('project-v0', 'portfolio-media'));

drop policy if exists "project_v0_select_public" on storage.objects;
create policy "project_v0_select_public" on storage.objects
  for select to public using (bucket_id = 'project-v0');

drop policy if exists "portfolio_media_select_public" on storage.objects;
create policy "portfolio_media_select_public" on storage.objects
  for select to public using (bucket_id = 'portfolio-media');

-- -----------------------------------------------------------------------------
-- 6) VERIFY (run while signed in, or replace auth.uid() with a real uuid)
-- -----------------------------------------------------------------------------
-- select * from public.get_my_session();
-- select id, email, role, full_name from public.user_profiles order by updated_at desc limit 10;

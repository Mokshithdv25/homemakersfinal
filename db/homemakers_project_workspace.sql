-- HomeMakers launch workspace: checklist progress, team, documents, and payment ledger.
-- Run after homemakers_single_setup.sql and homemakers_rls_hardening.sql.

begin;

create table if not exists public.project_team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  role text not null,
  email text,
  phone text,
  status text not null default 'active' check (status in ('invited', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  category text not null default 'other' check (category in ('professional', 'contractor', 'material', 'permit', 'other')),
  amount_inr numeric not null check (amount_inr >= 0),
  status text not null default 'planned' check (status in ('planned', 'due', 'paid', 'cancelled')),
  due_date date,
  paid_at timestamptz,
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_documents add column if not exists storage_path text;
alter table public.project_documents add column if not exists uploaded_by_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_project_team_members_project on public.project_team_members(project_id, created_at);
create index if not exists idx_project_payments_project on public.project_payments(project_id, created_at desc);
create index if not exists idx_project_documents_project_created on public.project_documents(project_id, created_at desc);

drop trigger if exists trg_project_team_members_updated_at on public.project_team_members;
create trigger trg_project_team_members_updated_at before update on public.project_team_members
for each row execute function public.set_updated_at();

drop trigger if exists trg_project_payments_updated_at on public.project_payments;
create trigger trg_project_payments_updated_at before update on public.project_payments
for each row execute function public.set_updated_at();

alter table public.project_team_members enable row level security;
alter table public.project_payments enable row level security;

revoke all on public.project_team_members from public, anon, authenticated;
revoke all on public.project_payments from public, anon, authenticated;
grant select, insert, update, delete on public.project_team_members to authenticated;
grant select, insert, update, delete on public.project_payments to authenticated;
grant all on public.project_team_members to service_role;
grant all on public.project_payments to service_role;

drop policy if exists "project_team_members_select_own" on public.project_team_members;
create policy "project_team_members_select_own" on public.project_team_members for select to authenticated
using (public.project_owned_by_user(project_id));
drop policy if exists "project_team_members_insert_own" on public.project_team_members;
create policy "project_team_members_insert_own" on public.project_team_members for insert to authenticated
with check (public.project_owned_by_user(project_id));
drop policy if exists "project_team_members_update_own" on public.project_team_members;
create policy "project_team_members_update_own" on public.project_team_members for update to authenticated
using (public.project_owned_by_user(project_id)) with check (public.project_owned_by_user(project_id));
drop policy if exists "project_team_members_delete_own" on public.project_team_members;
create policy "project_team_members_delete_own" on public.project_team_members for delete to authenticated
using (public.project_owned_by_user(project_id));

drop policy if exists "project_payments_select_own" on public.project_payments;
create policy "project_payments_select_own" on public.project_payments for select to authenticated
using (public.project_owned_by_user(project_id));
drop policy if exists "project_payments_insert_own" on public.project_payments;
create policy "project_payments_insert_own" on public.project_payments for insert to authenticated
with check (public.project_owned_by_user(project_id));
drop policy if exists "project_payments_update_own" on public.project_payments;
create policy "project_payments_update_own" on public.project_payments for update to authenticated
using (public.project_owned_by_user(project_id)) with check (public.project_owned_by_user(project_id));
drop policy if exists "project_payments_delete_own" on public.project_payments;
create policy "project_payments_delete_own" on public.project_payments for delete to authenticated
using (public.project_owned_by_user(project_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-documents', 'project-documents', false, 15728640,
  array['application/pdf','image/jpeg','image/png','image/webp','text/plain','text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project_documents_storage_select_own" on storage.objects;
create policy "project_documents_storage_select_own" on storage.objects for select to authenticated
using (bucket_id = 'project-documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "project_documents_storage_insert_own" on storage.objects;
create policy "project_documents_storage_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'project-documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "project_documents_storage_update_own" on storage.objects;
create policy "project_documents_storage_update_own" on storage.objects for update to authenticated
using (bucket_id = 'project-documents' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'project-documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "project_documents_storage_delete_own" on storage.objects;
create policy "project_documents_storage_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'project-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.recalculate_project_stage_progress(target_stage uuid, target_project uuid)
returns void language plpgsql security definer set search_path = public as $$
declare total_tasks integer; done_tasks integer; calculated integer; current_status text;
begin
  if target_stage is null then return; end if;
  select count(*), count(*) filter (where status = 'done') into total_tasks, done_tasks
  from public.project_tasks where project_id = target_project and stage_id = target_stage;
  if total_tasks = 0 then
    update public.project_stages
    set progress_percent = 0,
        status = case when status = 'blocked' then 'blocked' else 'upcoming' end
    where id = target_stage and project_id = target_project;
    return;
  end if;
  calculated := round((done_tasks::numeric / total_tasks::numeric) * 100);
  select status into current_status from public.project_stages where id = target_stage and project_id = target_project;
  update public.project_stages set
    progress_percent = calculated,
    status = case
      when current_status = 'blocked' then 'blocked'
      when calculated = 100 then 'done'
      when calculated > 0 or current_status = 'in_progress' then 'in_progress'
      else 'upcoming'
    end
  where id = target_stage and project_id = target_project;
end;
$$;

create or replace function public.project_task_progress_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_project uuid;
  old_project uuid;
  total_tasks integer;
  done_tasks integer;
  current_project_status text;
begin
  if tg_op = 'DELETE' then
    target_project := old.project_id;
    perform public.recalculate_project_stage_progress(old.stage_id, old.project_id);
  else
    target_project := new.project_id;
    perform public.recalculate_project_stage_progress(new.stage_id, new.project_id);
  end if;

  if tg_op = 'UPDATE' and (
    old.project_id is distinct from new.project_id
    or old.stage_id is distinct from new.stage_id
  ) then
    old_project := old.project_id;
    perform public.recalculate_project_stage_progress(old.stage_id, old.project_id);
  end if;

  select count(*), count(*) filter (where status = 'done') into total_tasks, done_tasks
  from public.project_tasks where project_id = target_project;
  select status into current_project_status from public.projects where id = target_project;
  if current_project_status not in ('archived', 'on_hold') then
    update public.projects set
      status = case when total_tasks > 0 and total_tasks = done_tasks then 'completed' else 'active' end,
      last_active_at = now()
    where id = target_project;
  end if;

  if old_project is not null and old_project is distinct from target_project then
    select count(*), count(*) filter (where status = 'done') into total_tasks, done_tasks
    from public.project_tasks where project_id = old_project;
    select status into current_project_status from public.projects where id = old_project;
    if current_project_status not in ('archived', 'on_hold') then
      update public.projects set
        status = case when total_tasks > 0 and total_tasks = done_tasks then 'completed' else 'active' end,
        last_active_at = now()
      where id = old_project;
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.recalculate_project_stage_progress(uuid, uuid) from public, anon, authenticated;
revoke all on function public.project_task_progress_trigger() from public, anon, authenticated;
drop trigger if exists trg_project_task_progress on public.project_tasks;
create trigger trg_project_task_progress after insert or update or delete on public.project_tasks
for each row execute function public.project_task_progress_trigger();

-- Render readiness calls this RPC. It validates the complete schema contract,
-- deterministic grants, required triggers/constraints, private buckets, and the
-- absence of legacy anonymous policies.
create or replace function public.launch_schema_ready()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    to_regclass('public.published_portfolios') is not null
    and to_regclass('public.project_professionals') is null
    and (select count(*) = 18 from pg_tables where schemaname = 'public')
    and (
      select count(*) = 1
      from pg_views
      where schemaname = 'public' and viewname = 'published_portfolios'
    )
    and (
      select array_agg(column_name::text order by ordinal_position) = array[
        'id', 'craft', 'full_name', 'business_name', 'city',
        'years_experience', 'short_bio', 'specialties', 'photos',
        'cover_photo', 'profile_photo', 'slug', 'profile_strength',
        'portfolio_theme', 'portfolio_layout', 'updated_at'
      ]::text[]
      from information_schema.columns
      where table_schema = 'public' and table_name = 'published_portfolios'
    )
    and to_regprocedure('public.get_my_session()') is not null
    and to_regprocedure('public.activate_billing_order(uuid,text,text)') is not null
    and to_regprocedure('public.portfolio_media_is_published(text)') is not null
    and to_regprocedure('public.enforce_portfolio_moderation()') is not null
    and to_regprocedure('public.consume_ai_daily_quota(uuid,text,integer)') is not null
    and to_regprocedure('public.project_task_progress_trigger()') is not null
    and has_table_privilege('anon', 'public.published_portfolios', 'SELECT')
    and has_table_privilege('authenticated', 'public.published_portfolios', 'SELECT')
    and has_function_privilege('authenticated', 'public.get_my_session()', 'EXECUTE')
    and not has_function_privilege('anon', 'public.get_my_session()', 'EXECUTE')
    and has_function_privilege('service_role', 'public.consume_ai_daily_quota(uuid,text,integer)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.consume_ai_daily_quota(uuid,text,integer)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.consume_ai_daily_quota(uuid,text,integer)', 'EXECUTE')
    and has_function_privilege('service_role', 'public.activate_billing_order(uuid,text,text)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.activate_billing_order(uuid,text,text)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.activate_billing_order(uuid,text,text)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.launch_schema_ready()', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.launch_schema_ready()', 'EXECUTE')
    and not exists (
      select 1
      from (values
        ('public.portfolios'),
        ('public.portfolio_reports'),
        ('public.blocked_portfolios'),
        ('public.user_profiles'),
        ('public.projects'),
        ('public.project_briefs'),
        ('public.project_ai_runs'),
        ('public.ai_usage_daily'),
        ('public.project_v0_packs'),
        ('public.project_stages'),
        ('public.project_tasks'),
        ('public.project_messages'),
        ('public.project_documents'),
        ('public.project_team_members'),
        ('public.project_payments'),
        ('public.billing_orders'),
        ('public.user_entitlements'),
        ('public.billing_webhook_events')
      ) as required(relation_name)
      left join pg_class c on c.oid = to_regclass(required.relation_name)
      where c.oid is null
        or c.relrowsecurity is not true
        or has_table_privilege('anon', required.relation_name, 'SELECT')
        or has_table_privilege('anon', required.relation_name, 'INSERT')
        or has_table_privilege('anon', required.relation_name, 'UPDATE')
        or has_table_privilege('anon', required.relation_name, 'DELETE')
    )
    and not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and (
          'anon' = any(roles)
          or 'public' = any(roles)
        )
    )
    and not exists (
      select 1
      from (values
        ('public.user_profiles', true, true, true, false),
        ('public.portfolios', true, true, true, true),
        ('public.projects', true, true, true, true),
        ('public.project_briefs', true, true, true, true),
        ('public.project_ai_runs', true, true, false, false),
        ('public.project_v0_packs', true, true, true, true),
        ('public.project_stages', true, true, true, true),
        ('public.project_tasks', true, true, true, true),
        ('public.project_messages', true, true, true, true),
        ('public.project_documents', true, true, true, true),
        ('public.project_team_members', true, true, true, true),
        ('public.project_payments', true, true, true, true),
        ('public.portfolio_reports', true, true, false, false),
        ('public.blocked_portfolios', true, true, false, true),
        ('public.billing_orders', true, false, false, false),
        ('public.user_entitlements', true, false, false, false),
        ('public.ai_usage_daily', false, false, false, false),
        ('public.billing_webhook_events', false, false, false, false)
      ) as expected(relation_name, can_select, can_insert, can_update, can_delete)
      where has_table_privilege('authenticated', relation_name, 'SELECT') is distinct from can_select
         or has_table_privilege('authenticated', relation_name, 'INSERT') is distinct from can_insert
         or has_table_privilege('authenticated', relation_name, 'UPDATE') is distinct from can_update
         or has_table_privilege('authenticated', relation_name, 'DELETE') is distinct from can_delete
    )
    and exists (
      select 1 from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'auth' and c.relname = 'users'
        and t.tgname = 'on_auth_user_created' and not t.tgisinternal
    )
    and exists (
      select 1 from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'auth' and c.relname = 'users'
        and t.tgname = 'on_auth_user_email_updated' and not t.tgisinternal
    )
    and exists (
      select 1 from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'project_tasks'
        and t.tgname = 'trg_project_task_progress' and not t.tgisinternal
    )
    and exists (
      select 1 from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'project_tasks'
        and t.tgname = 'trg_project_tasks_updated_at' and not t.tgisinternal
    )
    and (
      select count(*) = 3
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and not t.tgisinternal
        and t.tgname in (
          'trg_portfolio_moderation_insert',
          'trg_portfolio_moderation_update',
          'trg_quarantine_reported_portfolio'
        )
    )
    and (
      select count(*) = 7
      from pg_constraint
      where conname in (
        'portfolios_owner_user_id_fkey',
        'projects_owner_user_id_fkey',
        'portfolios_specialties_array_check',
        'portfolios_photos_array_check',
        'project_tasks_stage_project_fk',
        'project_messages_stage_project_fk',
        'project_documents_stage_project_fk'
      )
    )
    and (
      select count(*) = 2
      from pg_constraint
      where conname in ('portfolios_owner_user_id_fkey', 'projects_owner_user_id_fkey')
        and confdeltype = 'c'
    )
    and (
      select count(*) = 2
      from pg_attribute
      where attrelid in ('public.portfolios'::regclass, 'public.projects'::regclass)
        and attname = 'owner_user_id'
        and attnotnull
        and not attisdropped
    )
    and not exists (
      select 1
      from (values
        ('project-v0', 10485760::bigint,
          array['image/jpeg','image/png','image/webp','image/gif']::text[]),
        ('portfolio-media', 10485760::bigint,
          array['image/jpeg','image/png','image/webp','image/gif']::text[]),
        ('project-documents', 15728640::bigint,
          array['application/pdf','image/jpeg','image/png','image/webp','text/plain','text/csv',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']::text[])
      ) as expected_bucket(bucket_id, max_bytes, mime_types)
      left join storage.buckets b on b.id = expected_bucket.bucket_id
      where b.id is null
        or b.public is not false
        or b.file_size_limit is distinct from expected_bucket.max_bytes
        or b.allowed_mime_types is distinct from expected_bucket.mime_types
    )
    and (
      select count(*) = 13
      from pg_policies
      where schemaname = 'storage'
        and tablename = 'objects'
        and policyname in (
          'project_v0_select_own',
          'project_v0_upload_own',
          'project_v0_update_own',
          'project_v0_delete_own',
          'portfolio_media_select_own',
          'portfolio_media_select_published',
          'portfolio_media_upload_own',
          'portfolio_media_update_own',
          'portfolio_media_delete_own',
          'project_documents_storage_select_own',
          'project_documents_storage_insert_own',
          'project_documents_storage_update_own',
          'project_documents_storage_delete_own'
        )
    )
    and not exists (
      select 1
      from pg_policies
      where schemaname = 'storage'
        and tablename = 'objects'
        and policyname not in (
          'project_v0_select_own',
          'project_v0_upload_own',
          'project_v0_update_own',
          'project_v0_delete_own',
          'portfolio_media_select_own',
          'portfolio_media_select_published',
          'portfolio_media_upload_own',
          'portfolio_media_update_own',
          'portfolio_media_delete_own',
          'project_documents_storage_select_own',
          'project_documents_storage_insert_own',
          'project_documents_storage_update_own',
          'project_documents_storage_delete_own'
        )
    )
    and not exists (
      select 1
      from pg_policies
      where schemaname = 'storage'
        and tablename = 'objects'
        and policyname <> 'portfolio_media_select_published'
        and ('anon' = any(roles) or 'public' = any(roles))
    )
    and not exists (
      select 1
      from pg_policies
      where schemaname = 'storage'
        and tablename <> 'objects'
    );
$$;

revoke all on function public.launch_schema_ready() from public, anon, authenticated;
grant execute on function public.launch_schema_ready() to service_role;

commit;

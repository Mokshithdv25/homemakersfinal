-- =============================================================================
-- HomeMakers — RLS hardening (run once in Supabase SQL Editor after single_setup)
-- Owner-scoped projects; portfolios writable only by owner; published pros public.
-- =============================================================================

-- Helper: current user owns the project row
create or replace function public.project_owned_by_user(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.owner_user_id is not null
      and p.owner_user_id = auth.uid()
  );
$$;

revoke all on function public.project_owned_by_user(uuid) from public;
grant execute on function public.project_owned_by_user(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Portfolios — remove MVP anon-wide policies
-- -----------------------------------------------------------------------------
drop policy if exists "anon_insert_portfolios_mvp" on public.portfolios;
drop policy if exists "anon_update_portfolios_mvp" on public.portfolios;
drop policy if exists "anon_read_portfolios_mvp" on public.portfolios;

drop policy if exists "portfolio_select_own_or_published" on public.portfolios;
create policy "portfolio_select_own_or_published"
  on public.portfolios for select to authenticated
  using (owner_user_id = auth.uid() or published = true);

drop policy if exists "portfolio_select_published_anon" on public.portfolios;
create policy "portfolio_select_published_anon"
  on public.portfolios for select to anon
  using (published = true);

drop policy if exists "portfolio_insert_own" on public.portfolios;
create policy "portfolio_insert_own"
  on public.portfolios for insert to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists "portfolio_update_own" on public.portfolios;
create policy "portfolio_update_own"
  on public.portfolios for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "portfolio_delete_own" on public.portfolios;
create policy "portfolio_delete_own"
  on public.portfolios for delete to authenticated
  using (owner_user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Projects + children — enable owner-scoped RLS
-- -----------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.project_briefs enable row level security;
alter table public.project_stages enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_documents enable row level security;
alter table public.project_v0_packs enable row level security;
alter table public.project_ai_runs enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
  on public.projects for select to authenticated
  using (owner_user_id = auth.uid());

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
  on public.projects for insert to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
  on public.projects for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
  on public.projects for delete to authenticated
  using (owner_user_id = auth.uid());

-- Claim projects saved before sign-in (device still has projectId in localStorage)
drop policy if exists "projects_claim_orphan" on public.projects;
create policy "projects_claim_orphan"
  on public.projects for update to authenticated
  using (owner_user_id is null)
  with check (owner_user_id = auth.uid());

-- project_briefs
drop policy if exists "project_briefs_select_own" on public.project_briefs;
create policy "project_briefs_select_own"
  on public.project_briefs for select to authenticated
  using (public.project_owned_by_user(project_id));

drop policy if exists "project_briefs_insert_own" on public.project_briefs;
create policy "project_briefs_insert_own"
  on public.project_briefs for insert to authenticated
  with check (public.project_owned_by_user(project_id));

drop policy if exists "project_briefs_update_own" on public.project_briefs;
create policy "project_briefs_update_own"
  on public.project_briefs for update to authenticated
  using (public.project_owned_by_user(project_id))
  with check (public.project_owned_by_user(project_id));

drop policy if exists "project_briefs_delete_own" on public.project_briefs;
create policy "project_briefs_delete_own"
  on public.project_briefs for delete to authenticated
  using (public.project_owned_by_user(project_id));

-- project_v0_packs
drop policy if exists "project_v0_packs_select_own" on public.project_v0_packs;
create policy "project_v0_packs_select_own"
  on public.project_v0_packs for select to authenticated
  using (public.project_owned_by_user(project_id));

drop policy if exists "project_v0_packs_insert_own" on public.project_v0_packs;
create policy "project_v0_packs_insert_own"
  on public.project_v0_packs for insert to authenticated
  with check (public.project_owned_by_user(project_id));

drop policy if exists "project_v0_packs_update_own" on public.project_v0_packs;
create policy "project_v0_packs_update_own"
  on public.project_v0_packs for update to authenticated
  using (public.project_owned_by_user(project_id))
  with check (public.project_owned_by_user(project_id));

drop policy if exists "project_v0_packs_delete_own" on public.project_v0_packs;
create policy "project_v0_packs_delete_own"
  on public.project_v0_packs for delete to authenticated
  using (public.project_owned_by_user(project_id));

-- project_ai_runs
drop policy if exists "project_ai_runs_select_own" on public.project_ai_runs;
create policy "project_ai_runs_select_own"
  on public.project_ai_runs for select to authenticated
  using (public.project_owned_by_user(project_id));

drop policy if exists "project_ai_runs_insert_own" on public.project_ai_runs;
create policy "project_ai_runs_insert_own"
  on public.project_ai_runs for insert to authenticated
  with check (public.project_owned_by_user(project_id));

-- project_stages
drop policy if exists "project_stages_select_own" on public.project_stages;
create policy "project_stages_select_own"
  on public.project_stages for select to authenticated
  using (public.project_owned_by_user(project_id));

drop policy if exists "project_stages_insert_own" on public.project_stages;
create policy "project_stages_insert_own"
  on public.project_stages for insert to authenticated
  with check (public.project_owned_by_user(project_id));

drop policy if exists "project_stages_update_own" on public.project_stages;
create policy "project_stages_update_own"
  on public.project_stages for update to authenticated
  using (public.project_owned_by_user(project_id))
  with check (public.project_owned_by_user(project_id));

drop policy if exists "project_stages_delete_own" on public.project_stages;
create policy "project_stages_delete_own"
  on public.project_stages for delete to authenticated
  using (public.project_owned_by_user(project_id));

-- project_tasks
drop policy if exists "project_tasks_select_own" on public.project_tasks;
create policy "project_tasks_select_own"
  on public.project_tasks for select to authenticated
  using (public.project_owned_by_user(project_id));

drop policy if exists "project_tasks_insert_own" on public.project_tasks;
create policy "project_tasks_insert_own"
  on public.project_tasks for insert to authenticated
  with check (public.project_owned_by_user(project_id));

drop policy if exists "project_tasks_update_own" on public.project_tasks;
create policy "project_tasks_update_own"
  on public.project_tasks for update to authenticated
  using (public.project_owned_by_user(project_id))
  with check (public.project_owned_by_user(project_id));

drop policy if exists "project_tasks_delete_own" on public.project_tasks;
create policy "project_tasks_delete_own"
  on public.project_tasks for delete to authenticated
  using (public.project_owned_by_user(project_id));

-- project_messages
drop policy if exists "project_messages_select_own" on public.project_messages;
create policy "project_messages_select_own"
  on public.project_messages for select to authenticated
  using (public.project_owned_by_user(project_id));

drop policy if exists "project_messages_insert_own" on public.project_messages;
create policy "project_messages_insert_own"
  on public.project_messages for insert to authenticated
  with check (public.project_owned_by_user(project_id));

-- project_documents
drop policy if exists "project_documents_select_own" on public.project_documents;
create policy "project_documents_select_own"
  on public.project_documents for select to authenticated
  using (public.project_owned_by_user(project_id));

drop policy if exists "project_documents_insert_own" on public.project_documents;
create policy "project_documents_insert_own"
  on public.project_documents for insert to authenticated
  with check (public.project_owned_by_user(project_id));

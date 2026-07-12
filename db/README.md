# Production database rollout

These scripts are intended for the Supabase SQL Editor. Take a database backup or restore-point snapshot first, run each script to completion, and stop if any statement fails. Do not continue with a partially applied sequence.

## Choose one migration path

Before any production hardening, classify legacy anonymous projects. Launch mode
does not let a browser claim an unowned UUID because that would let anyone who
discovered an ID take another person's project.

```sql
select count(*) as anonymous_projects,
       min(created_at) as oldest,
       max(created_at) as newest
from public.projects
where owner_user_id is null;

select id, title, source, created_at
from public.projects
where owner_user_id is null
order by created_at desc;
```

If rows exist, stop the rollout. Export them, map ownership only from verified
support/account evidence, and purge rows that cannot be safely attributed after
the communicated recovery window. There is intentionally no automatic
client-side claim path.

| Database state | Run in this order |
| --- | --- |
| Existing HomeMakers production schema | `homemakers_rls_hardening.sql` → `homemakers_project_workspace.sql` |
| Empty Supabase project | `homemakers_single_setup.sql` → `homemakers_rls_hardening.sql` → `homemakers_project_workspace.sql` |
| Older v1/v1.1/v1.2 schema missing current columns or buckets | `homemakers_supabase_align.sql` → `homemakers_rls_hardening.sql` → `homemakers_project_workspace.sql` |

`homemakers_single_setup.sql` creates an intentionally open demo state. It is safe only as a temporary bootstrap step in a fresh database and must be followed immediately by `homemakers_rls_hardening.sql`. Never run it again after hardening production.

`supabase_storage.sql` is a standalone storage repair/reference script. The canonical production paths above already create or harden the required buckets; if this repair script is used later, re-run `homemakers_rls_hardening.sql` afterward and repeat the probes below.

## What the required scripts establish

- Owner-scoped RLS for projects, briefs, generated packs, stages, tasks, messages, documents, team members, and payment-ledger rows.
- Private `project-v0`, `project-documents`, and `portfolio-media` buckets with owner/path-scoped policies.
- A public, read-only `published_portfolios` view that excludes owner IDs, street address, email, phone, and license numbers.
- Backend-only writes to billing orders and entitlements; authenticated users may read only their own rows.
- A backend-only, atomic UTC-day counter that limits real AI image-pack requests per user.
- Workspace tables and progress triggers used by the web and native project hub.

## SQL verification

Run this in the SQL Editor after the migration. Every listed table must report `rls_enabled = true`.

```sql
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'portfolios', 'projects', 'project_briefs', 'project_v0_packs',
    'project_stages', 'project_tasks', 'project_messages', 'project_documents',
    'project_team_members', 'project_payments', 'billing_orders',
    'user_entitlements', 'ai_usage_daily'
  )
order by c.relname;
```

Confirm the storage posture:

```sql
select id, public
from storage.buckets
where id in ('project-v0', 'project-documents', 'portfolio-media')
order by id;
```

Expected: all three buckets report `public = false`. Portfolio owners can read their own media. Anonymous and authenticated public readers can select only an exact `{owner_user_id}/{portfolio_id}/...` object path whose matching portfolio row is published; the frontend and API turn that permitted read into a short-lived signed URL.

## Anonymous API probes

Use the browser-safe Supabase anon/publishable key, never the service-role key:

```bash
export HM_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export HM_SUPABASE_ANON_KEY="YOUR_ANON_OR_PUBLISHABLE_KEY"

curl -i "$HM_SUPABASE_URL/rest/v1/published_portfolios?select=*&limit=1" \
  -H "apikey: $HM_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $HM_SUPABASE_ANON_KEY"

curl -i "$HM_SUPABASE_URL/rest/v1/projects?select=id&limit=1" \
  -H "apikey: $HM_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $HM_SUPABASE_ANON_KEY"

curl -i "$HM_SUPABASE_URL/rest/v1/billing_orders?select=id&limit=1" \
  -H "apikey: $HM_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $HM_SUPABASE_ANON_KEY"
```

The published view should return `200` and only the safe portfolio projection. The project and billing requests must return `401` or `403`; any anonymous project/billing row is a release blocker. Repeat the private-table probe for `project_briefs`, `project_v0_packs`, `project_stages`, `project_tasks`, `project_messages`, `project_documents`, `project_team_members`, `project_payments`, and `user_entitlements`.

Verify portfolio media with one draft portfolio and one published portfolio, each containing a disposable image at the required `{owner_user_id}/{portfolio_id}/...` path:

```bash
export HM_PUBLISHED_MEDIA_PATH="OWNER_UUID/PUBLISHED_PORTFOLIO_UUID/test.webp"
export HM_DRAFT_MEDIA_PATH="OWNER_UUID/DRAFT_PORTFOLIO_UUID/test.webp"

curl -i -X POST \
  "$HM_SUPABASE_URL/storage/v1/object/sign/portfolio-media/$HM_PUBLISHED_MEDIA_PATH" \
  -H "apikey: $HM_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $HM_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"expiresIn":60}'

curl -i -X POST \
  "$HM_SUPABASE_URL/storage/v1/object/sign/portfolio-media/$HM_DRAFT_MEDIA_PATH" \
  -H "apikey: $HM_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $HM_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"expiresIn":60}'
```

The published-path request should return a short-lived signed URL. The draft-path request must fail. Also verify that swapping either UUID in the published path fails, the direct `/storage/v1/object/public/portfolio-media/...` URL fails for both images, and the signed URL stops working after expiry.

Finally, create two disposable authenticated accounts. Each account must be able to read and modify its own project, but an attempted read using the other account's project ID must return no rows. Delete both accounts and their test data after verification.

## Portfolio moderation operations

New and materially edited portfolios remain private with `moderation_status =
'pending'`. Review the text and every referenced image in Supabase before approval:

```sql
select id, slug, full_name, business_name, short_bio, photos, cover_photo,
       profile_photo, moderation_status, updated_at
from public.portfolios
where published = true and moderation_status in ('pending', 'rejected')
order by updated_at;

select r.*, p.slug, p.full_name
from public.portfolio_reports r
join public.portfolios p on p.id = r.portfolio_id
where r.status in ('open', 'reviewing')
order by r.created_at;
```

Approve only reviewed content with a trusted SQL Editor/service-role operation:

```sql
update public.portfolios
set moderation_status = 'approved', updated_at = now()
where id = 'REVIEWED_PORTFOLIO_ID';
```

Resolve or reject reports promptly and record the outcome in
`portfolio_reports.status`. Never expose service-role credentials in a client.

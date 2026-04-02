-- Consolidated migration for current iteration
-- Safe to run once on a schema matching supabase/currentdb.sql.
-- Includes: RLS hardening, realtime + notifications, search/index tuning, multi-gateway payment columns.

begin;

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================================
-- Phase 1: Security / RLS hardening
-- =========================================================

create or replace function public.current_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid()
    and p.organization_id is not null
  union
  select om.organization_id
  from public.organization_members om
  where om.user_id = auth.uid()
    and om.organization_id is not null
    and coalesce(om.status, 'active') = 'active'
$$;

revoke all on function public.current_org_ids() from public;
grant execute on function public.current_org_ids() to authenticated, anon;

alter table if exists public.programs enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.submissions enable row level security;
alter table if exists public.judges enable row level security;
alter table if exists public.scores enable row level security;
alter table if exists public.judging_criteria enable row level security;
alter table if exists public.organization_members enable row level security;
alter table if exists public.organization_invites enable row level security;
alter table if exists public.roles enable row level security;
alter table if exists public.role_permissions enable row level security;
alter table if exists public.rounds enable row level security;
alter table if exists public.program_forms enable row level security;
alter table if exists public.program_form_fields enable row level security;
alter table if exists public.audit_logs enable row level security;

-- programs

drop policy if exists programs_org_member_rw on public.programs;
create policy programs_org_member_rw on public.programs
for all
to authenticated
using (organization_id in (select public.current_org_ids()))
with check (organization_id in (select public.current_org_ids()));

drop policy if exists programs_public_read on public.programs;
create policy programs_public_read on public.programs
for select
to anon, authenticated
using (coalesce(visibility, 'public') = 'public' and coalesce(status, 'draft') = 'active');

-- categories

drop policy if exists categories_org_member_rw on public.categories;
create policy categories_org_member_rw on public.categories
for all
to authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = categories.program_id
      and p.organization_id in (select public.current_org_ids())
  )
)
with check (
  exists (
    select 1
    from public.programs p
    where p.id = categories.program_id
      and p.organization_id in (select public.current_org_ids())
  )
);

-- submissions

drop policy if exists submissions_org_member_rw on public.submissions;
create policy submissions_org_member_rw on public.submissions
for all
to authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = submissions.program_id
      and p.organization_id in (select public.current_org_ids())
  )
)
with check (
  exists (
    select 1
    from public.programs p
    where p.id = submissions.program_id
      and p.organization_id in (select public.current_org_ids())
  )
);

drop policy if exists submissions_judge_token_read on public.submissions;
create policy submissions_judge_token_read on public.submissions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.judges j
    where j.program_id = submissions.program_id
      and j.invite_token::text = coalesce(auth.jwt() ->> 'judge_token', '')
  )
);

-- judges

drop policy if exists judges_org_member_rw on public.judges;
create policy judges_org_member_rw on public.judges
for all
to authenticated
using (organization_id in (select public.current_org_ids()))
with check (organization_id in (select public.current_org_ids()));

-- scores

drop policy if exists scores_org_member_rw on public.scores;
create policy scores_org_member_rw on public.scores
for all
to authenticated
using (
  exists (
    select 1
    from public.submission_judges sj
    join public.submissions s on s.id = sj.submission_id
    join public.programs p on p.id = s.program_id
    where sj.id = scores.submission_judge_id
      and p.organization_id in (select public.current_org_ids())
  )
)
with check (
  exists (
    select 1
    from public.submission_judges sj
    join public.submissions s on s.id = sj.submission_id
    join public.programs p on p.id = s.program_id
    where sj.id = scores.submission_judge_id
      and p.organization_id in (select public.current_org_ids())
  )
);

-- judging criteria

drop policy if exists judging_criteria_org_member_rw on public.judging_criteria;
create policy judging_criteria_org_member_rw on public.judging_criteria
for all
to authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = judging_criteria.program_id
      and p.organization_id in (select public.current_org_ids())
  )
)
with check (
  exists (
    select 1
    from public.programs p
    where p.id = judging_criteria.program_id
      and p.organization_id in (select public.current_org_ids())
  )
);

-- organization_members

drop policy if exists organization_members_org_member_rw on public.organization_members;
drop policy if exists organization_members_select_self_or_org on public.organization_members;
drop policy if exists organization_members_insert_org on public.organization_members;
drop policy if exists organization_members_update_org on public.organization_members;
drop policy if exists organization_members_delete_org on public.organization_members;

create policy organization_members_select_self_or_org on public.organization_members
for select
to authenticated
using (
  user_id = auth.uid()
  or organization_id in (select public.current_org_ids())
);

create policy organization_members_insert_org on public.organization_members
for insert
to authenticated
with check (organization_id in (select public.current_org_ids()));

create policy organization_members_update_org on public.organization_members
for update
to authenticated
using (organization_id in (select public.current_org_ids()))
with check (organization_id in (select public.current_org_ids()));

create policy organization_members_delete_org on public.organization_members
for delete
to authenticated
using (organization_id in (select public.current_org_ids()));

-- organization_invites

drop policy if exists organization_invites_org_member_rw on public.organization_invites;
create policy organization_invites_org_member_rw on public.organization_invites
for all
to authenticated
using (organization_id in (select public.current_org_ids()))
with check (organization_id in (select public.current_org_ids()));

-- roles

drop policy if exists roles_org_member_rw on public.roles;
create policy roles_org_member_rw on public.roles
for all
to authenticated
using (organization_id in (select public.current_org_ids()))
with check (organization_id in (select public.current_org_ids()));

-- role_permissions

drop policy if exists role_permissions_org_member_rw on public.role_permissions;
create policy role_permissions_org_member_rw on public.role_permissions
for all
to authenticated
using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.organization_id in (select public.current_org_ids())
  )
)
with check (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.organization_id in (select public.current_org_ids())
  )
);

-- rounds

drop policy if exists rounds_org_member_rw on public.rounds;
create policy rounds_org_member_rw on public.rounds
for all
to authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = rounds.program_id
      and p.organization_id in (select public.current_org_ids())
  )
)
with check (
  exists (
    select 1
    from public.programs p
    where p.id = rounds.program_id
      and p.organization_id in (select public.current_org_ids())
  )
);

-- program_forms

drop policy if exists program_forms_org_member_rw on public.program_forms;
create policy program_forms_org_member_rw on public.program_forms
for all
to authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = program_forms.program_id
      and p.organization_id in (select public.current_org_ids())
  )
)
with check (
  exists (
    select 1
    from public.programs p
    where p.id = program_forms.program_id
      and p.organization_id in (select public.current_org_ids())
  )
);

-- program_form_fields

drop policy if exists program_form_fields_org_member_rw on public.program_form_fields;
create policy program_form_fields_org_member_rw on public.program_form_fields
for all
to authenticated
using (
  exists (
    select 1
    from public.program_forms pf
    join public.programs p on p.id = pf.program_id
    where pf.id = program_form_fields.form_id
      and p.organization_id in (select public.current_org_ids())
  )
)
with check (
  exists (
    select 1
    from public.program_forms pf
    join public.programs p on p.id = pf.program_id
    where pf.id = program_form_fields.form_id
      and p.organization_id in (select public.current_org_ids())
  )
);

-- audit_logs (append style: read + insert)

drop policy if exists audit_logs_org_member_read on public.audit_logs;
create policy audit_logs_org_member_read on public.audit_logs
for select
to authenticated
using (organization_id in (select public.current_org_ids()));

drop policy if exists audit_logs_org_member_insert on public.audit_logs;
create policy audit_logs_org_member_insert on public.audit_logs
for insert
to authenticated
with check (organization_id in (select public.current_org_ids()));


-- =========================================================
-- Phase 2: Realtime + notifications
-- =========================================================

alter table if exists public.submissions replica identity full;
alter table if exists public.submission_judges replica identity full;
alter table if exists public.scores replica identity full;
alter table if exists public.audit_logs replica identity full;
alter table if exists public.judges replica identity full;

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  type text not null default 'system',
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table if exists public.notifications enable row level security;
alter table if exists public.notifications replica identity full;

drop policy if exists notifications_select_policy on public.notifications;
create policy notifications_select_policy
  on public.notifications
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = notifications.organization_id
        and om.user_id = auth.uid()
    )
  );

drop policy if exists notifications_update_policy on public.notifications;
create policy notifications_update_policy
  on public.notifications
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = notifications.organization_id
        and om.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = notifications.organization_id
        and om.user_id = auth.uid()
    )
  );

create index if not exists idx_notifications_org_created_at
  on public.notifications (organization_id, created_at desc);

create index if not exists idx_notifications_org_is_read
  on public.notifications (organization_id, is_read);

create index if not exists idx_notifications_program
  on public.notifications (program_id);

-- Ensure realtime publication has the required tables.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.submissions';
    exception when duplicate_object then
      null;
    end;

    begin
      execute 'alter publication supabase_realtime add table public.submission_judges';
    exception when duplicate_object then
      null;
    end;

    begin
      execute 'alter publication supabase_realtime add table public.scores';
    exception when duplicate_object then
      null;
    end;

    begin
      execute 'alter publication supabase_realtime add table public.audit_logs';
    exception when duplicate_object then
      null;
    end;

    begin
      execute 'alter publication supabase_realtime add table public.judges';
    exception when duplicate_object then
      null;
    end;

    begin
      execute 'alter publication supabase_realtime add table public.notifications';
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;


-- =========================================================
-- Phase 2 + 4: Search + performance indexes
-- =========================================================

alter table if exists public.submissions
  add column if not exists search_vector tsvector;

create or replace function public.update_submissions_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.applicant_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.applicant_email, '')), 'B');
  return new;
end;
$$;

drop trigger if exists trg_submissions_search_vector on public.submissions;
create trigger trg_submissions_search_vector
before insert or update of title, applicant_name, applicant_email
on public.submissions
for each row
execute function public.update_submissions_search_vector();

update public.submissions
set search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(applicant_name, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(applicant_email, '')), 'B')
where search_vector is null;

create index if not exists idx_submissions_search_vector
  on public.submissions using gin (search_vector);

create index if not exists idx_submissions_program_status
  on public.submissions (program_id, status);

create index if not exists idx_submissions_submitted_at_desc
  on public.submissions (submitted_at desc);

create index if not exists idx_submission_judges_judge_id
  on public.submission_judges (judge_id);

create index if not exists idx_submission_judges_submission_id
  on public.submission_judges (submission_id);

create index if not exists idx_organization_members_user_org
  on public.organization_members (user_id, organization_id);

create index if not exists idx_audit_logs_org_created_at_desc
  on public.audit_logs (organization_id, created_at desc);


-- =========================================================
-- Phase 3 + 4: Payments (Stripe Connect + metadata)
-- =========================================================

alter table if exists public.program_payment_configs
  add column if not exists provider_account_id text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists provider_metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_program_payment_configs_provider
  on public.program_payment_configs (provider);

create index if not exists idx_program_payment_configs_connected
  on public.program_payment_configs (connected, onboarding_completed);

commit;

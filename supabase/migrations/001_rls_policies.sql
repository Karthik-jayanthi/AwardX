-- AwardX security hardening migration
-- Enables RLS and creates baseline organization/judge/public policies.

begin;

create or replace function public.current_org_ids()
returns setof uuid
language sql
stable
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
create policy if not exists programs_org_member_rw on public.programs
for all
to authenticated
using (organization_id in (select public.current_org_ids()))
with check (organization_id in (select public.current_org_ids()));

create policy if not exists programs_public_read on public.programs
for select
to anon, authenticated
using (coalesce(visibility, 'public') = 'public' and coalesce(status, 'draft') = 'active');

-- categories
create policy if not exists categories_org_member_rw on public.categories
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
create policy if not exists submissions_org_member_rw on public.submissions
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

create policy if not exists submissions_judge_token_read on public.submissions
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
create policy if not exists judges_org_member_rw on public.judges
for all
to authenticated
using (organization_id in (select public.current_org_ids()))
with check (organization_id in (select public.current_org_ids()));

-- scores
create policy if not exists scores_org_member_rw on public.scores
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
create policy if not exists judging_criteria_org_member_rw on public.judging_criteria
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
create policy if not exists organization_members_org_member_rw on public.organization_members
for all
to authenticated
using (organization_id in (select public.current_org_ids()))
with check (organization_id in (select public.current_org_ids()));

-- organization_invites
create policy if not exists organization_invites_org_member_rw on public.organization_invites
for all
to authenticated
using (organization_id in (select public.current_org_ids()))
with check (organization_id in (select public.current_org_ids()));

-- roles
create policy if not exists roles_org_member_rw on public.roles
for all
to authenticated
using (organization_id in (select public.current_org_ids()))
with check (organization_id in (select public.current_org_ids()));

-- role_permissions
create policy if not exists role_permissions_org_member_rw on public.role_permissions
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
create policy if not exists rounds_org_member_rw on public.rounds
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
create policy if not exists program_forms_org_member_rw on public.program_forms
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
create policy if not exists program_form_fields_org_member_rw on public.program_form_fields
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

-- audit logs: append-only
create policy if not exists audit_logs_org_member_read on public.audit_logs
for select
to authenticated
using (organization_id in (select public.current_org_ids()));

create policy if not exists audit_logs_org_member_insert on public.audit_logs
for insert
to authenticated
with check (organization_id in (select public.current_org_ids()));

commit;

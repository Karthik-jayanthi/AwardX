-- Phase 2 + Phase 4: search and query performance indexes

alter table if exists public.submissions
  add column if not exists search_vector tsvector;

update public.submissions
set search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(applicant_name, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(applicant_email, '')), 'B')
where search_vector is null;

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

create index if not exists idx_submissions_search_vector
  on public.submissions using gin (search_vector);

create index if not exists idx_submissions_program_status
  on public.submissions (program_id, status);

create index if not exists idx_submissions_created_at_desc
  on public.submissions (created_at desc);

create index if not exists idx_submission_judges_judge_id
  on public.submission_judges (judge_id);

create index if not exists idx_submission_judges_submission_id
  on public.submission_judges (submission_id);

create index if not exists idx_organization_members_user_org
  on public.organization_members (user_id, organization_id);

create index if not exists idx_audit_logs_org_created_at_desc
  on public.audit_logs (organization_id, created_at desc);

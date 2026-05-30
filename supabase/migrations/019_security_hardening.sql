-- Security hardening: payment config exposure, RLS gaps, integration_sources validation, RPC lockdown.

begin;

-- ---------------------------------------------------------------------------
-- Payment configs: public view without secrets; block direct table access
-- ---------------------------------------------------------------------------

create or replace view public.program_payment_configs_public
with (security_invoker = true) as
select
  program_id,
  enabled,
  provider,
  currency,
  fee_amount,
  connected,
  public_key,
  onboarding_completed
from public.program_payment_configs;

grant select on public.program_payment_configs_public to anon, authenticated;

alter table if exists public.program_payment_configs enable row level security;

drop policy if exists program_payment_configs_deny_client on public.program_payment_configs;
create policy program_payment_configs_deny_client on public.program_payment_configs
for all
to anon, authenticated
using (false)
with check (false);

-- ---------------------------------------------------------------------------
-- submission_judges RLS
-- ---------------------------------------------------------------------------

alter table if exists public.submission_judges enable row level security;

drop policy if exists submission_judges_org_member_rw on public.submission_judges;
create policy submission_judges_org_member_rw on public.submission_judges
for all
to authenticated
using (
  exists (
    select 1
    from public.submissions s
    join public.programs p on p.id = s.program_id
    where s.id = submission_judges.submission_id
      and p.organization_id in (select public.current_org_ids())
  )
)
with check (
  exists (
    select 1
    from public.submissions s
    join public.programs p on p.id = s.program_id
    where s.id = submission_judges.submission_id
      and p.organization_id in (select public.current_org_ids())
  )
);

-- ---------------------------------------------------------------------------
-- Validate integration_sources JSON on programs
-- ---------------------------------------------------------------------------

create or replace function public.validate_program_integration_sources()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  key text;
  source_id uuid;
  org_id uuid;
begin
  if new.integration_sources is null then
    new.integration_sources := '{}'::jsonb;
    return new;
  end if;

  if jsonb_typeof(new.integration_sources) <> 'object' then
    raise exception 'integration_sources must be a JSON object';
  end if;

  org_id := new.organization_id;

  for key in select jsonb_object_keys(new.integration_sources)
  loop
    if key not in ('resend', 'didit', 'payment') then
      raise exception 'Invalid integration_sources key: %', key;
    end if;

    if new.integration_sources ->> key is null or new.integration_sources ->> key = '' then
      continue;
    end if;

    begin
      source_id := (new.integration_sources ->> key)::uuid;
    exception when others then
      raise exception 'integration_sources.% must be a UUID or null', key;
    end;

    if source_id = new.id then
      raise exception 'A program cannot inherit integrations from itself (%).', key;
    end if;

    if not exists (
      select 1
      from public.programs src
      where src.id = source_id
        and src.organization_id = org_id
    ) then
      raise exception 'integration_sources.% must reference a program in the same organization', key;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_validate_program_integration_sources on public.programs;
create trigger trg_validate_program_integration_sources
before insert or update of integration_sources, organization_id on public.programs
for each row execute function public.validate_program_integration_sources();

-- ---------------------------------------------------------------------------
-- Drop permissive program policies if present on remote environments
-- ---------------------------------------------------------------------------

drop policy if exists "Allow insert programs" on public.programs;
drop policy if exists "Allow update programs" on public.programs;

-- ---------------------------------------------------------------------------
-- Revoke public/anon execution of sensitive SECURITY DEFINER RPCs
-- ---------------------------------------------------------------------------

revoke all on function public.setup_new_organization(character varying, character varying, uuid) from anon;
revoke all on function public.setup_new_organization(text, text, uuid) from anon;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.log_audit_event(uuid, text, text, text, uuid, text, jsonb) from anon;
revoke all on function public.get_user_organization_id(uuid) from anon;
revoke all on function public.current_org_ids() from anon;

commit;

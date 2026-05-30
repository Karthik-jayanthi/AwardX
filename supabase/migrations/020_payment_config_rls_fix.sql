-- Allow org members to manage payment configs while keeping secrets off public reads.

begin;

drop policy if exists program_payment_configs_deny_client on public.program_payment_configs;

drop policy if exists program_payment_configs_anon_deny on public.program_payment_configs;
create policy program_payment_configs_anon_deny on public.program_payment_configs
for all
to anon
using (false)
with check (false);

drop policy if exists program_payment_configs_org_member_rw on public.program_payment_configs;
create policy program_payment_configs_org_member_rw on public.program_payment_configs
for all
to authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = program_payment_configs.program_id
      and p.organization_id in (select public.current_org_ids())
  )
)
with check (
  exists (
    select 1
    from public.programs p
    where p.id = program_payment_configs.program_id
      and p.organization_id in (select public.current_org_ids())
  )
);

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
  onboarding_completed,
  (coalesce(secret_key_encrypted, secret_key) is not null) as has_secret_key
from public.program_payment_configs;

grant select on public.program_payment_configs_public to anon, authenticated;

commit;

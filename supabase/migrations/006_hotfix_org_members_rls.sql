-- Hotfix: resolve organization_members 500 errors caused by recursive RLS evaluation.
-- Run this in Supabase SQL Editor on environments where 005 has already been applied.

begin;

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

alter table if exists public.organization_members enable row level security;

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

commit;

-- Phase 2: realtime support + notifications

-- Realtime delete/update payloads need replica identity full.
alter table if exists public.submissions replica identity full;
alter table if exists public.submission_judges replica identity full;
alter table if exists public.scores replica identity full;
alter table if exists public.audit_logs replica identity full;
alter table if exists public.judges replica identity full;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
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

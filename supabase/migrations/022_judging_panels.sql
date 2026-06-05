begin;

-- Judging panels (groups) for organizing judges into named groups
create table if not exists public.judging_panels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Panel membership: links judges to panels
create table if not exists public.judging_panel_members (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid not null references public.judging_panels(id) on delete cascade,
  judge_id uuid not null references public.judges(id) on delete cascade,
  added_at timestamptz default now(),
  unique(panel_id, judge_id)
);

-- RLS
alter table public.judging_panels enable row level security;
alter table public.judging_panel_members enable row level security;

create policy "org members can view panels"
  on public.judging_panels for select
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "org members can manage panels"
  on public.judging_panels for all
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "panel members viewable by org"
  on public.judging_panel_members for select
  using (panel_id in (
    select id from public.judging_panels where organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  ));

create policy "panel members manageable by org"
  on public.judging_panel_members for all
  using (panel_id in (
    select id from public.judging_panels where organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  ));

-- Indexes
create index idx_judging_panels_program on public.judging_panels(program_id);
create index idx_judging_panel_members_panel on public.judging_panel_members(panel_id);
create index idx_judging_panel_members_judge on public.judging_panel_members(judge_id);

commit;

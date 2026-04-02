-- Phase 3 + Phase 4: multi-gateway payment metadata and connect onboarding support

alter table if exists public.program_payment_configs
  add column if not exists provider_account_id text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists provider_metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_program_payment_configs_provider
  on public.program_payment_configs (provider);

create index if not exists idx_program_payment_configs_connected
  on public.program_payment_configs (connected, onboarding_completed);

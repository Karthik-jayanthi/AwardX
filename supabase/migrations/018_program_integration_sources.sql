-- Per-integration optional inheritance from another program in the same organization.
-- Keys: resend, didit, payment (each holds a source program uuid or is omitted/null for own/org defaults).

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS integration_sources jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.programs
SET integration_sources = jsonb_build_object('payment', integration_source_program_id)
WHERE integration_source_program_id IS NOT NULL
  AND (integration_sources IS NULL OR integration_sources = '{}'::jsonb);

COMMENT ON COLUMN public.programs.integration_sources IS
  'Optional per-integration inheritance from another program. Keys: resend, didit, payment.';

ALTER TABLE public.programs
  DROP COLUMN IF EXISTS integration_source_program_id;

DROP INDEX IF EXISTS idx_programs_integration_source_program_id;

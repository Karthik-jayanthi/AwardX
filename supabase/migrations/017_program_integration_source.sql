-- Legacy payment-only inheritance column (superseded by integration_sources in 018).

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS integration_source_program_id uuid
  REFERENCES public.programs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_programs_integration_source_program_id
  ON public.programs(integration_source_program_id)
  WHERE integration_source_program_id IS NOT NULL;

COMMENT ON COLUMN public.programs.integration_source_program_id IS
  'When set, payment gateway settings for this program are inherited from the referenced program.';

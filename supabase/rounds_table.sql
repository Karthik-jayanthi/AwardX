-- Create rounds table if it doesn't exist
-- This table stores evaluation rounds for programs

CREATE TABLE IF NOT EXISTS public.rounds (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  program_id uuid,
  title character varying NOT NULL,
  description text,
  type character varying NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  status character varying DEFAULT 'upcoming'::character varying,
  sort_order integer DEFAULT 0,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rounds_pkey PRIMARY KEY (id),
  CONSTRAINT rounds_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE
);

-- Create index for faster program queries
CREATE INDEX IF NOT EXISTS idx_rounds_program_id ON public.rounds(program_id);
CREATE INDEX IF NOT EXISTS idx_rounds_status ON public.rounds(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (in case we're updating)
DROP POLICY IF EXISTS "Users can view rounds for their organization's programs" ON public.rounds;
DROP POLICY IF EXISTS "Users can insert rounds for their organization's programs" ON public.rounds;
DROP POLICY IF EXISTS "Users can update rounds for their organization's programs" ON public.rounds;
DROP POLICY IF EXISTS "Users can delete rounds for their organization's programs" ON public.rounds;

-- RLS Policy: Users can only see rounds for programs in their organization
CREATE POLICY "Users can view rounds for their organization's programs"
  ON public.rounds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.programs p
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = rounds.program_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- RLS Policy: Users can insert rounds for their organization's programs
CREATE POLICY "Users can insert rounds for their organization's programs"
  ON public.rounds
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.programs p
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = rounds.program_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- RLS Policy: Users can update rounds for their organization's programs
CREATE POLICY "Users can update rounds for their organization's programs"
  ON public.rounds
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.programs p
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = rounds.program_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.programs p
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = rounds.program_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- RLS Policy: Users can delete rounds for their organization's programs
CREATE POLICY "Users can delete rounds for their organization's programs"
  ON public.rounds
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.programs p
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = rounds.program_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );


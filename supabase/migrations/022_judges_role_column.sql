-- Add missing role column to judges
ALTER TABLE public.judges
  ADD COLUMN IF NOT EXISTS role character varying;

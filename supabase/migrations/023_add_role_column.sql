/* Add role column to judges table */
ALTER TABLE public.judges ADD COLUMN IF NOT EXISTS role varchar;

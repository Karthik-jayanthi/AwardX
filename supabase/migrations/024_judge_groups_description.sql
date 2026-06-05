ALTER TABLE public.judge_groups
  ADD COLUMN IF NOT EXISTS description text;

-- Enforce unique category names within the same program and parent level
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_title_per_level
  ON public.categories (program_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), LOWER(TRIM(title)));

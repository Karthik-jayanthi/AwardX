-- Alter categories parent_id foreign key constraint to cascade delete subcategories
ALTER TABLE public.categories
DROP CONSTRAINT IF EXISTS categories_parent_id_fkey,
ADD CONSTRAINT categories_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES public.categories(id)
  ON DELETE CASCADE;

-- Alter submissions category_id foreign key constraint to set null on delete
ALTER TABLE public.submissions
DROP CONSTRAINT IF EXISTS submissions_category_id_fkey,
ADD CONSTRAINT submissions_category_id_fkey
  FOREIGN KEY (category_id)
  REFERENCES public.categories(id)
  ON DELETE SET NULL;

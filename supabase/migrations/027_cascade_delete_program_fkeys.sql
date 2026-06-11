-- Add ON DELETE CASCADE to foreign keys referencing programs(id)
-- This ensures deleting a program automatically cleans up dependent rows.

-- roles.program_id -> programs(id)
ALTER TABLE public.roles
  DROP CONSTRAINT IF EXISTS roles_program_id_fkey,
  ADD CONSTRAINT roles_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

-- organization_members.role_id -> roles(id)
ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_id_fkey,
  ADD CONSTRAINT organization_members_role_id_fkey
    FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;

-- organization_invites.role_id -> roles(id)
ALTER TABLE public.organization_invites
  DROP CONSTRAINT IF EXISTS organization_invites_role_id_fkey,
  ADD CONSTRAINT organization_invites_role_id_fkey
    FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;

-- role_permissions.role_id -> roles(id)
ALTER TABLE public.role_permissions
  DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey,
  ADD CONSTRAINT role_permissions_role_id_fkey
    FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;

-- rounds.program_id -> programs(id)
ALTER TABLE public.rounds
  DROP CONSTRAINT IF EXISTS rounds_program_id_fkey,
  ADD CONSTRAINT rounds_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

-- submissions.program_id -> programs(id)
ALTER TABLE public.submissions
  DROP CONSTRAINT IF EXISTS submissions_program_id_fkey,
  ADD CONSTRAINT submissions_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

-- categories.program_id -> programs(id)
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_program_id_fkey,
  ADD CONSTRAINT categories_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

-- program_forms.program_id -> programs(id)
ALTER TABLE public.program_forms
  DROP CONSTRAINT IF EXISTS program_forms_program_id_fkey,
  ADD CONSTRAINT program_forms_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

-- judges.program_id -> programs(id)
ALTER TABLE public.judges
  DROP CONSTRAINT IF EXISTS judges_program_id_fkey,
  ADD CONSTRAINT judges_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

-- judge_groups.program_id -> programs(id)
ALTER TABLE public.judge_groups
  DROP CONSTRAINT IF EXISTS judge_groups_program_id_fkey,
  ADD CONSTRAINT judge_groups_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

-- judging_criteria.program_id -> programs(id)
ALTER TABLE public.judging_criteria
  DROP CONSTRAINT IF EXISTS judging_criteria_program_id_fkey,
  ADD CONSTRAINT judging_criteria_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

-- organization_invites.program_id -> programs(id)
ALTER TABLE public.organization_invites
  DROP CONSTRAINT IF EXISTS organization_invites_program_id_fkey,
  ADD CONSTRAINT organization_invites_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

-- organization_members.program_id -> programs(id)
ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_program_id_fkey,
  ADD CONSTRAINT organization_members_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

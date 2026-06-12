-- Ensure current_org_ids() is SECURITY DEFINER to avoid RLS recursion issues.
-- If this function was previously created without SECURITY DEFINER, the RLS policies
-- on programs (and other tables) will fail because the function's internal queries
-- to profiles/organization_members would themselves be subject to RLS.

CREATE OR REPLACE FUNCTION public.current_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.organization_id
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.organization_id IS NOT NULL
  UNION
  SELECT om.organization_id
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
    AND om.organization_id IS NOT NULL
    AND coalesce(om.status, 'active') = 'active'
$$;

REVOKE ALL ON FUNCTION public.current_org_ids() FROM public;
GRANT EXECUTE ON FUNCTION public.current_org_ids() TO authenticated, anon;

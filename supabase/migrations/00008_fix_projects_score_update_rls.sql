
-- ================================================
-- FIX: Allow judges and admins to update project score aggregates
-- ================================================

-- Ensure RLS is enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop policy for updating project score aggregates
DROP POLICY IF EXISTS "Judges and admins can update project scores" ON public.projects;

CREATE POLICY "Judges and admins can update project scores"
  ON public.projects
  FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('judge', 'admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('judge', 'admin')
  );

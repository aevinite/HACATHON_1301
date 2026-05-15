
-- ================================================
-- FIX: Allow judges and admins to manage scores properly
-- ================================================

-- Ensure RLS is enabled
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Drop ALL possible existing scores policies
DROP POLICY IF EXISTS "Judges can view their own scores" ON public.scores;
DROP POLICY IF EXISTS "Admins can view all scores" ON public.scores;
DROP POLICY IF EXISTS "Judges can manage their own scores" ON public.scores;
DROP POLICY IF EXISTS "Judges and admins can view scores" ON public.scores;
DROP POLICY IF EXISTS "Judges and admins can manage scores" ON public.scores;

-- Allow all authenticated users with role judge or admin to view scores
CREATE POLICY "Judges and admins can view scores"
  ON public.scores
  FOR SELECT
  USING (
    auth.uid() = judge_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'judge')
  );

-- Allow judges to manage their own scores and admins to manage all scores
CREATE POLICY "Judges and admins can manage scores"
  ON public.scores
  FOR ALL
  USING (
    auth.uid() = judge_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = judge_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

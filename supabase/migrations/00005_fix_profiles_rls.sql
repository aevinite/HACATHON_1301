
-- ================================================
-- FIX: Recursive RLS Policy on public.profiles
-- ================================================
-- Problem: Original policy references profiles table internally, causing infinite recursion
-- Solution: Create a SECURITY DEFINER helper function to safely get user role
-- ================================================

-- ================================================
-- Step 1: Create helper function
-- ================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- Step 2: Drop and recreate the problematic policy
-- ================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.get_current_user_role() = 'admin');

-- ================================================
-- END OF MIGRATION
-- ================================================

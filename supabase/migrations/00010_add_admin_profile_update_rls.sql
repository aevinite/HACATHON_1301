
-- ================================================
-- ADD: Admin RLS Policy for Admin Profile Updates
-- ================================================
-- Allow admins to update any profile's role
-- ================================================

-- Drop existing update policy and recreate with admin access
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policy that allows users to update their own profile
-- and admins to update any profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.get_current_user_role() = 'admin')
  WITH CHECK (auth.uid() = id OR public.get_current_user_role() = 'admin');

-- ================================================
-- END OF MIGRATION
-- ================================================
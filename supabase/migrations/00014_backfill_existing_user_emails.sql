-- ================================================
-- BACKFILL EXISTING USERS' EMAILS IN PROFILES TABLE
-- ================================================

-- This is a helper SQL script - you need to run this in Supabase SQL Editor
-- because it requires accessing auth.users table

-- First, let's check if we can access auth.users (you might need to be a service role)
-- Uncomment and run the following in Supabase SQL Editor:

/*
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;
*/

-- ================================================
-- END OF SCRIPT
-- ================================================

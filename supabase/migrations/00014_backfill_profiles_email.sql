-- ================================================
-- BACKFILL EMAIL COLUMN FOR EXISTING PROFILES
-- ================================================

-- Update existing profiles with their email from auth.users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
AND p.email IS NULL;

-- ================================================
-- END OF MIGRATION
-- ================================================

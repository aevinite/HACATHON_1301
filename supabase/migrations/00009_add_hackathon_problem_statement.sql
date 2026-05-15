
-- Add problem_statement column to hackathons table
ALTER TABLE public.hackathons
ADD COLUMN IF NOT EXISTS problem_statement TEXT;

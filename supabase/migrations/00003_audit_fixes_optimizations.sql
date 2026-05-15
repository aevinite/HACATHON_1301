-- ================================================
-- HACKJUDGE: AUDIT FIXES & OPTIMIZATIONS (Priority 1)
-- ================================================
-- Fixes critical issues identified in the database audit
-- ================================================

-- ================================================
-- 1. ADD MISSING CRITICAL INDEXES
-- ================================================

-- Leaderboard composite index (filters + sort)
CREATE INDEX IF NOT EXISTS idx_projects_leaderboard_composite 
ON public.projects (
  hackathon_id, 
  status, 
  is_visible, 
  average_score DESC NULLS LAST,
  created_at ASC
);

-- Score query optimization (project + submitted status)
CREATE INDEX IF NOT EXISTS idx_scores_project_submitted 
ON public.scores (project_id, is_submitted);

-- Hackathon creator + status composite
CREATE INDEX IF NOT EXISTS idx_hackathons_creator_status 
ON public.hackathons (created_by, status);

-- Profile role index (faster RLS checks)
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON public.profiles (role);

-- Projects by creation date (pagination)
CREATE INDEX IF NOT EXISTS idx_projects_created 
ON public.projects (hackathon_id, created_at DESC);

-- Scores by judge + creation date
CREATE INDEX IF NOT EXISTS idx_scores_judge_created 
ON public.scores (judge_id, created_at DESC);

-- ================================================
-- 2. SOFT DELETE PATTERN (Add deleted_at columns)
-- ================================================
-- Allows safe "deletion" without losing data

ALTER TABLE public.hackathons 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update RLS policies to respect soft deletes
-- (Note: Full policy updates would be in a separate migration)

-- ================================================
-- 3. HELPER FUNCTIONS FOR FASTER RLS CHECKS
-- ================================================

-- Check if user is admin (security definer = faster)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user is team leader for a project
CREATE OR REPLACE FUNCTION public.is_team_leader_for_project(user_id UUID, project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.teams t ON t.id = p.team_id
    WHERE p.id = project_id AND t.leader_id = user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user is team member for a project
CREATE OR REPLACE FUNCTION public.is_team_member_for_project(user_id UUID, project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.teams t ON t.id = p.team_id
    LEFT JOIN public.team_members tm ON tm.team_id = t.id
    WHERE p.id = project_id 
      AND (t.leader_id = user_id OR tm.user_id = user_id)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ================================================
-- 4. MATERIALIZED VIEW: LEADERBOARD CACHE
-- ================================================
-- Pre-computes leaderboard for fast reads

CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard AS
SELECT
  p.id,
  p.hackathon_id,
  p.name,
  p.tagline,
  p.team_id,
  p.average_score,
  p.total_judged,
  p.created_at,
  t.name AS team_name,
  ROW_NUMBER() OVER (
    PARTITION BY p.hackathon_id 
    ORDER BY p.average_score DESC NULLS LAST, p.created_at ASC
  ) AS rank
FROM public.projects p
JOIN public.teams t ON t.id = p.team_id
WHERE 
  p.status = 'submitted' 
  AND p.is_visible = true
  AND p.deleted_at IS NULL
  AND t.deleted_at IS NULL;

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_project
ON public.leaderboard (id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_hackathon
ON public.leaderboard (hackathon_id, rank);

-- ================================================
-- 5. FUNCTION: REFRESH LEADERBOARD
-- ================================================

CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.leaderboard;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 6. AUDIT LOGGING (Basic)
-- ================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table 
ON public.audit_logs (table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by 
ON public.audit_logs (changed_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at 
ON public.audit_logs (changed_at DESC);

-- ================================================
-- END OF MIGRATION
-- ================================================

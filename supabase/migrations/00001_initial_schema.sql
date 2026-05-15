-- ================================================
-- HACKJUDGE: FULL POSTGRESQL SCHEMA + RLS
-- ================================================
--
-- TABLES:
-- 1. profiles                - User profiles (extends Supabase Auth)
-- 2. hackathons              - Hackathon events
-- 3. categories              - Hackathon categories
-- 4. rubric_criteria         - Scoring rubric items
-- 5. timeline_events         - Hackathon timeline
-- 6. problem_statements      - Problem statement files
-- 7. teams                   - Teams participating in hackathons
-- 8. team_members            - Members of each team
-- 9. projects                - Project submissions
--10. project_tech_stack      - Tech stack tags for projects
--11. judges                  - Judges assigned to hackathons
--12. scores                  - Judge scores for projects
--13. score_criteria          - Per-criterion scores
--
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABLE 1: profiles
-- ================================================
-- Extends Supabase Auth users with additional profile data
-- One-to-one with auth.users
-- ================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'team' CHECK (role IN ('admin', 'team', 'judge', 'organizer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id)
);

-- ================================================
-- TABLE 2: hackathons
-- ================================================
-- Main hackathon event
-- ================================================
CREATE TABLE IF NOT EXISTS public.hackathons (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  theme TEXT,
  banner_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'registration', 'submission', 'judging', 'completed')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  
  -- Deadlines
  registration_start_date TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  submission_deadline TIMESTAMPTZ,
  judging_deadline TIMESTAMPTZ,
  
  -- Team size limits
  min_team_size INTEGER NOT NULL DEFAULT 1 CHECK (min_team_size >= 1),
  max_team_size INTEGER NOT NULL DEFAULT 5 CHECK (max_team_size >= min_team_size),
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id)
);

-- ================================================
-- TABLE 3: categories
-- ================================================
-- Categories for projects within a hackathon
-- ================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id),
  UNIQUE (hackathon_id, name)
);

-- ================================================
-- TABLE 4: rubric_criteria
-- ================================================
-- Scoring rubric criteria per hackathon
-- ================================================
CREATE TABLE IF NOT EXISTS public.rubric_criteria (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_score INTEGER NOT NULL CHECK (max_score >= 1 AND max_score <= 100),
  weight NUMERIC NOT NULL DEFAULT 1 CHECK (weight > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id)
);

-- ================================================
-- TABLE 5: timeline_events
-- ================================================
-- Timeline events for hackathon
-- ================================================
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id)
);

-- ================================================
-- TABLE 6: problem_statements
-- ================================================
-- Problem statement documents/files
-- ================================================
CREATE TABLE IF NOT EXISTS public.problem_statements (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id)
);

-- ================================================
-- TABLE 7: teams
-- ================================================
-- Teams participating in hackathons
-- ================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id),
  UNIQUE (name, hackathon_id)
);

-- ================================================
-- TABLE 8: team_members
-- ================================================
-- Members of each team
-- ================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT, -- e.g., "Frontend Developer"
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id),
  UNIQUE (team_id, user_id)
);

-- ================================================
-- TABLE 9: projects
-- ================================================
-- Project submissions
-- ================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Media & Links
  cover_image TEXT,
  video_url TEXT,
  github_url TEXT,
  live_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'disqualified')),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  
  -- Aggregated scoring (denormalized for performance)
  average_score NUMERIC,
  total_judged INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id),
  UNIQUE (team_id, hackathon_id)
);

-- ================================================
-- TABLE 10: project_tech_stack
-- ================================================
-- Tech stack tags for projects
-- ================================================
CREATE TABLE IF NOT EXISTS public.project_tech_stack (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  technology TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id),
  UNIQUE (project_id, technology)
);

-- ================================================
-- TABLE 11: judges
-- ================================================
-- Judges assigned to hackathons
-- ================================================
CREATE TABLE IF NOT EXISTS public.judges (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  judge_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id),
  UNIQUE (user_id, hackathon_id),
  UNIQUE (judge_id)
);

-- ================================================
-- TABLE 12: scores
-- ================================================
-- Judge scores for projects (one per judge per project)
-- ================================================
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  
  -- Computed weighted total
  total_score NUMERIC NOT NULL CHECK (total_score >= 0),
  
  -- Judge feedback
  comment TEXT,
  
  is_submitted BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id),
  UNIQUE (project_id, judge_id)
);

-- ================================================
-- TABLE 13: score_criteria
-- ================================================
-- Per-criterion scores
-- ================================================
CREATE TABLE IF NOT EXISTS public.score_criteria (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  score_id UUID NOT NULL REFERENCES public.scores(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES public.rubric_criteria(id) ON DELETE CASCADE,
  criterion_name TEXT NOT NULL,
  score NUMERIC NOT NULL CHECK (score >= 0),
  max_score INTEGER NOT NULL CHECK (max_score >= 1),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id)
);

-- ================================================
-- INDEXES
-- ================================================
-- Common query patterns
-- ================================================

-- Hackathons
CREATE INDEX IF NOT EXISTS idx_hackathons_status ON public.hackathons(status);
CREATE INDEX IF NOT EXISTS idx_hackathons_created_by ON public.hackathons(created_by);
CREATE INDEX IF NOT EXISTS idx_hackathons_is_public ON public.hackathons(is_public);

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_hackathon ON public.teams(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader ON public.teams(leader_id);

-- Team Members
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_hackathon ON public.projects(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_projects_team ON public.projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_hackathon_status ON public.projects(hackathon_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_hackathon_score ON public.projects(hackathon_id, average_score DESC);
CREATE INDEX IF NOT EXISTS idx_projects_is_visible ON public.projects(is_visible);
CREATE INDEX IF NOT EXISTS idx_projects_search ON public.projects USING GIN (
  to_tsvector('english', name || ' ' || tagline || ' ' || description)
);

-- Scores
CREATE INDEX IF NOT EXISTS idx_scores_project ON public.scores(project_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge ON public.scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_hackathon ON public.scores(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_scores_hackathon_judge ON public.scores(hackathon_id, judge_id);

-- Judges
CREATE INDEX IF NOT EXISTS idx_judges_hackathon ON public.judges(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_judges_user ON public.judges(user_id);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_hackathon ON public.categories(hackathon_id);

-- Rubric Criteria
CREATE INDEX IF NOT EXISTS idx_rubric_criteria_hackathon ON public.rubric_criteria(hackathon_id);

-- Timeline Events
CREATE INDEX IF NOT EXISTS idx_timeline_events_hackathon ON public.timeline_events(hackathon_id);

-- Problem Statements
CREATE INDEX IF NOT EXISTS idx_problem_statements_hackathon ON public.problem_statements(hackathon_id);

-- ================================================
-- END OF TABLES
-- ================================================

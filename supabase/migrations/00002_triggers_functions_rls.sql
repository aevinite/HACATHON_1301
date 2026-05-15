-- ================================================
-- HACKJUDGE: TRIGGERS, FUNCTIONS, AND RLS POLICIES
-- ================================================

-- ================================================
-- PART 1: UTILITY FUNCTIONS
-- ================================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- PART 2: PROFILES TRIGGER (SYNC WITH SUPABASE AUTH)
-- ================================================

-- Function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'team')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile on auth.user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- PART 3: UPDATED_AT TIMESTAMP TRIGGERS
-- ================================================

-- Profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Hackathons
DROP TRIGGER IF EXISTS set_hackathons_updated_at ON public.hackathons;
CREATE TRIGGER set_hackathons_updated_at
  BEFORE UPDATE ON public.hackathons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Teams
DROP TRIGGER IF EXISTS set_teams_updated_at ON public.teams;
CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Projects
DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Judges
DROP TRIGGER IF EXISTS set_judges_updated_at ON public.judges;
CREATE TRIGGER set_judges_updated_at
  BEFORE UPDATE ON public.judges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Scores
DROP TRIGGER IF EXISTS set_scores_updated_at ON public.scores;
CREATE TRIGGER set_scores_updated_at
  BEFORE UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ================================================
-- PART 4: SCORING AGGREGATION TRIGGER
-- ================================================

-- Function to update project's average score and total_judged
CREATE OR REPLACE FUNCTION public.update_project_score()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Determine project_id from NEW or OLD
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
  ELSE
    v_project_id := NEW.project_id;
  END IF;

  -- Update project aggregates
  UPDATE public.projects
  SET
    average_score = (
      SELECT ROUND(AVG(total_score)::NUMERIC, 2)
      FROM public.scores
      WHERE project_id = v_project_id AND is_submitted = true
    ),
    total_judged = (
      SELECT COUNT(*)
      FROM public.scores
      WHERE project_id = v_project_id AND is_submitted = true
    )
  WHERE id = v_project_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update project score on score change
DROP TRIGGER IF EXISTS on_score_change ON public.scores;
CREATE TRIGGER on_score_change
  AFTER INSERT OR UPDATE OR DELETE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.update_project_score();

-- ================================================
-- PART 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tech_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_criteria ENABLE ROW LEVEL SECURITY;

-- ================================================
-- POLICY 1: profiles
-- ================================================
-- Users can view their own profile
-- Admins can view all profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ================================================
-- POLICY 2: hackathons
-- ================================================
-- Anyone can view public hackathons
CREATE POLICY "Anyone can view public hackathons"
  ON public.hackathons
  FOR SELECT
  USING (is_public = true);

-- Creators and admins can view/edit their hackathons
CREATE POLICY "Creators and admins can manage their hackathons"
  ON public.hackathons
  FOR ALL
  USING (
    auth.uid() = created_by OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = created_by OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ================================================
-- POLICY 3: teams
-- ================================================
-- Anyone can view teams in public hackathons
CREATE POLICY "Anyone can view teams"
  ON public.teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = teams.hackathon_id AND h.is_public = true
    )
  );

-- Team leaders and admins can manage teams
CREATE POLICY "Team leaders and admins can manage teams"
  ON public.teams
  FOR ALL
  USING (
    auth.uid() = leader_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = leader_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ================================================
-- POLICY 4: team_members
-- ================================================
-- Anyone can view team members
CREATE POLICY "Anyone can view team members"
  ON public.team_members
  FOR SELECT
  USING (true);

-- Team leaders and admins can manage team members
CREATE POLICY "Team leaders and admins can manage members"
  ON public.team_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id AND t.leader_id = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id AND t.leader_id = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ================================================
-- POLICY 5: projects
-- ================================================
-- Anyone can view visible, submitted projects
CREATE POLICY "Anyone can view visible projects"
  ON public.projects
  FOR SELECT
  USING (is_visible = true AND status = 'submitted');

-- Team members and admins can view their projects
CREATE POLICY "Team members and admins can view their projects"
  ON public.projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      LEFT JOIN public.team_members tm ON tm.team_id = t.id
      WHERE t.id = projects.team_id AND (t.leader_id = auth.uid() OR tm.user_id = auth.uid())
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Team leaders and admins can manage projects
CREATE POLICY "Team leaders and admins can manage projects"
  ON public.projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = projects.team_id AND t.leader_id = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = projects.team_id AND t.leader_id = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ================================================
-- POLICY 6: scores
-- ================================================
-- Judges can view their own scores
CREATE POLICY "Judges can view their own scores"
  ON public.scores
  FOR SELECT
  USING (auth.uid() = judge_id);

-- Admins can view all scores
CREATE POLICY "Admins can view all scores"
  ON public.scores
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Judges can manage their own scores
CREATE POLICY "Judges can manage their own scores"
  ON public.scores
  FOR ALL
  USING (auth.uid() = judge_id)
  WITH CHECK (auth.uid() = judge_id);

-- ================================================
-- POLICY 7: judges
-- ================================================
-- Judges can view their own assignments
CREATE POLICY "Judges can view their own assignments"
  ON public.judges
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage judges
CREATE POLICY "Admins can manage judges"
  ON public.judges
  FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ================================================
-- POLICY 8: All other tables (read-only unless admin or creator)
-- ================================================

-- categories
CREATE POLICY "Anyone can view categories"
  ON public.categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and hackathon creators can manage categories"
  ON public.categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = categories.hackathon_id AND h.created_by = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = categories.hackathon_id AND h.created_by = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- rubric_criteria
CREATE POLICY "Anyone can view rubric criteria"
  ON public.rubric_criteria
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and hackathon creators can manage rubric"
  ON public.rubric_criteria
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = rubric_criteria.hackathon_id AND h.created_by = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = rubric_criteria.hackathon_id AND h.created_by = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- timeline_events
CREATE POLICY "Anyone can view timeline events"
  ON public.timeline_events
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and hackathon creators can manage timeline"
  ON public.timeline_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = timeline_events.hackathon_id AND h.created_by = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = timeline_events.hackathon_id AND h.created_by = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- problem_statements
CREATE POLICY "Anyone can view problem statements"
  ON public.problem_statements
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and hackathon creators can manage problem statements"
  ON public.problem_statements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = problem_statements.hackathon_id AND h.created_by = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = problem_statements.hackathon_id AND h.created_by = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- project_tech_stack
CREATE POLICY "Anyone can view project tech stack"
  ON public.project_tech_stack
  FOR SELECT
  USING (true);

CREATE POLICY "Team leaders and admins can manage tech stack"
  ON public.project_tech_stack
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.teams t ON t.id = p.team_id
      WHERE p.id = project_tech_stack.project_id AND t.leader_id = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.teams t ON t.id = p.team_id
      WHERE p.id = project_tech_stack.project_id AND t.leader_id = auth.uid()
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- score_criteria
CREATE POLICY "Judges can view their own score criteria"
  ON public.score_criteria
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scores s
      WHERE s.id = score_criteria.score_id AND s.judge_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all score criteria"
  ON public.score_criteria
  FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Judges can manage their own score criteria"
  ON public.score_criteria
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scores s
      WHERE s.id = score_criteria.score_id AND s.judge_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scores s
      WHERE s.id = score_criteria.score_id AND s.judge_id = auth.uid()
    )
  );

-- ================================================
-- END OF MIGRATION
-- ================================================

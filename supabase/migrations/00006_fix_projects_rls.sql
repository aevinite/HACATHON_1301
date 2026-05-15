
-- ================================================
-- FIX: Allow team members to create projects
-- ================================================

DROP POLICY IF EXISTS "Team leaders and admins can manage projects" ON public.projects;

CREATE POLICY "Team members and admins can manage projects"
  ON public.projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      LEFT JOIN public.team_members tm ON tm.team_id = t.id
      WHERE t.id = projects.team_id AND (t.leader_id = auth.uid() OR tm.user_id = auth.uid())
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      LEFT JOIN public.team_members tm ON tm.team_id = t.id
      WHERE t.id = projects.team_id AND (t.leader_id = auth.uid() OR tm.user_id = auth.uid())
    ) OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ================================================
-- HACKJUDGE: STORAGE BUCKET & RLS POLICIES
-- ================================================
-- Note: Buckets must be created manually in Supabase Dashboard first
-- ================================================

-- ================================================
-- BUCKET POLICIES: PUBLIC-AVATARS
-- ================================================
-- Public read, authenticated write for own avatar

-- Enable RLS


-- Policy: Anyone can view avatars
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'public-avatars');

-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'public-avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(storage.objects.name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'public-avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'public-avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can manage all avatars
CREATE POLICY "Admins can manage all avatars"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'public-avatars'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- BUCKET POLICIES: PUBLIC-PROJECT-COVERS
-- ================================================
-- Public read, team leaders can manage

CREATE POLICY "Public can view project covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'public-project-covers');

CREATE POLICY "Team leaders can upload project covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'public-project-covers'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.teams t ON t.id = p.team_id
    WHERE 
      t.leader_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[3]
  )
);

CREATE POLICY "Team leaders can update project covers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'public-project-covers'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.teams t ON t.id = p.team_id
    WHERE 
      t.leader_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[3]
  )
);

CREATE POLICY "Team leaders can delete project covers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'public-project-covers'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.teams t ON t.id = p.team_id
    WHERE 
      t.leader_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[3]
  )
);

CREATE POLICY "Admins can manage all project covers"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'public-project-covers'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- BUCKET POLICIES: PUBLIC-HACKATHON-BANNERS
-- ================================================
-- Public read, hackathon creators can manage

CREATE POLICY "Public can view hackathon banners"
ON storage.objects
FOR SELECT
USING (bucket_id = 'public-hackathon-banners');

CREATE POLICY "Hackathon creators can upload banners"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'public-hackathon-banners'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.hackathons h
    WHERE 
      h.created_by = auth.uid()
      AND h.id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Hackathon creators can update banners"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'public-hackathon-banners'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.hackathons h
    WHERE 
      h.created_by = auth.uid()
      AND h.id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Hackathon creators can delete banners"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'public-hackathon-banners'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.hackathons h
    WHERE 
      h.created_by = auth.uid()
      AND h.id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Admins can manage all hackathon banners"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'public-hackathon-banners'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- BUCKET POLICIES: PRIVATE-PROBLEM-STATEMENTS
-- ================================================
-- Authenticated only, hackathon admins + judges can view

CREATE POLICY "Hackathon admins and judges can view problem statements"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'private-problem-statements'
  AND auth.uid() IS NOT NULL
  AND (
    -- Hackathon creator
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE 
        h.created_by = auth.uid()
        AND h.id::text = (storage.foldername(name))[2]
    )
    -- Judge
    OR EXISTS (
      SELECT 1 FROM public.judges j
      WHERE 
        j.user_id = auth.uid()
        AND j.hackathon_id::text = (storage.foldername(name))[2]
        AND j.status = 'active'
    )
    -- Admin
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

CREATE POLICY "Hackathon creators can upload problem statements"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'private-problem-statements'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.hackathons h
    WHERE 
      h.created_by = auth.uid()
      AND h.id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Hackathon creators can delete problem statements"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'private-problem-statements'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.hackathons h
    WHERE 
      h.created_by = auth.uid()
      AND h.id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Admins can manage all problem statements"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'private-problem-statements'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================================
-- BUCKET POLICIES: PRIVATE-EXPORTS
-- ================================================
-- Hackathon admins and organizers only

CREATE POLICY "Hackathon admins and organizers can view exports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'private-exports'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE 
        h.created_by = auth.uid()
        AND h.id::text = (storage.foldername(name))[2]
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

CREATE POLICY "Hackathon admins and organizers can upload exports"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'private-exports'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE 
        h.created_by = auth.uid()
        AND h.id::text = (storage.foldername(name))[2]
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

CREATE POLICY "Hackathon admins and organizers can delete exports"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'private-exports'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE 
        h.created_by = auth.uid()
        AND h.id::text = (storage.foldername(name))[2]
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- ================================================
-- END OF STORAGE POLICIES
-- ================================================

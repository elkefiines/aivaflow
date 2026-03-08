CREATE POLICY "Project members can view teammate profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm1
    JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.project_members pm ON pm.project_id = p.id
    WHERE (p.owner_id = auth.uid() AND pm.user_id = profiles.user_id)
       OR (pm.user_id = auth.uid() AND p.owner_id = profiles.user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.owner_id = auth.uid() AND p.owner_id = profiles.user_id
  )
);
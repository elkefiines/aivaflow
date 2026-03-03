
-- Create a security definer function to check project membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id AND user_id = _user_id
  )
$$;

-- Create a security definer function to check project ownership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND owner_id = _user_id
  )
$$;

-- Fix projects SELECT policy to use security definer function
DROP POLICY IF EXISTS "Project members can view projects" ON public.projects;
CREATE POLICY "Project members can view projects"
  ON public.projects FOR SELECT
  USING (
    owner_id = auth.uid()
    OR public.is_project_member(id, auth.uid())
  );

-- Fix project_members SELECT policy to use security definer function
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
CREATE POLICY "Members can view project members"
  ON public.project_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_project_owner(project_id, auth.uid())
  );

-- Fix project_members INSERT policy
DROP POLICY IF EXISTS "Owners can manage project members" ON public.project_members;
CREATE POLICY "Owners can manage project members"
  ON public.project_members FOR INSERT
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));

-- Fix project_members DELETE policy
DROP POLICY IF EXISTS "Owners can remove project members" ON public.project_members;
CREATE POLICY "Owners can remove project members"
  ON public.project_members FOR DELETE
  USING (public.is_project_owner(project_id, auth.uid()) OR user_id = auth.uid());

-- Fix tasks policies to use security definer functions
DROP POLICY IF EXISTS "Project members can view tasks" ON public.tasks;
CREATE POLICY "Project members can view tasks"
  ON public.tasks FOR SELECT
  USING (public.is_project_member(project_id, auth.uid()) OR public.is_project_owner(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;
CREATE POLICY "Project members can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (public.is_project_member(project_id, auth.uid()) OR public.is_project_owner(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project members can update tasks" ON public.tasks;
CREATE POLICY "Project members can update tasks"
  ON public.tasks FOR UPDATE
  USING (public.is_project_member(project_id, auth.uid()) OR public.is_project_owner(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project members can delete tasks" ON public.tasks;
CREATE POLICY "Project members can delete tasks"
  ON public.tasks FOR DELETE
  USING (public.is_project_owner(project_id, auth.uid()));

-- Fix ideas policies
DROP POLICY IF EXISTS "Project members can view ideas" ON public.ideas;
CREATE POLICY "Project members can view ideas"
  ON public.ideas FOR SELECT
  USING (public.is_project_member(project_id, auth.uid()) OR public.is_project_owner(project_id, auth.uid()));

-- Fix reports policies
DROP POLICY IF EXISTS "Project members can view reports" ON public.reports;
CREATE POLICY "Project members can view reports"
  ON public.reports FOR SELECT
  USING (public.is_project_member(project_id, auth.uid()) OR public.is_project_owner(project_id, auth.uid()));

-- Fix invitations policies
DROP POLICY IF EXISTS "Inviters can view invitations" ON public.invitations;
CREATE POLICY "Inviters can view invitations"
  ON public.invitations FOR SELECT
  USING (invited_by = auth.uid() OR public.is_project_owner(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project owners can create invitations" ON public.invitations;
CREATE POLICY "Project owners can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project owners can delete invitations" ON public.invitations;
CREATE POLICY "Project owners can delete invitations"
  ON public.invitations FOR DELETE
  USING (public.is_project_owner(project_id, auth.uid()));

DROP POLICY IF EXISTS "System can create reports" ON public.reports;
CREATE POLICY "System can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));

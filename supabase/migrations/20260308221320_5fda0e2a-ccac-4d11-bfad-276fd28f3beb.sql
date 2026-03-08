-- Fix project_members SELECT: members should see ALL members of their projects
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
CREATE POLICY "Members can view project members"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (
    is_project_member(project_id, auth.uid())
    OR is_project_owner(project_id, auth.uid())
  );
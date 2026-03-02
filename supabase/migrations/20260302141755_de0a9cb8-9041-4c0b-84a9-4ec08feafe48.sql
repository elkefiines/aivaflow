
-- Fix: Create the handle_new_user trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix: Drop and recreate the buggy projects SELECT policy
DROP POLICY IF EXISTS "Project members can view projects" ON public.projects;
CREATE POLICY "Project members can view projects"
  ON public.projects
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
    )
  );

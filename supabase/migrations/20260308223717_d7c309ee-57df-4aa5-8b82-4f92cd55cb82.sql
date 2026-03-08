
-- 1. Fix activity_logs INSERT: require user_id = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert activity logs"
ON public.activity_logs FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()))
);

-- 2. Fix project_templates SELECT: only show custom templates to their creators
DROP POLICY IF EXISTS "Anyone can view templates" ON public.project_templates;
CREATE POLICY "Users can view templates"
ON public.project_templates FOR SELECT TO authenticated
USING (
  category != 'custom' OR created_by = auth.uid()
);

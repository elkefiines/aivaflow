
-- 1. Add created_by to project_templates for ownership tracking
ALTER TABLE public.project_templates ADD COLUMN IF NOT EXISTS created_by uuid;

-- 2. Fix project_templates INSERT policy: require ownership
DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.project_templates;
CREATE POLICY "Authenticated users can create templates"
  ON public.project_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 3. Fix project_templates DELETE policy: require ownership + custom category
DROP POLICY IF EXISTS "Users can delete custom templates" ON public.project_templates;
CREATE POLICY "Users can delete custom templates"
  ON public.project_templates FOR DELETE
  TO authenticated
  USING (category = 'custom' AND created_by = auth.uid());

-- 4. Fix mood_logs SELECT: only own data or project owner can see
DROP POLICY IF EXISTS "Project members can view mood logs" ON public.mood_logs;
CREATE POLICY "Users can view own mood logs"
  ON public.mood_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_project_owner(project_id, auth.uid()));

-- 5. Fix message_reactions INSERT: add project membership check
DROP POLICY IF EXISTS "Users can add reactions" ON public.message_reactions;
CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_reactions.message_id
        AND (is_project_member(m.project_id, auth.uid()) OR is_project_owner(m.project_id, auth.uid()))
    )
  );

-- 6. Fix time_entries INSERT: add project membership check via task
DROP POLICY IF EXISTS "Users can create own time entries" ON public.time_entries;
CREATE POLICY "Users can create own time entries"
  ON public.time_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = time_entries.task_id
        AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
    )
  );

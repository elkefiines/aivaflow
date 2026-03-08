
-- Phase 22: Task Templates table
CREATE TABLE public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  description text,
  default_priority text DEFAULT 'medium',
  default_status text DEFAULT 'todo',
  subtask_titles jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view task templates"
  ON public.task_templates FOR SELECT TO authenticated
  USING (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project members can create task templates"
  ON public.task_templates FOR INSERT TO authenticated
  WITH CHECK (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project members can delete task templates"
  ON public.task_templates FOR DELETE TO authenticated
  USING (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));

-- Phase 21: Dashboard preferences column on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dashboard_widgets jsonb DEFAULT '["statusBars","stats","summary","chart","aiInsights","recentTasks","team","activity"]'::jsonb;

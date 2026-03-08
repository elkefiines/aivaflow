
-- Phase 24: Add parent_id for threaded comments
ALTER TABLE public.task_comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.task_comments(id) ON DELETE CASCADE;

-- Phase 25: Add task dependencies  
CREATE TABLE public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_id)
);
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members can view task dependencies" ON public.task_dependencies FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_dependencies.task_id AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))));
CREATE POLICY "Project members can manage task dependencies" ON public.task_dependencies FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_dependencies.task_id AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))));
CREATE POLICY "Project members can delete task dependencies" ON public.task_dependencies FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_dependencies.task_id AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))));

-- Phase 26: Goals/OKRs
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  target_date timestamptz,
  progress integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members can view goals" ON public.goals FOR SELECT TO authenticated
  USING (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));
CREATE POLICY "Project members can create goals" ON public.goals FOR INSERT TO authenticated
  WITH CHECK (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));
CREATE POLICY "Project members can update goals" ON public.goals FOR UPDATE TO authenticated
  USING (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));
CREATE POLICY "Project owners can delete goals" ON public.goals FOR DELETE TO authenticated
  USING (is_project_owner(project_id, auth.uid()));

CREATE TABLE public.goal_tasks (
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (goal_id, task_id)
);
ALTER TABLE public.goal_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members can view goal tasks" ON public.goal_tasks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM goals g WHERE g.id = goal_tasks.goal_id AND (is_project_member(g.project_id, auth.uid()) OR is_project_owner(g.project_id, auth.uid()))));
CREATE POLICY "Project members can manage goal tasks" ON public.goal_tasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM goals g WHERE g.id = goal_tasks.goal_id AND (is_project_member(g.project_id, auth.uid()) OR is_project_owner(g.project_id, auth.uid()))));
CREATE POLICY "Project members can delete goal tasks" ON public.goal_tasks FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM goals g WHERE g.id = goal_tasks.goal_id AND (is_project_member(g.project_id, auth.uid()) OR is_project_owner(g.project_id, auth.uid()))));

-- Add goal_id to tasks for easy linking
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;

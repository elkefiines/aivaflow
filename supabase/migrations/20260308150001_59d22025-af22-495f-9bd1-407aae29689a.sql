
-- Subtasks table
CREATE TABLE public.subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- RLS: same access as parent task
CREATE POLICY "Project members can view subtasks"
  ON public.subtasks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = subtasks.task_id
    AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
  ));

CREATE POLICY "Project members can create subtasks"
  ON public.subtasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = subtasks.task_id
    AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
  ));

CREATE POLICY "Project members can update subtasks"
  ON public.subtasks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = subtasks.task_id
    AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
  ));

CREATE POLICY "Project members can delete subtasks"
  ON public.subtasks FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = subtasks.task_id
    AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
  ));

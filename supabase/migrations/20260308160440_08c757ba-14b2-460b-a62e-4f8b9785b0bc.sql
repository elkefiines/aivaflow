
-- Phase 33: Attachments table
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view attachments"
ON public.attachments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tasks t
  WHERE t.id = attachments.task_id
  AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
));

CREATE POLICY "Project members can upload attachments"
ON public.attachments FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = attachments.task_id
    AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
  )
);

CREATE POLICY "Users can delete own attachments"
ON public.attachments FOR DELETE TO authenticated
USING (uploaded_by = auth.uid());

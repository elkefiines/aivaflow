
-- Task Comments table
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_comments_task ON public.task_comments(task_id, created_at);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS: project members can view comments via task's project
CREATE POLICY "Project members can view task comments"
  ON public.task_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_comments.task_id
    AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
  ));

CREATE POLICY "Project members can create task comments"
  ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_comments.task_id
      AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
    )
  );

CREATE POLICY "Users can delete own comments"
  ON public.task_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Tags table
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#0A26E6',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view tags"
  ON public.tags FOR SELECT TO authenticated
  USING (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project members can manage tags"
  ON public.tags FOR INSERT TO authenticated
  WITH CHECK (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can delete tags"
  ON public.tags FOR DELETE TO authenticated
  USING (is_project_owner(project_id, auth.uid()));

-- Task-Tag junction
CREATE TABLE public.task_tags (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view task tags"
  ON public.task_tags FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_tags.task_id
    AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
  ));

CREATE POLICY "Project members can manage task tags"
  ON public.task_tags FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_tags.task_id
    AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
  ));

CREATE POLICY "Project members can remove task tags"
  ON public.task_tags FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_tags.task_id
    AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
  ));

-- Time entries table
CREATE TABLE public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_entries_task ON public.time_entries(task_id);
CREATE INDEX idx_time_entries_user ON public.time_entries(user_id);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view time entries"
  ON public.time_entries FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = time_entries.task_id
    AND (is_project_member(t.project_id, auth.uid()) OR is_project_owner(t.project_id, auth.uid()))
  ));

CREATE POLICY "Users can create own time entries"
  ON public.time_entries FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own time entries"
  ON public.time_entries FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own time entries"
  ON public.time_entries FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Project templates table
CREATE TABLE public.project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT 'folder',
  color text DEFAULT '#0A26E6',
  default_tasks jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates"
  ON public.project_templates FOR SELECT TO authenticated
  USING (true);

-- Insert default templates
INSERT INTO public.project_templates (name, description, icon, color, category, default_tasks) VALUES
('Software Development', 'Agile software project with sprints', 'code', '#0A26E6', 'tech', '[{"title":"Set up repository","priority":"high","status":"todo"},{"title":"Define architecture","priority":"high","status":"todo"},{"title":"Create wireframes","priority":"medium","status":"backlog"},{"title":"Implement core features","priority":"high","status":"backlog"},{"title":"Write tests","priority":"medium","status":"backlog"},{"title":"Deploy to staging","priority":"medium","status":"backlog"}]'),
('Marketing Campaign', 'Plan and execute marketing campaigns', 'megaphone', '#E6590A', 'marketing', '[{"title":"Define target audience","priority":"high","status":"todo"},{"title":"Create content calendar","priority":"high","status":"todo"},{"title":"Design assets","priority":"medium","status":"backlog"},{"title":"Set up analytics","priority":"medium","status":"backlog"},{"title":"Launch campaign","priority":"high","status":"backlog"}]'),
('Event Planning', 'Organize events from start to finish', 'calendar', '#0AE659', 'events', '[{"title":"Define event goals","priority":"high","status":"todo"},{"title":"Book venue","priority":"critical","status":"todo"},{"title":"Create guest list","priority":"high","status":"todo"},{"title":"Plan catering","priority":"medium","status":"backlog"},{"title":"Send invitations","priority":"high","status":"backlog"},{"title":"Post-event follow-up","priority":"medium","status":"backlog"}]'),
('Product Launch', 'Launch a new product successfully', 'rocket', '#9B0AE6', 'product', '[{"title":"Market research","priority":"high","status":"todo"},{"title":"Define pricing strategy","priority":"high","status":"todo"},{"title":"Create landing page","priority":"high","status":"backlog"},{"title":"Prepare press kit","priority":"medium","status":"backlog"},{"title":"Beta testing","priority":"high","status":"backlog"},{"title":"Launch day checklist","priority":"critical","status":"backlog"}]');

-- Add task_attachments storage bucket policy for task files
INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Project members can upload task attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Project members can view task attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'task-attachments');

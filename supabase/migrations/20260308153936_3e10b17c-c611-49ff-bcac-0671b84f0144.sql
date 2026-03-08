
-- Phase 28: Automations
CREATE TABLE public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'status_change',
  trigger_value text,
  action_type text NOT NULL DEFAULT 'notify_owner',
  action_value text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members can view automations" ON public.automations FOR SELECT TO authenticated
  USING (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));
CREATE POLICY "Project owners can create automations" ON public.automations FOR INSERT TO authenticated
  WITH CHECK (is_project_owner(project_id, auth.uid()));
CREATE POLICY "Project owners can update automations" ON public.automations FOR UPDATE TO authenticated
  USING (is_project_owner(project_id, auth.uid()));
CREATE POLICY "Project owners can delete automations" ON public.automations FOR DELETE TO authenticated
  USING (is_project_owner(project_id, auth.uid()));

-- Phase 29: Team Mood Tracker
CREATE TABLE public.mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mood text NOT NULL DEFAULT 'neutral',
  note text,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id, logged_date)
);
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members can view mood logs" ON public.mood_logs FOR SELECT TO authenticated
  USING (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));
CREATE POLICY "Users can log own mood" ON public.mood_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid())));
CREATE POLICY "Users can update own mood" ON public.mood_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Phase 30: Theme preference column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme text DEFAULT 'default';

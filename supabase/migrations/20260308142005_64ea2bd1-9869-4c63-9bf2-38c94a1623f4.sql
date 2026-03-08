
-- Activity Logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_title text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_activity_logs_project_created ON public.activity_logs(project_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS: project members can view
CREATE POLICY "Project members can view activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));

-- RLS: authenticated users can insert (via triggers/app)
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Auto-log task creation
CREATE OR REPLACE FUNCTION public.log_task_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_logs (project_id, user_id, action, entity_type, entity_id, entity_title)
  VALUES (NEW.project_id, COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid), 'created', 'task', NEW.id, NEW.title);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_task_created AFTER INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_created();

-- Auto-log task status change
CREATE OR REPLACE FUNCTION public.log_task_status_changed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (project_id, user_id, action, entity_type, entity_id, entity_title, metadata)
    VALUES (NEW.project_id, COALESCE(NEW.assignee_id, NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid), 'status_changed', 'task', NEW.id, NEW.title, jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_task_status_changed AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_status_changed();

-- Auto-log task deletion
CREATE OR REPLACE FUNCTION public.log_task_deleted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_logs (project_id, user_id, action, entity_type, entity_id, entity_title)
  VALUES (OLD.project_id, COALESCE(OLD.created_by, '00000000-0000-0000-0000-000000000000'::uuid), 'deleted', 'task', OLD.id, OLD.title);
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_log_task_deleted AFTER DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_deleted();

-- Auto-log new member joined
CREATE OR REPLACE FUNCTION public.log_member_joined()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_logs (project_id, user_id, action, entity_type, entity_id)
  VALUES (NEW.project_id, NEW.user_id, 'joined', 'member', NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_member_joined AFTER INSERT ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.log_member_joined();

-- Auto-log idea created
CREATE OR REPLACE FUNCTION public.log_idea_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_logs (project_id, user_id, action, entity_type, entity_id, entity_title)
  VALUES (NEW.project_id, NEW.user_id, 'created', 'idea', NEW.id, LEFT(NEW.raw_text, 80));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_idea_created AFTER INSERT ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.log_idea_created();

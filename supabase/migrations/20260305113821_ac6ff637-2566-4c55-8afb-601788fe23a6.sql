
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function to create notification on task assignment
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when assignee_id changes to a non-null value and is not the same user who created/updated
  IF NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.assignee_id,
      'task_assigned',
      'Task assigned to you',
      'You have been assigned: ' || NEW.title,
      '/tasks'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_assigned
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assigned();

-- Also fire on insert if assignee is set
CREATE OR REPLACE FUNCTION public.notify_task_assigned_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL AND NEW.assignee_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.assignee_id,
      'task_assigned',
      'Task assigned to you',
      'You have been assigned: ' || NEW.title,
      '/tasks'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_assigned_insert
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assigned_on_insert();

-- Trigger for idea converted to tasks
CREATE OR REPLACE FUNCTION public.notify_idea_converted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'converted' AND (OLD.status IS DISTINCT FROM 'converted') THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'idea_converted',
      'Idea converted to tasks',
      'Your idea has been processed and tasks were created.',
      '/ideas'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_idea_converted
  AFTER UPDATE ON public.ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_idea_converted();


-- Create messages table for internal team messaging
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS: Project members can view messages
CREATE POLICY "Project members can view messages"
ON public.messages FOR SELECT TO authenticated
USING (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()));

-- RLS: Project members can send messages
CREATE POLICY "Project members can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  (sender_id = auth.uid()) AND
  (is_project_member(project_id, auth.uid()) OR is_project_owner(project_id, auth.uid()))
);

-- RLS: Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.messages FOR DELETE TO authenticated
USING (sender_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create trigger to notify on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _member RECORD;
  _sender_name text;
BEGIN
  SELECT display_name INTO _sender_name FROM public.profiles WHERE user_id = NEW.sender_id LIMIT 1;
  
  FOR _member IN
    SELECT user_id FROM public.project_members WHERE project_id = NEW.project_id AND user_id != NEW.sender_id
    UNION
    SELECT owner_id FROM public.projects WHERE id = NEW.project_id AND owner_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (_member.user_id, 'new_message', 'New message', COALESCE(_sender_name, 'Someone') || ': ' || LEFT(NEW.content, 80), '/messages');
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

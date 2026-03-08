
-- Notify admins when a new user registers
CREATE OR REPLACE FUNCTION public.notify_admins_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _admin RECORD;
  _name text;
BEGIN
  _name := COALESCE(NEW.display_name, 'New user');
  FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      _admin.user_id,
      'new_user',
      'New user registered',
      _name || ' just signed up.',
      '/admin'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile_notify_admins
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_user();

-- Notify admins when a new contact submission is created
CREATE OR REPLACE FUNCTION public.notify_admins_new_contact()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _admin RECORD;
BEGIN
  FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      _admin.user_id,
      'new_contact',
      CASE WHEN NEW.type = 'demo' THEN 'New demo request' ELSE 'New contact message' END,
      NEW.name || ': ' || LEFT(NEW.message, 100),
      '/admin'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_contact_notify_admins
  AFTER INSERT ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_contact();


-- Replace the overly permissive insert policy with one that restricts to self-notifications
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can receive notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

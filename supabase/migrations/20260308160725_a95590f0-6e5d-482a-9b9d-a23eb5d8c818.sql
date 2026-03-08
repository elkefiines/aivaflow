
-- Phase 37: Achievements system
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
ON public.user_achievements FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can unlock achievements"
ON public.user_achievements FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

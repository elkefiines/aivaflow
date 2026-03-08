
-- Add recurring fields to tasks
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS next_recurrence_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- recurrence values: 'daily', 'weekly', 'monthly', or null

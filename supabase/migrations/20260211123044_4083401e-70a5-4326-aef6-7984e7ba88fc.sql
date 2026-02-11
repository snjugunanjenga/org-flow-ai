-- Add due_date to project_tasks for calendar display
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS due_date date;

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
-- Enable real-time for notes table
ALTER TABLE public.notes REPLICA IDENTITY FULL;

-- Add notes table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
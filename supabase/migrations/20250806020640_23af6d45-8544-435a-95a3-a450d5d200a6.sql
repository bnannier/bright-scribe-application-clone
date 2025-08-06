-- Add missing local_updated_at column to notes table
ALTER TABLE public.notes 
ADD COLUMN local_updated_at TIMESTAMP WITH TIME ZONE;
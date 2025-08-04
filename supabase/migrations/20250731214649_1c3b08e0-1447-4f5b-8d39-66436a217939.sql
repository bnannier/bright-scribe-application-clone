-- Add missing is_favorite column to notes table
ALTER TABLE public.notes 
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance on favorite notes queries
CREATE INDEX idx_notes_favorite ON public.notes(is_favorite);
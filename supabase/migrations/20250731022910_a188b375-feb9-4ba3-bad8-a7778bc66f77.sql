-- Drop all notes-related database functions and triggers
DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop notes-related tables
DROP TABLE IF EXISTS public.note_tags;
DROP TABLE IF EXISTS public.notes;
DROP TABLE IF EXISTS public.notebooks;
DROP TABLE IF EXISTS public.tags;
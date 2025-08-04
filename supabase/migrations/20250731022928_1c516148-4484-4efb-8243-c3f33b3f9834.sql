-- Drop all notes-related triggers first
DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
DROP TRIGGER IF EXISTS update_notebooks_updated_at ON public.notebooks;

-- Drop notes-related tables
DROP TABLE IF EXISTS public.note_tags;
DROP TABLE IF EXISTS public.notes;
DROP TABLE IF EXISTS public.notebooks;
DROP TABLE IF EXISTS public.tags;

-- Drop the function with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
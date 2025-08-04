-- Remove is_archived columns from existing tables
ALTER TABLE public.notebooks DROP COLUMN IF EXISTS is_archived;
ALTER TABLE public.notes DROP COLUMN IF EXISTS is_archived;

-- Create tables for archived notebooks and notes
CREATE TABLE public.archived_notebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_notebook_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  google_drive_folder_id TEXT,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  original_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  original_updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE public.archived_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_note_id UUID NOT NULL,
  user_id UUID NOT NULL,
  original_notebook_id UUID,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  google_drive_file_id TEXT,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  original_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  original_updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS on archived tables
ALTER TABLE public.archived_notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for archived_notebooks
CREATE POLICY "Users can view their own archived notebooks" 
ON public.archived_notebooks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own archived notebooks" 
ON public.archived_notebooks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own archived notebooks" 
ON public.archived_notebooks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for archived_notes
CREATE POLICY "Users can view their own archived notes" 
ON public.archived_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own archived notes" 
ON public.archived_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own archived notes" 
ON public.archived_notes 
FOR DELETE 
USING (auth.uid() = user_id);
-- Create tables for deleted notebooks and notes with restore functionality
CREATE TABLE public.deleted_notebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_notebook_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  google_drive_folder_id TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  original_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  original_updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE public.deleted_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_note_id UUID NOT NULL,
  user_id UUID NOT NULL,
  original_notebook_id UUID,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  google_drive_file_id TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  original_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  original_updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.deleted_notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deleted_notebooks
CREATE POLICY "Users can view their own deleted notebooks" 
ON public.deleted_notebooks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deleted notebooks" 
ON public.deleted_notebooks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deleted notebooks" 
ON public.deleted_notebooks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for deleted_notes
CREATE POLICY "Users can view their own deleted notes" 
ON public.deleted_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deleted notes" 
ON public.deleted_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deleted notes" 
ON public.deleted_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add is_archived column to existing tables instead of creating separate archived tables
ALTER TABLE public.notebooks ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.notes ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notebooks table for organizing notes
CREATE TABLE public.notebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  google_drive_folder_id TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table for storing note metadata
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notebook_id UUID REFERENCES public.notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB, -- TipTap document structure
  google_drive_file_id TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'error')),
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create note_tags junction table
CREATE TABLE public.note_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(note_id, tag_id)
);

-- Create attachments table
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  google_drive_file_id TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create voice_recordings table
CREATE TABLE public.voice_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  duration INTEGER, -- in seconds
  transcript TEXT,
  google_drive_file_id TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_recordings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notebooks
CREATE POLICY "Users can view their own notebooks" 
ON public.notebooks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notebooks" 
ON public.notebooks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notebooks" 
ON public.notebooks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notebooks" 
ON public.notebooks FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for notes
CREATE POLICY "Users can view their own notes" 
ON public.notes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.notes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.notes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.notes FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for tags
CREATE POLICY "Users can view their own tags" 
ON public.tags FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" 
ON public.tags FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" 
ON public.tags FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" 
ON public.tags FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for note_tags
CREATE POLICY "Users can view their own note tags" 
ON public.note_tags FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can create their own note tags" 
ON public.note_tags FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can delete their own note tags" 
ON public.note_tags FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));

-- Create RLS policies for attachments
CREATE POLICY "Users can view their own attachments" 
ON public.attachments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attachments" 
ON public.attachments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attachments" 
ON public.attachments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments" 
ON public.attachments FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for voice_recordings
CREATE POLICY "Users can view their own voice recordings" 
ON public.voice_recordings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice recordings" 
ON public.voice_recordings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice recordings" 
ON public.voice_recordings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice recordings" 
ON public.voice_recordings FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_notebooks_user_id ON public.notebooks(user_id);
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_notebook_id ON public.notes(notebook_id);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX idx_note_tags_tag_id ON public.note_tags(tag_id);
CREATE INDEX idx_attachments_note_id ON public.attachments(note_id);
CREATE INDEX idx_voice_recordings_note_id ON public.voice_recordings(note_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_notebooks_updated_at
BEFORE UPDATE ON public.notebooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
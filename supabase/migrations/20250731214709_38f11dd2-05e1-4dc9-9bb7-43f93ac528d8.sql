-- Add missing columns to notes table
ALTER TABLE public.notes 
ADD COLUMN google_drive_file_id TEXT,
ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'synced';

-- Create indexes for better performance
CREATE INDEX idx_notes_google_drive_file_id ON public.notes(google_drive_file_id);
CREATE INDEX idx_notes_sync_status ON public.notes(sync_status);
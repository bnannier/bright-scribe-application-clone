-- Add missing columns to notebooks table
ALTER TABLE public.notebooks 
ADD COLUMN color TEXT NOT NULL DEFAULT '#3B82F6',
ADD COLUMN google_drive_folder_id TEXT;

-- Create index for better performance
CREATE INDEX idx_notebooks_google_drive_folder_id ON public.notebooks(google_drive_folder_id);
-- Create helper functions for deleted/archived tables access

-- Functions for deleted notebooks
CREATE OR REPLACE FUNCTION public.get_deleted_notebooks(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  original_notebook_id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  color TEXT,
  google_drive_folder_id TEXT,
  deleted_at TIMESTAMPTZ,
  original_created_at TIMESTAMPTZ,
  original_updated_at TIMESTAMPTZ
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT * FROM public.deleted_notebooks WHERE user_id = user_uuid ORDER BY deleted_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_deleted_notes(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  original_note_id UUID,
  user_id UUID,
  original_notebook_id UUID,
  title TEXT,
  content TEXT,
  is_favorite BOOLEAN,
  sync_status TEXT,
  google_drive_file_id TEXT,
  deleted_at TIMESTAMPTZ,
  original_created_at TIMESTAMPTZ,
  original_updated_at TIMESTAMPTZ
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT * FROM public.deleted_notes WHERE user_id = user_uuid ORDER BY deleted_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.delete_from_deleted_notebooks(deleted_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  DELETE FROM public.deleted_notebooks WHERE id = deleted_id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.delete_from_deleted_notes(deleted_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  DELETE FROM public.deleted_notes WHERE id = deleted_id AND user_id = auth.uid();
$$;

-- Functions for archived notebooks  
CREATE OR REPLACE FUNCTION public.get_archived_notebooks(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  original_notebook_id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  color TEXT,
  google_drive_folder_id TEXT,
  archived_at TIMESTAMPTZ,
  original_created_at TIMESTAMPTZ,
  original_updated_at TIMESTAMPTZ
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT * FROM public.archived_notebooks WHERE user_id = user_uuid ORDER BY archived_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_archived_notes(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  original_note_id UUID,
  user_id UUID,
  original_notebook_id UUID,
  title TEXT,
  content TEXT,
  is_favorite BOOLEAN,
  sync_status TEXT,
  google_drive_file_id TEXT,
  archived_at TIMESTAMPTZ,
  original_created_at TIMESTAMPTZ,
  original_updated_at TIMESTAMPTZ
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT * FROM public.archived_notes WHERE user_id = user_uuid ORDER BY archived_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.delete_from_archived_notebooks(archived_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  DELETE FROM public.archived_notebooks WHERE id = archived_id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.delete_from_archived_notes(archived_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  DELETE FROM public.archived_notes WHERE id = archived_id AND user_id = auth.uid();
$$;
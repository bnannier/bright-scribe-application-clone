-- Create helper functions for moving items to deleted/archived tables

-- Functions to move notebooks to deleted
CREATE OR REPLACE FUNCTION public.move_notebook_to_deleted(
  notebook_id UUID,
  user_uuid UUID,
  notebook_name TEXT,
  notebook_description TEXT,
  notebook_color TEXT,
  folder_id TEXT,
  orig_created TIMESTAMPTZ,
  orig_updated TIMESTAMPTZ
) RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  INSERT INTO public.deleted_notebooks (
    original_notebook_id, user_id, name, description, color, 
    google_drive_folder_id, original_created_at, original_updated_at
  ) VALUES (
    notebook_id, user_uuid, notebook_name, notebook_description, notebook_color,
    folder_id, orig_created, orig_updated
  );
$$;

-- Functions to move notes to deleted
CREATE OR REPLACE FUNCTION public.move_note_to_deleted(
  note_id UUID,
  user_uuid UUID,
  notebook_uuid UUID,
  note_title TEXT,
  note_content TEXT,
  is_fav BOOLEAN,
  sync_stat TEXT,
  file_id TEXT,
  orig_created TIMESTAMPTZ,
  orig_updated TIMESTAMPTZ
) RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  INSERT INTO public.deleted_notes (
    original_note_id, user_id, original_notebook_id, title, content,
    is_favorite, sync_status, google_drive_file_id, original_created_at, original_updated_at
  ) VALUES (
    note_id, user_uuid, notebook_uuid, note_title, note_content,
    is_fav, sync_stat, file_id, orig_created, orig_updated
  );
$$;

-- Functions to move notebooks to archived
CREATE OR REPLACE FUNCTION public.move_notebook_to_archived(
  notebook_id UUID,
  user_uuid UUID,
  notebook_name TEXT,
  notebook_description TEXT,
  notebook_color TEXT,
  folder_id TEXT,
  orig_created TIMESTAMPTZ,
  orig_updated TIMESTAMPTZ
) RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  INSERT INTO public.archived_notebooks (
    original_notebook_id, user_id, name, description, color,
    google_drive_folder_id, original_created_at, original_updated_at
  ) VALUES (
    notebook_id, user_uuid, notebook_name, notebook_description, notebook_color,
    folder_id, orig_created, orig_updated
  );
$$;

-- Functions to move notes to archived
CREATE OR REPLACE FUNCTION public.move_note_to_archived(
  note_id UUID,
  user_uuid UUID,
  notebook_uuid UUID,
  note_title TEXT,
  note_content TEXT,
  is_fav BOOLEAN,
  sync_stat TEXT,
  file_id TEXT,
  orig_created TIMESTAMPTZ,
  orig_updated TIMESTAMPTZ
) RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  INSERT INTO public.archived_notes (
    original_note_id, user_id, original_notebook_id, title, content,
    is_favorite, sync_status, google_drive_file_id, original_created_at, original_updated_at
  ) VALUES (
    note_id, user_uuid, notebook_uuid, note_title, note_content,
    is_fav, sync_stat, file_id, orig_created, orig_updated
  );
$$;
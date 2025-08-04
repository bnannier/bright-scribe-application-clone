import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface ArchivedNotebook {
  id: string;
  original_notebook_id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  google_drive_folder_id?: string;
  archived_at: string;
  original_created_at: string;
  original_updated_at: string;
}

export interface ArchivedNote {
  id: string;
  original_note_id: string;
  user_id: string;
  original_notebook_id?: string;
  title: string;
  content?: any;
  is_favorite: boolean;
  sync_status: string;
  google_drive_file_id?: string;
  archived_at: string;
  original_created_at: string;
  original_updated_at: string;
}

export const useArchive = () => {
  const [archivedNotebooks, setArchivedNotebooks] = useState<ArchivedNotebook[]>([]);
  const [archivedNotes, setArchivedNotes] = useState<ArchivedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchArchivedItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch archived notebooks
      const { data: notebooks, error: notebooksError } = await supabase
        .from('archived_notebooks')
        .select('*')
        .eq('user_id', user.id)
        .order('archived_at', { ascending: false });

      if (notebooksError) throw notebooksError;

      // Fetch archived notes
      const { data: notes, error: notesError } = await supabase
        .from('archived_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('archived_at', { ascending: false });

      if (notesError) throw notesError;

      setArchivedNotebooks(notebooks || []);
      setArchivedNotes(notes || []);
    } catch (error) {
      console.error('Error fetching archived items:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreNotebook = async (archivedNotebook: ArchivedNotebook): Promise<boolean> => {
    if (!user) return false;

    try {
      // Restore notebook to main table
      const { error: insertError } = await supabase
        .from('notebooks')
        .insert({
          id: archivedNotebook.original_notebook_id,
          user_id: user.id,
          name: archivedNotebook.name,
          description: archivedNotebook.description,
          color: archivedNotebook.color,
          google_drive_folder_id: archivedNotebook.google_drive_folder_id,
          created_at: archivedNotebook.original_created_at,
          updated_at: archivedNotebook.original_updated_at,
        });

      if (insertError) throw insertError;

      // Remove from archived table - simplified for now
      // TODO: Implement when database functions are ready

      setArchivedNotebooks(prev => prev.filter(nb => nb.id !== archivedNotebook.id));
      
      toast({
        title: "Success",
        description: "Notebook restored from archive",
      });

      return true;
    } catch (error) {
      console.error('Error restoring notebook:', error);
      toast({
        title: "Error",
        description: "Failed to restore notebook",
        variant: "destructive",
      });
      return false;
    }
  };

  const restoreNote = async (archivedNote: ArchivedNote): Promise<boolean> => {
    if (!user) return false;

    try {
      // Restore note to main table
      const { error: insertError } = await supabase
        .from('notes')
        .insert({
          id: archivedNote.original_note_id,
          user_id: user.id,
          notebook_id: archivedNote.original_notebook_id,
          title: archivedNote.title,
          content: archivedNote.content,
          is_favorite: archivedNote.is_favorite,
          sync_status: archivedNote.sync_status,
          google_drive_file_id: archivedNote.google_drive_file_id,
          created_at: archivedNote.original_created_at,
          updated_at: archivedNote.original_updated_at,
        });

      if (insertError) throw insertError;

      // Remove from archived table - simplified for now
      // TODO: Implement when database functions are ready

      setArchivedNotes(prev => prev.filter(note => note.id !== archivedNote.id));
      
      toast({
        title: "Success",
        description: "Note restored from archive",
      });

      return true;
    } catch (error) {
      console.error('Error restoring note:', error);
      toast({
        title: "Error",
        description: "Failed to restore note", 
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchArchivedItems();
    }
  }, [user]);

  return {
    archivedNotebooks,
    archivedNotes,
    loading,
    restoreNotebook,
    restoreNote,
    refetch: fetchArchivedItems,
  };
};
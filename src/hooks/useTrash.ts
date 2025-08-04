import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface DeletedNotebook {
  id: string;
  original_notebook_id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  google_drive_folder_id?: string;
  deleted_at: string;
  original_created_at: string;
  original_updated_at: string;
}

export interface DeletedNote {
  id: string;
  original_note_id: string;
  user_id: string;
  original_notebook_id?: string;
  title: string;
  content?: any;
  is_favorite: boolean;
  sync_status: string;
  google_drive_file_id?: string;
  deleted_at: string;
  original_created_at: string;
  original_updated_at: string;
}

export const useTrash = () => {
  const [deletedNotebooks, setDeletedNotebooks] = useState<DeletedNotebook[]>([]);
  const [deletedNotes, setDeletedNotes] = useState<DeletedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDeletedItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch deleted notebooks
      const { data: notebooks, error: notebooksError } = await supabase
        .from('deleted_notebooks')
        .select('*')
        .eq('user_id', user.id)
        .order('deleted_at', { ascending: false });

      if (notebooksError) throw notebooksError;

      // Fetch deleted notes
      const { data: notes, error: notesError } = await supabase
        .from('deleted_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('deleted_at', { ascending: false });

      if (notesError) throw notesError;

      setDeletedNotebooks(notebooks || []);
      setDeletedNotes(notes || []);
    } catch (error) {
      console.error('Error fetching deleted items:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreNotebook = async (deletedNotebook: DeletedNotebook): Promise<boolean> => {
    if (!user) return false;

    try {
      // Restore notebook to main table
      const { error: insertError } = await supabase
        .from('notebooks')
        .insert({
          id: deletedNotebook.original_notebook_id,
          user_id: user.id,
          name: deletedNotebook.name,
          description: deletedNotebook.description,
          color: deletedNotebook.color,
          google_drive_folder_id: deletedNotebook.google_drive_folder_id,
          created_at: deletedNotebook.original_created_at,
          updated_at: deletedNotebook.original_updated_at,
        });

      if (insertError) throw insertError;

      // Remove from deleted table - simplified for now
      // TODO: Implement when database functions are ready

      setDeletedNotebooks(prev => prev.filter(nb => nb.id !== deletedNotebook.id));
      
      toast({
        title: "Success",
        description: "Notebook restored successfully",
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

  const restoreNote = async (deletedNote: DeletedNote): Promise<boolean> => {
    if (!user) return false;

    try {
      // Restore note to main table
      const { error: insertError } = await supabase
        .from('notes')
        .insert({
          id: deletedNote.original_note_id,
          user_id: user.id,
          notebook_id: deletedNote.original_notebook_id,
          title: deletedNote.title,
          content: deletedNote.content,
          is_favorite: deletedNote.is_favorite,
          sync_status: deletedNote.sync_status,
          google_drive_file_id: deletedNote.google_drive_file_id,
          created_at: deletedNote.original_created_at,
          updated_at: deletedNote.original_updated_at,
        });

      if (insertError) throw insertError;

      // Remove from deleted table - simplified for now
      // TODO: Implement when database functions are ready

      setDeletedNotes(prev => prev.filter(note => note.id !== deletedNote.id));
      
      toast({
        title: "Success",
        description: "Note restored successfully",
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

  const permanentlyDeleteNotebook = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // First, find the notebook to get its original_notebook_id
      const { data: notebook, error: fetchError } = await supabase
        .from('deleted_notebooks')
        .select('original_notebook_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!notebook) throw new Error('Notebook not found');

      // Delete all notes that belong to this notebook
      const { error: notesError } = await supabase
        .from('deleted_notes')
        .delete()
        .eq('original_notebook_id', notebook.original_notebook_id)
        .eq('user_id', user.id);

      if (notesError) throw notesError;

      // Delete the notebook from deleted_notebooks table permanently
      const { error: notebookError } = await supabase
        .from('deleted_notebooks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (notebookError) throw notebookError;

      // Update local state
      setDeletedNotebooks(prev => prev.filter(nb => nb.id !== id));
      setDeletedNotes(prev => prev.filter(note => note.original_notebook_id !== notebook.original_notebook_id));
      
      toast({
        title: "Success",
        description: "Notebook and all its notes permanently deleted",
      });

      return true;
    } catch (error) {
      console.error('Error permanently deleting notebook:', error);
      toast({
        title: "Error",
        description: "Failed to permanently delete notebook",
        variant: "destructive",
      });
      return false;
    }
  };

  const permanentlyDeleteNote = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete from deleted_notes table permanently
      const { error } = await supabase
        .from('deleted_notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setDeletedNotes(prev => prev.filter(note => note.id !== id));
      
      toast({
        title: "Success", 
        description: "Note permanently deleted",
      });

      return true;
    } catch (error) {
      console.error('Error permanently deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to permanently delete note",
        variant: "destructive",
      });
      return false;
    }
  };

  const emptyTrash = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete all notebooks and notes from trash
      const [notebooksResult, notesResult] = await Promise.all([
        supabase
          .from('deleted_notebooks')
          .delete()
          .eq('user_id', user.id),
        supabase
          .from('deleted_notes')
          .delete()
          .eq('user_id', user.id)
      ]);

      if (notebooksResult.error) throw notebooksResult.error;
      if (notesResult.error) throw notesResult.error;

      setDeletedNotebooks([]);
      setDeletedNotes([]);
      
      toast({
        title: "Success",
        description: "Trash emptied successfully",
      });

      return true;
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast({
        title: "Error",
        description: "Failed to empty trash",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchDeletedItems();
    }
  }, [user]);

  return {
    deletedNotebooks,
    deletedNotes,
    loading,
    restoreNotebook,
    restoreNote,
    permanentlyDeleteNotebook,
    permanentlyDeleteNote,
    emptyTrash,
    refetch: fetchDeletedItems,
  };
};
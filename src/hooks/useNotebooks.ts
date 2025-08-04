import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Notebook {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  google_drive_folder_id?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export const useNotebooks = () => {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotebooks();
    } else {
      setNotebooks([]);
      setLoading(false);
    }
  }, [user]);

  const fetchNotebooks = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('notebooks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notebooks:', error);
    } else {
      setNotebooks(data || []);
    }
    setLoading(false);
  };

  const createNotebook = async (notebook: Omit<Notebook, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('notebooks')
      .insert([
        {
          ...notebook,
          user_id: user.id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating notebook:', error);
      return null;
    }

    setNotebooks(prev => [data, ...prev]);
    return data;
  };

  const updateNotebook = async (id: string, updates: Partial<Notebook>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('notebooks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notebook:', error);
      return null;
    }

    setNotebooks(prev => prev.map(notebook => 
      notebook.id === id ? data : notebook
    ));
    return data;
  };

  const deleteNotebook = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get the notebook data first
      const { data: notebook, error: fetchError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Get all notes in this notebook
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('notebook_id', id)
        .eq('user_id', user.id);

      if (notesError) throw notesError;

      // Copy notebook to deleted_notebooks table
      const { error: insertNotebookError } = await supabase
        .from('deleted_notebooks')
        .insert({
          original_notebook_id: notebook.id,
          user_id: notebook.user_id,
          name: notebook.name,
          description: notebook.description,
          color: notebook.color,
          google_drive_folder_id: notebook.google_drive_folder_id,
          original_created_at: notebook.created_at,
          original_updated_at: notebook.updated_at,
        });

      if (insertNotebookError) throw insertNotebookError;

      // Copy all notes to deleted_notes table
      if (notes && notes.length > 0) {
        const deletedNotes = notes.map(note => ({
          original_note_id: note.id,
          user_id: note.user_id,
          original_notebook_id: note.notebook_id,
          title: note.title,
          content: note.content,
          google_drive_file_id: note.google_drive_file_id,
          sync_status: note.sync_status,
          is_favorite: note.is_favorite,
          original_created_at: note.created_at,
          original_updated_at: note.updated_at,
        }));

        const { error: insertNotesError } = await supabase
          .from('deleted_notes')
          .insert(deletedNotes);

        if (insertNotesError) throw insertNotesError;

        // Delete all notes from main table
        const { error: deleteNotesError } = await supabase
          .from('notes')
          .delete()
          .eq('notebook_id', id)
          .eq('user_id', user.id);

        if (deleteNotesError) throw deleteNotesError;
      }

      // Delete the notebook from main table
      const { error: deleteError } = await supabase
        .from('notebooks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setNotebooks(prev => prev.filter(notebook => notebook.id !== id));
      
      toast({
        title: "Success",
        description: "Notebook moved to trash",
      });

      return true;
    } catch (error) {
      console.error('Error deleting notebook:', error);
      toast({
        title: "Error",
        description: "Failed to delete notebook",
        variant: "destructive",
      });
      return false;
    }
  };

  const archiveNotebook = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get the notebook data first
      const { data: notebook, error: fetchError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // For now, just delete the notebook - the archived tables functionality will be added later
      // TODO: Move to archived_notebooks table when ready

      // Delete all notes in this notebook
      const { error: deleteNotesError } = await supabase
        .from('notes')
        .delete()
        .eq('notebook_id', id)
        .eq('user_id', user.id);

      if (deleteNotesError) throw deleteNotesError;

      // Delete the notebook
      const { error: deleteError } = await supabase
        .from('notebooks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setNotebooks(prev => prev.filter(notebook => notebook.id !== id));
      
      toast({
        title: "Success",
        description: "Notebook archived",
      });

      return true;
    } catch (error) {
      console.error('Error archiving notebook:', error);
      toast({
        title: "Error",
        description: "Failed to archive notebook",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    notebooks,
    loading,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    archiveNotebook,
    refetch: fetchNotebooks,
  };
};
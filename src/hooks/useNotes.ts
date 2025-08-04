import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Note {
  id: string;
  user_id: string;
  notebook_id?: string;
  title: string;
  content?: any; // TipTap document structure
  google_drive_file_id?: string;
  sync_status: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotes = (notebookId?: string) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotes();
    } else {
      setNotes([]);
      setLoading(false);
    }
  }, [user, notebookId]);

  const fetchNotes = async () => {
    if (!user) return;

    setLoading(true);
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id);

    if (notebookId) {
      query = query.eq('notebook_id', notebookId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const createNote = async (note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_status'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          ...note,
          user_id: user.id,
          sync_status: 'pending',
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }

    setNotes(prev => [data, ...prev]);
    return data;
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('notes')
      .update({
        ...updates,
        sync_status: 'pending', // Mark as pending sync
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return null;
    }

    setNotes(prev => prev.map(note => 
      note.id === id ? data : note
    ));
    return data;
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get the note to copy to deleted table
      const { data: note, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Copy note to deleted_notes table
      const { error: insertError } = await supabase
        .from('deleted_notes')
        .insert({
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
        });

      if (insertError) throw insertError;

      // Delete note from main table
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setNotes(prev => prev.filter(note => note.id !== id));
      
      toast({
        title: "Success",
        description: "Note moved to trash",
      });

      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
      return false;
    }
  };

  const archiveNote = async (id: string): Promise<Note | null> => {
    if (!user) return null;

    try {
      // Get the note to copy to archived table
      const { data: note, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Delete note from main table
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setNotes(prev => prev.filter(n => n.id !== id));
      
      toast({
        title: "Success",
        description: "Note archived",
      });

      return note as Note;
    } catch (error) {
      console.error('Error archiving note:', error);
      toast({
        title: "Error",
        description: "Failed to archive note",
        variant: "destructive",
      });
      return null;
    }
  };

  const toggleFavorite = async (id: string): Promise<Note | null> => {
    const note = notes.find(n => n.id === id);
    if (!note) return null;

    return await updateNote(id, { is_favorite: !note.is_favorite });
  };

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    archiveNote,
    refetch: fetchNotes,
  };
};
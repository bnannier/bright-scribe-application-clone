import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initOfflineDB, OfflineStorage } from '@/lib/offline-storage';
import { SyncManager } from '@/lib/sync-manager';
import { useNetworkStatus } from '@/lib/network-status';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface OfflineNote {
  id: string;
  title: string;
  content: string | null;
  notebook_id: string | null;
  user_id: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  sync_status?: 'synced' | 'pending' | 'conflict';
  local_updated_at?: string;
}

export const useOfflineNotes = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [notes, setNotes] = useState<OfflineNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [offlineStorage, setOfflineStorage] = useState<OfflineStorage | null>(null);
  const [syncManager, setSyncManager] = useState<SyncManager | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize offline storage
  useEffect(() => {
    const initStorage = async () => {
      try {
        const db = await initOfflineDB();
        const storage = new OfflineStorage(db);
        const sync = new SyncManager(storage);
        
        setOfflineStorage(storage);
        setSyncManager(sync);
      } catch (error) {
        console.error('Failed to initialize offline storage:', error);
        toast.error('Failed to initialize offline storage');
      }
    };

    initStorage();
  }, []);

  // Load notes from local storage
  const loadNotes = useCallback(async () => {
    if (!offlineStorage || !user) return;

    try {
      const localNotes = await offlineStorage.getAllNotes(user.id);
      setNotes(localNotes);
    } catch (error) {
      console.error('Failed to load notes from local storage:', error);
    } finally {
      setLoading(false);
    }
  }, [offlineStorage, user]);

  // Sync with server
  const performSync = useCallback(async () => {
    if (!syncManager || !user || !isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncManager.performFullSync(user.id);
      
      if (result.success) {
        if (result.conflicts.length > 0) {
          toast.warning(`Sync completed with ${result.conflicts.length} conflicts`);
          console.log('Sync conflicts:', result.conflicts);
        } else {
          toast.success('Notes synced successfully');
        }
        await loadNotes(); // Reload notes after sync
      } else {
        toast.error('Failed to sync notes');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [syncManager, user, isOnline, isSyncing, loadNotes]);

  // Initial load and sync
  useEffect(() => {
    if (offlineStorage && user) {
      loadNotes();
      if (isOnline) {
        performSync();
      }
    }
  }, [offlineStorage, user, isOnline]); // Removed circular dependencies

  // Listen for network restoration
  useEffect(() => {
    const handleNetworkRestored = () => {
      if (syncManager && user && isOnline) {
        performSync();
      }
    };

    window.addEventListener('network-restored', handleNetworkRestored);
    return () => window.removeEventListener('network-restored', handleNetworkRestored);
  }, [syncManager, user, isOnline, performSync]);

  // CRUD operations
  const createNote = useCallback(async (noteData: Omit<OfflineNote, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!offlineStorage || !user) return null;

    const newNote: OfflineNote = {
      id: crypto.randomUUID(),
      ...noteData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        // Try to create online first
        const { data, error } = await supabase
          .from('notes')
          .insert(newNote)
          .select()
          .single();

        if (error) throw error;
        
        // Save to local storage as synced
        await offlineStorage.saveNote({ ...data, sync_status: 'synced' });
        await loadNotes();
        return data;
      } else {
        // Create offline
        const savedNote = await offlineStorage.createNote(newNote);
        await loadNotes();
        toast.info('Note created offline. Will sync when online.');
        return savedNote;
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      // Fallback to offline creation
      const savedNote = await offlineStorage.createNote(newNote);
      await loadNotes();
      toast.info('Note created offline. Will sync when online.');
      return savedNote;
    }
  }, [offlineStorage, user, isOnline, loadNotes]);

  const updateNote = useCallback(async (id: string, updates: Partial<OfflineNote>) => {
    if (!offlineStorage || !user) return null;

    try {
      const existingNote = await offlineStorage.getNote(id);
      if (!existingNote) return null;

      const updatedNote = {
        ...existingNote,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (isOnline) {
        // Try to update online first
        const { data, error } = await supabase
          .from('notes')
          .update({
            ...updates,
            updated_at: updatedNote.updated_at,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Save to local storage as synced
        await offlineStorage.saveNote({ ...data, sync_status: 'synced' });
        await loadNotes();
        return data;
      } else {
        // Update offline
        const savedNote = await offlineStorage.saveNote(updatedNote);
        await loadNotes();
        return savedNote;
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      // Fallback to offline update
      const existingNote = await offlineStorage.getNote(id);
      if (existingNote) {
        const updatedNote = {
          ...existingNote,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        const savedNote = await offlineStorage.saveNote(updatedNote);
        await loadNotes();
        return savedNote;
      }
      return null;
    }
  }, [offlineStorage, user, isOnline, loadNotes]);

  const deleteNote = useCallback(async (id: string) => {
    if (!offlineStorage || !user) return;

    try {
      if (isOnline) {
        // Try to delete online first
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        // Remove from local storage
        await offlineStorage.deleteNote(id);
        await loadNotes();
      } else {
        // Delete offline (will be synced later)
        await offlineStorage.deleteNote(id);
        await loadNotes();
        toast.info('Note deleted offline. Will sync when online.');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      // Fallback to offline deletion
      await offlineStorage.deleteNote(id);
      await loadNotes();
      toast.info('Note deleted offline. Will sync when online.');
    }
  }, [offlineStorage, user, isOnline, loadNotes]);

  const toggleFavorite = useCallback(async (id: string) => {
    const note = await offlineStorage?.getNote(id);
    if (note) {
      return updateNote(id, { is_favorite: !note.is_favorite });
    }
    return null;
  }, [offlineStorage, updateNote]);

  const archiveNote = useCallback(async (id: string) => {
    // For now, we'll handle archiving as a delete operation
    // In a full implementation, you'd move to archived_notes table
    return deleteNote(id);
  }, [deleteNote]);

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    archiveNote,
    performSync,
    isSyncing,
    isOnline,
    refetch: loadNotes,
  };
};
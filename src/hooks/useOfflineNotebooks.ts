import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initOfflineDB, OfflineStorage } from '@/lib/offline-storage';
import { SyncManager } from '@/lib/sync-manager';
import { useNetworkStatus } from '@/lib/network-status';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface OfflineNotebook {
  id: string;
  name: string;
  description: string | null;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  sync_status?: 'synced' | 'pending' | 'conflict';
  local_updated_at?: string;
}

export const useOfflineNotebooks = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [notebooks, setNotebooks] = useState<OfflineNotebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [offlineStorage, setOfflineStorage] = useState<OfflineStorage | null>(null);
  const [syncManager, setSyncManager] = useState<SyncManager | null>(null);

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
      }
    };

    initStorage();
  }, []);

  // Load notebooks from local storage
  const loadNotebooks = useCallback(async () => {
    if (!offlineStorage || !user) return;

    try {
      const localNotebooks = await offlineStorage.getAllNotebooks(user.id);
      setNotebooks(localNotebooks);
    } catch (error) {
      console.error('Failed to load notebooks from local storage:', error);
    } finally {
      setLoading(false);
    }
  }, [offlineStorage, user]);

  // Initial load
  useEffect(() => {
    if (offlineStorage && user) {
      loadNotebooks();
    }
  }, [offlineStorage, user, loadNotebooks]);

  // CRUD operations
  const createNotebook = useCallback(async (notebookData: Omit<OfflineNotebook, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!offlineStorage || !user) return null;

    const newNotebook: OfflineNotebook = {
      id: crypto.randomUUID(),
      ...notebookData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        // Try to create online first
        const { data, error } = await supabase
          .from('notebooks')
          .insert(newNotebook)
          .select()
          .single();

        if (error) throw error;
        
        // Save to local storage as synced
        await offlineStorage.saveNotebook({ ...data, sync_status: 'synced' });
        await loadNotebooks();
        return data;
      } else {
        // Create offline
        const savedNotebook = await offlineStorage.createNotebook(newNotebook);
        await loadNotebooks();
        toast.info('Notebook created offline. Will sync when online.');
        return savedNotebook;
      }
    } catch (error) {
      console.error('Failed to create notebook:', error);
      // Fallback to offline creation
      const savedNotebook = await offlineStorage.createNotebook(newNotebook);
      await loadNotebooks();
      toast.info('Notebook created offline. Will sync when online.');
      return savedNotebook;
    }
  }, [offlineStorage, user, isOnline, loadNotebooks]);

  const updateNotebook = useCallback(async (id: string, updates: Partial<OfflineNotebook>) => {
    if (!offlineStorage || !user) return null;

    try {
      const existingNotebook = await offlineStorage.getNotebook(id);
      if (!existingNotebook) return null;

      const updatedNotebook = {
        ...existingNotebook,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (isOnline) {
        // Try to update online first
        const { data, error } = await supabase
          .from('notebooks')
          .update({
            ...updates,
            updated_at: updatedNotebook.updated_at,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Save to local storage as synced
        await offlineStorage.saveNotebook({ ...data, sync_status: 'synced' });
        await loadNotebooks();
        return data;
      } else {
        // Update offline
        const savedNotebook = await offlineStorage.saveNotebook(updatedNotebook);
        await loadNotebooks();
        return savedNotebook;
      }
    } catch (error) {
      console.error('Failed to update notebook:', error);
      // Fallback to offline update
      const existingNotebook = await offlineStorage.getNotebook(id);
      if (existingNotebook) {
        const updatedNotebook = {
          ...existingNotebook,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        const savedNotebook = await offlineStorage.saveNotebook(updatedNotebook);
        await loadNotebooks();
        return savedNotebook;
      }
      return null;
    }
  }, [offlineStorage, user, isOnline, loadNotebooks]);

  const deleteNotebook = useCallback(async (id: string) => {
    if (!offlineStorage || !user) return;

    try {
      if (isOnline) {
        // Try to delete online first
        const { error } = await supabase
          .from('notebooks')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        // Remove from local storage
        await offlineStorage.deleteNotebook(id);
        await loadNotebooks();
      } else {
        // Delete offline (will be synced later)
        await offlineStorage.deleteNotebook(id);
        await loadNotebooks();
        toast.info('Notebook deleted offline. Will sync when online.');
      }
    } catch (error) {
      console.error('Failed to delete notebook:', error);
      // Fallback to offline deletion
      await offlineStorage.deleteNotebook(id);
      await loadNotebooks();
      toast.info('Notebook deleted offline. Will sync when online.');
    }
  }, [offlineStorage, user, isOnline, loadNotebooks]);

  const archiveNotebook = useCallback(async (id: string) => {
    // For now, we'll handle archiving as a delete operation
    // In a full implementation, you'd move to archived_notebooks table
    return deleteNotebook(id);
  }, [deleteNotebook]);

  return {
    notebooks,
    loading,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    archiveNotebook,
    refetch: loadNotebooks,
  };
};
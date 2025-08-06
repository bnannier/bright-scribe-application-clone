import { supabase } from '@/integrations/supabase/client';
import { OfflineStorage } from './offline-storage';
import { isNetworkAvailable } from './network-status';

export class SyncManager {
  private offlineStorage: OfflineStorage;

  constructor(offlineStorage: OfflineStorage) {
    this.offlineStorage = offlineStorage;
  }

  async syncToServer(): Promise<{ success: boolean; conflicts: any[] }> {
    if (!isNetworkAvailable()) {
      return { success: false, conflicts: [] };
    }

    const conflicts: any[] = [];
    const syncQueue = await this.offlineStorage.getSyncQueue();

    try {
      // Group operations by table and type
      const operations = syncQueue.reduce((acc, item) => {
        const key = `${item.table}-${item.type}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      // Process each operation type
      for (const [key, items] of Object.entries(operations)) {
        const [table, type] = key.split('-');
        
        for (const item of items) {
          try {
            await this.processOperation(table as 'notes' | 'notebooks', type as any, item.data);
            await this.offlineStorage.removeSyncQueueItem(item.id);
            await this.offlineStorage.markAsSynced(table as any, item.data.id);
          } catch (error) {
            console.error(`Sync error for ${key}:`, error);
            // Handle conflicts - for now, just log them
            conflicts.push({ item, error: error.message });
          }
        }
      }

      return { success: true, conflicts };
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, conflicts };
    }
  }

  private async processOperation(table: 'notes' | 'notebooks', type: 'create' | 'update' | 'delete', data: any) {
    const tableName = table === 'notes' ? 'notes' : 'notebooks';

    switch (type) {
      case 'create':
        const { error: createError } = await supabase
          .from(tableName)
          .insert(data);
        if (createError) throw createError;
        break;

      case 'update':
        // Check for conflicts by comparing timestamps
        const { data: serverData, error: fetchError } = await supabase
          .from(tableName)
          .select('updated_at')
          .eq('id', data.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (serverData) {
          const serverTime = new Date(serverData.updated_at);
          const localTime = new Date(data.local_updated_at || data.updated_at);
          
          if (serverTime > localTime) {
            // Server version is newer, skip this update (server wins)
            console.log(`Skipping update for ${data.id}: server version is newer`);
            return;
          }
        }

        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id);
        
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', data.id);
        
        if (deleteError) throw deleteError;
        break;
    }
  }

  async syncFromServer(userId: string): Promise<void> {
    if (!isNetworkAvailable()) return;

    try {
      // Fetch latest data from server
      const [notesResult, notebooksResult] = await Promise.all([
        supabase.from('notes').select('*').eq('user_id', userId),
        supabase.from('notebooks').select('*').eq('user_id', userId),
      ]);

      if (notesResult.error) throw notesResult.error;
      if (notebooksResult.error) throw notebooksResult.error;

      // Update local storage with server data
      await this.offlineStorage.bulkUpdateFromServer('notes', notesResult.data || []);
      await this.offlineStorage.bulkUpdateFromServer('notebooks', notebooksResult.data || []);
    } catch (error) {
      console.error('Failed to sync from server:', error);
    }
  }

  async performFullSync(userId: string): Promise<{ success: boolean; conflicts: any[] }> {
    // First, sync local changes to server
    const uploadResult = await this.syncToServer();
    
    // Then, sync server changes to local
    await this.syncFromServer(userId);
    
    return uploadResult;
  }
}
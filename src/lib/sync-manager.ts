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
      // Process operations one by one to prevent data contamination
      for (const item of syncQueue) {
        try {
          await this.processOperation(item.table as 'notes' | 'notebooks', item.type as any, item.data);
          await this.offlineStorage.removeSyncQueueItem(item.id);
          await this.offlineStorage.markAsSynced(item.table as any, item.data.id);
        } catch (error) {
          console.error(`Sync error for ${item.table}-${item.type}:`, error);
          conflicts.push({ item, error: error.message });
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
        const { data: serverRecord, error: fetchError } = await supabase
          .from(tableName)
          .select('updated_at')
          .eq('id', data.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (serverRecord) {
          const serverTime = new Date(serverRecord.updated_at);
          const localTime = new Date(data.local_updated_at || data.updated_at);
          
          if (serverTime > localTime) {
            // Server version is newer, mark as synced to resolve conflict
            console.info(`Server version is newer for ${data.id}, resolving conflict by accepting server version`);
            await this.offlineStorage.markAsSynced(table, data.id);
            return;
          }
        }

        // Create a clean copy of data without local sync fields for server update
        const updateData = { ...data };
        delete (updateData as any).local_updated_at;
        delete (updateData as any).sync_status;
        
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            ...updateData,
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
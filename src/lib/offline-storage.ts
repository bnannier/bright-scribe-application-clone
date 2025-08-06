import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema
interface NotesDB extends DBSchema {
  notes: {
    key: string;
    value: {
      id: string;
      title: string;
      content: string | null;
      notebook_id: string | null;
      user_id: string;
      is_favorite: boolean;
      created_at: string;
      updated_at: string;
      sync_status: 'synced' | 'pending' | 'conflict';
      local_updated_at?: string;
    };
    indexes: { 'notebook_id': string; 'user_id': string; 'sync_status': string };
  };
  notebooks: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string | null;
      color: string;
      user_id: string;
      created_at: string;
      updated_at: string;
      sync_status: 'synced' | 'pending' | 'conflict';
      local_updated_at?: string;
    };
    indexes: { 'user_id': string; 'sync_status': string };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      table: 'notes' | 'notebooks';
      data: any;
      timestamp: string;
    };
  };
}

let dbInstance: IDBPDatabase<NotesDB> | null = null;

export async function initOfflineDB(): Promise<IDBPDatabase<NotesDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<NotesDB>('BrightScribeDB', 1, {
    upgrade(db) {
      // Notes store
      const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
      notesStore.createIndex('notebook_id', 'notebook_id', { unique: false });
      notesStore.createIndex('user_id', 'user_id', { unique: false });
      notesStore.createIndex('sync_status', 'sync_status', { unique: false });

      // Notebooks store
      const notebooksStore = db.createObjectStore('notebooks', { keyPath: 'id' });
      notebooksStore.createIndex('user_id', 'user_id', { unique: false });
      notebooksStore.createIndex('sync_status', 'sync_status', { unique: false });

      // Sync queue store
      db.createObjectStore('sync_queue', { keyPath: 'id' });
    },
  });

  return dbInstance;
}

export class OfflineStorage {
  private db: IDBPDatabase<NotesDB>;

  constructor(db: IDBPDatabase<NotesDB>) {
    this.db = db;
  }

  // Notes operations
  async getAllNotes(userId: string) {
    return this.db.getAllFromIndex('notes', 'user_id', userId);
  }

  async getNote(id: string) {
    return this.db.get('notes', id);
  }

  async saveNote(note: any) {
    const noteData = {
      ...note,
      local_updated_at: new Date().toISOString(),
      sync_status: 'pending' as const,
    };
    await this.db.put('notes', noteData);
    await this.addToSyncQueue('notes', 'update', noteData);
    return noteData;
  }

  async createNote(note: any) {
    const noteData = {
      ...note,
      local_updated_at: new Date().toISOString(),
      sync_status: 'pending' as const,
    };
    await this.db.put('notes', noteData);
    await this.addToSyncQueue('notes', 'create', noteData);
    return noteData;
  }

  async deleteNote(id: string) {
    const note = await this.db.get('notes', id);
    if (note) {
      await this.db.delete('notes', id);
      await this.addToSyncQueue('notes', 'delete', { id });
    }
  }

  // Notebooks operations
  async getAllNotebooks(userId: string) {
    return this.db.getAllFromIndex('notebooks', 'user_id', userId);
  }

  async getNotebook(id: string) {
    return this.db.get('notebooks', id);
  }

  async saveNotebook(notebook: any) {
    const notebookData = {
      ...notebook,
      local_updated_at: new Date().toISOString(),
      sync_status: 'pending' as const,
    };
    await this.db.put('notebooks', notebookData);
    await this.addToSyncQueue('notebooks', 'update', notebookData);
    return notebookData;
  }

  async createNotebook(notebook: any) {
    const notebookData = {
      ...notebook,
      local_updated_at: new Date().toISOString(),
      sync_status: 'pending' as const,
    };
    await this.db.put('notebooks', notebookData);
    await this.addToSyncQueue('notebooks', 'create', notebookData);
    return notebookData;
  }

  async deleteNotebook(id: string) {
    const notebook = await this.db.get('notebooks', id);
    if (notebook) {
      await this.db.delete('notebooks', id);
      await this.addToSyncQueue('notebooks', 'delete', { id });
    }
  }

  // Sync operations
  async addToSyncQueue(table: 'notes' | 'notebooks', type: 'create' | 'update' | 'delete', data: any) {
    const queueItem = {
      id: `${table}-${type}-${data.id}-${Date.now()}`,
      type,
      table,
      data,
      timestamp: new Date().toISOString(),
    };
    await this.db.put('sync_queue', queueItem);
  }

  async getSyncQueue() {
    return this.db.getAll('sync_queue');
  }

  async clearSyncQueue() {
    const tx = this.db.transaction('sync_queue', 'readwrite');
    await tx.store.clear();
  }

  async removeSyncQueueItem(id: string) {
    await this.db.delete('sync_queue', id);
  }

  async markAsSynced(table: 'notes' | 'notebooks', id: string) {
    const item = await this.db.get(table, id);
    if (item) {
      item.sync_status = 'synced';
      delete item.local_updated_at;
      await this.db.put(table, item);
    }
  }

  async bulkUpdateFromServer(table: 'notes' | 'notebooks', items: any[]) {
    const tx = this.db.transaction(table, 'readwrite');
    for (const item of items) {
      await tx.store.put({ ...item, sync_status: 'synced' });
    }
  }

  async getPendingItems(table: 'notes' | 'notebooks') {
    return this.db.getAllFromIndex(table, 'sync_status', 'pending');
  }
}
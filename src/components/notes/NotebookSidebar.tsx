import React, { useState, useEffect, useRef } from 'react';
import { Notebook } from '@/hooks/useNotebooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Folder, FolderOpen, Star, Archive, Trash2, Tag, Home, Edit, MoreHorizontal, Search } from 'lucide-react';
import { ContextMenuWrapper } from '@/components/ui/context-menu-wrapper';
import { RenameDialog } from './RenameDialog';
import { ConfirmDialog } from './ConfirmDialog';

export type FilterType = 'all' | 'favorites' | 'archived' | 'trash' | 'notebook';

interface NotebookSidebarProps {
  notebooks: Notebook[];
  selectedNotebookId?: string;
  currentFilter: FilterType;
  newlyCreatedNotebookId?: string;
  searchQuery: string;
  onSelectNotebook: (notebookId: string | undefined) => void;
  onCreateNotebook: () => void;
  onFilterChange: (filter: FilterType) => void;
  onRenameNotebook: (id: string, name: string) => Promise<void>;
  onDeleteNotebook: (id: string) => Promise<void>;
  onArchiveNotebook: (id: string) => Promise<void>;
  onSearchChange: (query: string) => void;
  saveCurrentEditRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export const NotebookSidebar: React.FC<NotebookSidebarProps> = ({
  notebooks,
  selectedNotebookId,
  currentFilter,
  newlyCreatedNotebookId,
  searchQuery,
  onSelectNotebook,
  onCreateNotebook,
  onFilterChange,
  onRenameNotebook,
  onDeleteNotebook,
  onArchiveNotebook,
  onSearchChange,
  saveCurrentEditRef,
}) => {
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; notebook: Notebook | null }>({
    open: false,
    notebook: null,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'archive';
    notebook: Notebook | null;
  }>({
    open: false,
    type: 'delete',
    notebook: null,
  });


  // Auto-focus newly created notebook for editing
  useEffect(() => {
    if (newlyCreatedNotebookId && !editingNotebookId) {
      const notebook = notebooks.find(n => n.id === newlyCreatedNotebookId);
      if (notebook) {
        setEditingNotebookId(newlyCreatedNotebookId);
        setEditingName(notebook.name);
        // Focus the input on next tick
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 0);
      }
    }
  }, [newlyCreatedNotebookId, notebooks, editingNotebookId]);

  // Handle inline editing
  const startEditing = (notebook: Notebook) => {
    setEditingNotebookId(notebook.id);
    setEditingName(notebook.name);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const saveEdit = async () => {
    if (editingNotebookId && editingName.trim()) {
      await onRenameNotebook(editingNotebookId, editingName.trim());
    }
    setEditingNotebookId(null);
    setEditingName('');
  };

  // Expose save function to parent via ref
  useEffect(() => {
    if (saveCurrentEditRef) {
      saveCurrentEditRef.current = saveEdit;
    }
  }, [saveCurrentEditRef, saveEdit]);

  const cancelEdit = () => {
    setEditingNotebookId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleRename = (notebook: Notebook) => {
    setRenameDialog({ open: true, notebook });
  };

  const handleDelete = (notebook: Notebook) => {
    setConfirmDialog({ open: true, type: 'delete', notebook });
  };

  const handleArchive = (notebook: Notebook) => {
    setConfirmDialog({ open: true, type: 'archive', notebook });
  };

  const getContextMenuItems = (notebook: Notebook) => [
    {
      label: 'Rename',
      icon: Edit,
      onClick: () => handleRename(notebook),
    },
    {
      label: 'Archive',
      icon: Archive,
      onClick: () => handleArchive(notebook),
      separator: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => handleDelete(notebook),
      variant: 'destructive' as const,
    },
  ];
  return (
    <div className="h-full flex flex-col">
      {/* Search Field */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Quick Filters */}
          <div className="space-y-2">
            <Button
              variant={currentFilter === 'all' ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                onFilterChange('all');
                onSelectNotebook(undefined);
              }}
            >
              <Home className="h-4 w-4 mr-2" />
              All Notes
            </Button>
            <Button
              variant={currentFilter === 'favorites' ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                onFilterChange('favorites');
                onSelectNotebook(undefined);
              }}
            >
              <Star className="h-4 w-4 mr-2" />
              Favorites
            </Button>
            <Button
              variant={currentFilter === 'archived' ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                onFilterChange('archived');
                onSelectNotebook(undefined);
              }}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button
              variant={currentFilter === 'trash' ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                onFilterChange('trash');
                onSelectNotebook(undefined);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Trash
            </Button>
          </div>

          <Separator />

          {/* Notebooks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Notebooks
              </h2>
              <Button size="sm" variant="outline" onClick={onCreateNotebook}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {notebooks.map((notebook) => (
              editingNotebookId === notebook.id ? (
                <div key={notebook.id} className="flex items-center gap-2 px-3 py-2">
                  <Folder className="h-4 w-4 flex-shrink-0" />
                  <Input
                    ref={inputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    className="flex-1 h-8 text-sm"
                  />
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: notebook.color }}
                  />
                </div>
              ) : (
                <ContextMenuWrapper
                  key={notebook.id}
                  items={getContextMenuItems(notebook)}
                >
                  <Button
                    variant={selectedNotebookId === notebook.id && currentFilter === 'notebook' ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      onFilterChange('notebook');
                      onSelectNotebook(notebook.id);
                    }}
                  >
                    {selectedNotebookId === notebook.id && currentFilter === 'notebook' ? (
                      <FolderOpen className="h-4 w-4 mr-2" />
                    ) : (
                      <Folder className="h-4 w-4 mr-2" />
                    )}
                    <span className="truncate">{notebook.name}</span>
                    <div 
                      className="w-3 h-3 rounded-full ml-auto flex-shrink-0"
                      style={{ backgroundColor: notebook.color }}
                    />
                  </Button>
                </ContextMenuWrapper>
              )
            ))}
          </div>

          <Separator />

          {/* Tags Section - Placeholder for future implementation */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Tags
            </h2>
            <div className="text-sm text-muted-foreground px-3 py-2">
              <Tag className="h-4 w-4 inline mr-2" />
              No tags yet
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Dialogs */}
      <RenameDialog
        open={renameDialog.open}
        onOpenChange={(open) => setRenameDialog({ open, notebook: null })}
        title="Rename Notebook"
        currentName={renameDialog.notebook?.name || ''}
        onRename={async (newName) => {
          if (renameDialog.notebook) {
            await onRenameNotebook(renameDialog.notebook.id, newName);
          }
        }}
        type="notebook"
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.type === 'delete' ? 'Delete Notebook' : 'Archive Notebook'}
        description={
          confirmDialog.type === 'delete'
            ? `Are you sure you want to delete "${confirmDialog.notebook?.name}"? This action will move the notebook and all its notes to trash.`
            : `Are you sure you want to archive "${confirmDialog.notebook?.name}"? This action will move the notebook and all its notes to the archive.`
        }
        confirmText={confirmDialog.type === 'delete' ? 'Delete' : 'Archive'}
        confirmVariant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
        onConfirm={async () => {
          if (confirmDialog.notebook) {
            if (confirmDialog.type === 'delete') {
              await onDeleteNotebook(confirmDialog.notebook.id);
            } else {
              await onArchiveNotebook(confirmDialog.notebook.id);
            }
          }
        }}
      />
    </div>
  );
};
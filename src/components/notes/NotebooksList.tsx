import React, { useState } from 'react';
import { DeletedNotebook } from '@/hooks/useTrash';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ContextMenuWrapper } from '@/components/ui/context-menu-wrapper';
import { ConfirmDialog } from './ConfirmDialog';

interface NotebooksListProps {
  notebooks: DeletedNotebook[];
  onSelectNotebook: (notebookId: string) => void;
  onRestoreNotebook?: (id: string) => Promise<void>;
  onPermanentlyDeleteNotebook?: (id: string) => Promise<void>;
}

export const NotebooksList: React.FC<NotebooksListProps> = ({
  notebooks,
  onSelectNotebook,
  onRestoreNotebook,
  onPermanentlyDeleteNotebook,
}) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'restore' | 'delete';
    notebook: DeletedNotebook | null;
  }>({
    open: false,
    type: 'delete',
    notebook: null,
  });

  const handleRestore = (notebook: DeletedNotebook) => {
    setConfirmDialog({ open: true, type: 'restore', notebook });
  };

  const handleDelete = (notebook: DeletedNotebook) => {
    setConfirmDialog({ open: true, type: 'delete', notebook });
  };

  const getContextMenuItems = (notebook: DeletedNotebook) => {
    const items = [];

    if (onRestoreNotebook) {
      items.push({
        label: 'Restore',
        icon: RotateCcw,
        onClick: () => handleRestore(notebook),
      });
    }

    if (onPermanentlyDeleteNotebook) {
      items.push({
        label: 'Delete Permanently',
        icon: Trash2,
        onClick: () => handleDelete(notebook),
        variant: 'destructive' as const,
        separator: items.length > 0,
      });
    }

    return items;
  };

  const formatTimestamp = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return 'Invalid date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        {notebooks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notebooks in trash</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notebooks.map((notebook) => {
              const contextItems = getContextMenuItems(notebook);
              
              const notebookButton = (
                <Button
                  variant="ghost"
                  className="w-full h-auto p-3 justify-start text-left"
                  onClick={() => onSelectNotebook(notebook.original_notebook_id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium truncate flex items-center">
                        <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
                        {notebook.name}
                      </h3>
                      <div 
                        className="w-3 h-3 rounded-full ml-2 flex-shrink-0"
                        style={{ backgroundColor: notebook.color }}
                      />
                    </div>
                    {notebook.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                        {notebook.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Deleted {formatTimestamp(notebook.deleted_at)}
                    </p>
                  </div>
                </Button>
              );

              return contextItems.length > 0 ? (
                <ContextMenuWrapper
                  key={notebook.id}
                  items={contextItems}
                >
                  {notebookButton}
                </ContextMenuWrapper>
              ) : (
                <div key={notebook.id}>
                  {notebookButton}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.type === 'restore' ? 'Restore Notebook' : 'Delete Permanently'}
        description={
          confirmDialog.type === 'restore'
            ? `Are you sure you want to restore "${confirmDialog.notebook?.name}"? This will move the notebook and all its notes back to your main collection.`
            : `Are you sure you want to permanently delete "${confirmDialog.notebook?.name}"? This action cannot be undone.`
        }
        confirmText={confirmDialog.type === 'restore' ? 'Restore' : 'Delete Permanently'}
        confirmVariant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
        onConfirm={async () => {
          if (confirmDialog.notebook) {
            if (confirmDialog.type === 'restore' && onRestoreNotebook) {
              await onRestoreNotebook(confirmDialog.notebook.id);
            } else if (confirmDialog.type === 'delete' && onPermanentlyDeleteNotebook) {
              await onPermanentlyDeleteNotebook(confirmDialog.notebook.id);
            }
          }
        }}
      />
    </ScrollArea>
  );
};
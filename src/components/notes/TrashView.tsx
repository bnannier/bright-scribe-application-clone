import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Trash2, RotateCcw, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ContextMenuWrapper } from '@/components/ui/context-menu-wrapper';
import { ConfirmDialog } from './ConfirmDialog';
import { useTrash, DeletedNotebook, DeletedNote } from '@/hooks/useTrash';

type ViewState = 'notebooks' | 'notes';

interface TrashViewProps {
  onBack?: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ onBack }) => {
  const [viewState, setViewState] = useState<ViewState>('notebooks');
  const [selectedNotebook, setSelectedNotebook] = useState<DeletedNotebook | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'restore' | 'delete';
    item: DeletedNotebook | DeletedNote | null;
  }>({
    open: false,
    type: 'restore',
    item: null,
  });

  const { 
    deletedNotebooks, 
    deletedNotes, 
    loading, 
    restoreNotebook, 
    restoreNote, 
    permanentlyDeleteNotebook,
    permanentlyDeleteNote 
  } = useTrash();

  const filteredNotes = selectedNotebook 
    ? deletedNotes.filter(note => note.original_notebook_id === selectedNotebook.original_notebook_id)
    : [];

  // Get orphaned notes (notes without parent notebooks) and sort all items by deletion time
  const orphanedNotes = deletedNotes.filter(note => !note.original_notebook_id);
  
  const allItems = [
    ...deletedNotebooks.map(nb => ({ ...nb, type: 'notebook' as const })),
    ...orphanedNotes.map(note => ({ ...note, type: 'note' as const }))
  ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

  const handleNotebookClick = (notebook: DeletedNotebook) => {
    setSelectedNotebook(notebook);
    setViewState('notes');
  };

  const handleBackToNotebooks = () => {
    setSelectedNotebook(null);
    setViewState('notebooks');
  };

  const handleRestore = (item: DeletedNotebook | DeletedNote) => {
    setConfirmDialog({ open: true, type: 'restore', item });
  };

  const handlePermanentDelete = (item: DeletedNotebook | DeletedNote) => {
    setConfirmDialog({ open: true, type: 'delete', item });
  };

  const getNotebookContextMenuItems = (notebook: DeletedNotebook) => [
    {
      label: 'Restore',
      icon: RotateCcw,
      onClick: () => handleRestore(notebook),
    },
    {
      label: 'Delete Permanently',
      icon: X,
      onClick: () => handlePermanentDelete(notebook),
      variant: 'destructive' as const,
      separator: true,
    },
  ];

  const getNoteContextMenuItems = (note: DeletedNote) => [
    {
      label: 'Restore',
      icon: RotateCcw,
      onClick: () => handleRestore(note),
    },
    {
      label: 'Delete Permanently',
      icon: X,
      onClick: () => handlePermanentDelete(note),
      variant: 'destructive' as const,
      separator: true,
    },
  ];

  const getPreviewText = (content: any) => {
    if (!content) return 'No content';
    
    const extractText = (node: any): string => {
      if (node.type === 'text') return node.text || '';
      if (node.content) {
        return node.content.map(extractText).join('');
      }
      return '';
    };

    const text = extractText(content);
    return text.slice(0, 100) + (text.length > 100 ? '...' : '');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {viewState === 'notes' && (
          <Button variant="ghost" size="icon" onClick={handleBackToNotebooks}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Trash2 className="h-5 w-5" />
        <h2 className="font-semibold">
          {viewState === 'notebooks' ? 'Deleted Notebooks' : `Notes in "${selectedNotebook?.name}"`}
        </h2>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trash2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Loading deleted items...</p>
            </div>
          ) : viewState === 'notebooks' ? (
            // Notebooks and Orphaned Notes View
            allItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trash2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No deleted items</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allItems.map((item) => (
                  <ContextMenuWrapper
                    key={item.id}
                    items={item.type === 'notebook' ? getNotebookContextMenuItems(item) : getNoteContextMenuItems(item)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full h-auto p-4 justify-start text-left animate-slide-in-right opacity-75 hover:opacity-100"
                      onClick={item.type === 'notebook' ? () => handleNotebookClick(item) : undefined}
                    >
                      <div className="flex-1 min-w-0">
                        {item.type === 'notebook' ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium truncate">{item.name}</h3>
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-medium truncate">{item.title}</h3>
                              {item.is_favorite && (
                                <div className="flex items-center ml-2 flex-shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {getPreviewText(item.content)}
                            </p>
                          </>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Deleted {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}
                        </p>
                      </div>
                    </Button>
                  </ContextMenuWrapper>
                ))}
              </div>
            )
          ) : (
            // Notes View
            filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trash2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No deleted notes in this notebook</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotes.map((note) => (
                  <ContextMenuWrapper
                    key={note.id}
                    items={getNoteContextMenuItems(note)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full h-auto p-4 justify-start text-left animate-slide-in-right opacity-75 hover:opacity-100"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-medium truncate">{note.title}</h3>
                          {note.is_favorite && (
                            <div className="flex items-center ml-2 flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {getPreviewText(note.content)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Deleted {formatDistanceToNow(new Date(note.deleted_at), { addSuffix: true })}
                        </p>
                      </div>
                    </Button>
                  </ContextMenuWrapper>
                ))}
              </div>
            )
          )}
        </div>
      </ScrollArea>

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.type === 'restore' ? 'Restore Item' : 'Permanently Delete Item'}
        description={
          confirmDialog.item
            ? confirmDialog.type === 'restore'
              ? `Are you sure you want to restore "${(confirmDialog.item as any).name || (confirmDialog.item as any).title}"? This will move it back to your active items.`
              : `Are you sure you want to permanently delete "${(confirmDialog.item as any).name || (confirmDialog.item as any).title}"? This action cannot be undone.`
            : ''
        }
        confirmText={confirmDialog.type === 'restore' ? 'Restore' : 'Delete Permanently'}
        confirmVariant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
        onConfirm={async () => {
          if (confirmDialog.item) {
            if (confirmDialog.type === 'restore') {
              if ('original_notebook_id' in confirmDialog.item && 'name' in confirmDialog.item) {
                // It's a notebook
                await restoreNotebook(confirmDialog.item as DeletedNotebook);
              } else {
                // It's a note
                await restoreNote(confirmDialog.item as DeletedNote);
              }
            } else {
              if ('original_notebook_id' in confirmDialog.item && 'name' in confirmDialog.item) {
                // It's a notebook
                await permanentlyDeleteNotebook(confirmDialog.item.id);
              } else {
                // It's a note
                await permanentlyDeleteNote(confirmDialog.item.id);
              }
            }
          }
        }}
      />
    </div>
  );
};
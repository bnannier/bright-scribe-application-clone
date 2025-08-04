import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ContextMenuWrapper } from '@/components/ui/context-menu-wrapper';
import { ConfirmDialog } from './ConfirmDialog';
import { useArchive, ArchivedNotebook, ArchivedNote } from '@/hooks/useArchive';

type ViewState = 'notebooks' | 'notes';

interface ArchiveViewProps {
  onBack?: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onBack }) => {
  const [viewState, setViewState] = useState<ViewState>('notebooks');
  const [selectedNotebook, setSelectedNotebook] = useState<ArchivedNotebook | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'restore';
    item: ArchivedNotebook | ArchivedNote | null;
  }>({
    open: false,
    type: 'restore',
    item: null,
  });

  const { archivedNotebooks, archivedNotes, loading, restoreNotebook, restoreNote } = useArchive();

  const filteredNotes = selectedNotebook 
    ? archivedNotes.filter(note => note.original_notebook_id === selectedNotebook.original_notebook_id)
    : [];

  const handleNotebookClick = (notebook: ArchivedNotebook) => {
    setSelectedNotebook(notebook);
    setViewState('notes');
  };

  const handleBackToNotebooks = () => {
    setSelectedNotebook(null);
    setViewState('notebooks');
  };

  const handleRestore = (item: ArchivedNotebook | ArchivedNote) => {
    setConfirmDialog({ open: true, type: 'restore', item });
  };

  const getNotebookContextMenuItems = (notebook: ArchivedNotebook) => [
    {
      label: 'Restore',
      icon: RotateCcw,
      onClick: () => handleRestore(notebook),
    },
  ];

  const getNoteContextMenuItems = (note: ArchivedNote) => [
    {
      label: 'Restore',
      icon: RotateCcw,
      onClick: () => handleRestore(note),
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
        <Archive className="h-5 w-5" />
        <h2 className="font-semibold">
          {viewState === 'notebooks' ? 'Archived Notebooks' : `Notes in "${selectedNotebook?.name}"`}
        </h2>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Loading archived items...</p>
            </div>
          ) : viewState === 'notebooks' ? (
            // Notebooks View
            archivedNotebooks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No archived notebooks</p>
              </div>
            ) : (
              <div className="space-y-2">
                {archivedNotebooks.map((notebook) => (
                  <ContextMenuWrapper
                    key={notebook.id}
                    items={getNotebookContextMenuItems(notebook)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full h-auto p-4 justify-start text-left animate-slide-in-right"
                      onClick={() => handleNotebookClick(notebook)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium truncate">{notebook.name}</h3>
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: notebook.color }}
                          />
                        </div>
                        {notebook.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notebook.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Archived {formatDistanceToNow(new Date(notebook.archived_at), { addSuffix: true })}
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
                <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No archived notes in this notebook</p>
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
                      className="w-full h-auto p-4 justify-start text-left animate-slide-in-right"
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
                          Archived {formatDistanceToNow(new Date(note.archived_at), { addSuffix: true })}
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

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Restore Item"
        description={
          confirmDialog.item
            ? `Are you sure you want to restore "${(confirmDialog.item as any).name || (confirmDialog.item as any).title}"? This will move it back to your active items.`
            : ''
        }
        confirmText="Restore"
        confirmVariant="default"
        onConfirm={async () => {
          if (confirmDialog.item) {
            if ('original_notebook_id' in confirmDialog.item && 'name' in confirmDialog.item) {
              // It's a notebook
              await restoreNotebook(confirmDialog.item as ArchivedNotebook);
            } else {
              // It's a note
              await restoreNote(confirmDialog.item as ArchivedNote);
            }
          }
        }}
      />
    </div>
  );
};
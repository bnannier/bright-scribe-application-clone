import React, { useState, useEffect, useRef } from 'react';
import { Note } from '@/hooks/useNotes';
import { ArchivedNote } from '@/hooks/useArchive';
import { DeletedNote } from '@/hooks/useTrash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, Archive, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ContextMenuWrapper } from '@/components/ui/context-menu-wrapper';
import { RenameDialog } from './RenameDialog';
import { ConfirmDialog } from './ConfirmDialog';

// Union type for all possible note types
type AnyNote = Note | ArchivedNote | DeletedNote;

interface NotesListProps {
  notes: AnyNote[];
  selectedNoteId?: string;
  newlyCreatedNoteId?: string;
  onSelectNote: (noteId: string) => void;
  onRenameNote?: (id: string, title: string) => Promise<void>;
  onDeleteNote?: (id: string) => Promise<void>;
  onArchiveNote?: (id: string) => Promise<void>;
  onToggleFavorite?: (id: string) => Promise<void>;
  isTrashView?: boolean;
  saveCurrentEditRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  selectedNoteId,
  newlyCreatedNoteId,
  onSelectNote,
  onRenameNote,
  onDeleteNote,
  onArchiveNote,
  onToggleFavorite,
  isTrashView = false,
  saveCurrentEditRef,
}) => {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Helper functions to handle different note types
  const getNoteId = (note: AnyNote): string => {
    if ('original_note_id' in note) {
      return note.original_note_id;
    }
    return note.id;
  };

  // Auto-focus newly created note for editing
  useEffect(() => {
    if (newlyCreatedNoteId && !editingNoteId) {
      const note = notes.find(n => getNoteId(n) === newlyCreatedNoteId);
      if (note) {
        setEditingNoteId(newlyCreatedNoteId);
        setEditingTitle(note.title);
        // Focus the input on next tick
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 0);
      }
    }
  }, [newlyCreatedNoteId, notes, editingNoteId]);

  // Helper function to detect if we're dealing with deleted notes (trash view)
  const isInTrash = isTrashView || (notes.length > 0 && 'deleted_at' in notes[0]);

  const getUpdatedAt = (note: AnyNote): string => {
    if ('original_updated_at' in note) {
      return note.original_updated_at;
    }
    return note.updated_at;
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

  // Handle inline editing
  const startEditing = (note: AnyNote) => {
    const noteId = getNoteId(note);
    setEditingNoteId(noteId);
    setEditingTitle(note.title);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const saveEdit = async () => {
    if (editingNoteId && editingTitle.trim() && onRenameNote) {
      await onRenameNote(editingNoteId, editingTitle.trim());
    }
    setEditingNoteId(null);
    setEditingTitle('');
  };

  // Expose save function to parent via ref
  useEffect(() => {
    if (saveCurrentEditRef) {
      saveCurrentEditRef.current = saveEdit;
    }
  }, [saveCurrentEditRef, saveEdit]);

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingTitle('');
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

  const [renameDialog, setRenameDialog] = useState<{ open: boolean; note: AnyNote | null }>({
    open: false,
    note: null,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'archive';
    note: AnyNote | null;
  }>({
    open: false,
    type: 'delete',
    note: null,
  });

  const handleRename = (note: AnyNote) => {
    setRenameDialog({ open: true, note });
  };

  const handleDelete = (note: AnyNote) => {
    setConfirmDialog({ open: true, type: 'delete', note });
  };

  const handleArchive = (note: AnyNote) => {
    setConfirmDialog({ open: true, type: 'archive', note });
  };

  const getContextMenuItems = (note: AnyNote) => {
    const items = [];
    const noteId = getNoteId(note);

    if (onToggleFavorite) {
      items.push({
        label: note.is_favorite ? 'Remove from Favorites' : 'Add to Favorites',
        icon: Star,
        onClick: () => onToggleFavorite(noteId),
      });
    }

    if (onRenameNote && !isInTrash) {
      items.push({
        label: 'Rename',
        icon: Edit,
        onClick: () => startEditing(note),
        separator: items.length > 0,
      });
    }

    if (onArchiveNote) {
      items.push({
        label: 'Archive',
        icon: Archive,
        onClick: () => handleArchive(note),
      });
    }

    if (onDeleteNote) {
      items.push({
        label: isInTrash ? 'Delete Permanently' : 'Delete',
        icon: Trash2,
        onClick: () => handleDelete(note),
        variant: 'destructive' as const,
        separator: items.length > 0,
      });
    }

    return items;
  };
  const getPreviewText = (content: any) => {
    if (!content) return 'No content';
    
    // Handle string content
    if (typeof content === 'string') {
      return content.slice(0, 100) + (content.length > 100 ? '...' : '');
    }
    
    // Extract text from TipTap content
    const extractText = (node: any): string => {
      if (node.type === 'text') return node.text || '';
      if (node.content) {
        return node.content.map(extractText).join('');
      }
      return '';
    };

    const text = extractText(content);
    return text.trim() || 'No content';
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 min-h-full">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
            <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notes found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notes.map((note) => {
              const contextItems = getContextMenuItems(note);
              const noteId = getNoteId(note);
              
              // Check if this note is being edited
              if (editingNoteId === noteId) {
                return (
                  <div key={noteId} className="p-3 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        ref={inputRef}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleKeyDown}
                        className="flex-1 h-8 text-sm font-medium"
                      />
                      <div className="flex items-center ml-2 flex-shrink-0">
                        {note.is_favorite && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                        <div className={`w-2 h-2 rounded-full ml-1 ${
                          note.sync_status === 'synced' ? 'bg-green-500' :
                          note.sync_status === 'pending' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                      {getPreviewText(note.content)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(getUpdatedAt(note))}
                    </p>
                  </div>
                );
              }
              
              const noteButton = (
                <Button
                  variant={selectedNoteId === noteId ? "secondary" : "ghost"}
                  className="w-full h-auto p-3 justify-start text-left"
                  onClick={() => onSelectNote(noteId)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium truncate">{note.title}</h3>
                      <div className="flex items-center ml-2 flex-shrink-0">
                        {note.is_favorite && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                        <div className={`w-2 h-2 rounded-full ml-1 ${
                          note.sync_status === 'synced' ? 'bg-green-500' :
                          note.sync_status === 'pending' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {getPreviewText(note.content)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(getUpdatedAt(note))}
                    </p>
                  </div>
                </Button>
              );

              return contextItems.length > 0 ? (
                <ContextMenuWrapper
                  key={noteId}
                  items={contextItems}
                >
                  {noteButton}
                </ContextMenuWrapper>
              ) : (
                <div key={noteId}>
                  {noteButton}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <RenameDialog
        open={renameDialog.open}
        onOpenChange={(open) => setRenameDialog({ open, note: null })}
        title="Rename Note"
        currentName={renameDialog.note?.title || ''}
        onRename={async (newTitle) => {
          if (renameDialog.note && onRenameNote) {
            const noteId = getNoteId(renameDialog.note);
            await onRenameNote(noteId, newTitle);
          }
        }}
        type="note"
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.type === 'delete' ? (isInTrash ? 'Delete Permanently' : 'Delete Note') : 'Archive Note'}
        description={
          confirmDialog.type === 'delete'
            ? isInTrash
              ? `Are you sure you want to permanently delete "${confirmDialog.note?.title}"? This action cannot be undone.`
              : `Are you sure you want to delete "${confirmDialog.note?.title}"? This action will move the note to trash.`
            : `Are you sure you want to archive "${confirmDialog.note?.title}"? This action will move the note to the archive.`
        }
        confirmText={confirmDialog.type === 'delete' ? (isInTrash ? 'Delete Permanently' : 'Delete') : 'Archive'}
        confirmVariant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
        onConfirm={async () => {
          if (confirmDialog.note) {
            const noteId = getNoteId(confirmDialog.note);
            if (confirmDialog.type === 'delete' && onDeleteNote) {
              await onDeleteNote(noteId);
            } else if (confirmDialog.type === 'archive' && onArchiveNote) {
              await onArchiveNote(noteId);
            }
          }
        }}
      />
    </ScrollArea>
  );
};
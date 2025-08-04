import React, { useState, useMemo, useRef } from 'react';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useNotes } from '@/hooks/useNotes';
import { useArchive } from '@/hooks/useArchive';
import { useTrash } from '@/hooks/useTrash';
import { NotebookSidebar } from './NotebookSidebar';
import { NotesList } from './NotesList';
import { NotebooksList } from './NotebooksList';
import { TrashView } from './TrashView';
import { NoteEditor } from './NoteEditor';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Menu, Search, ChevronLeft, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export type FilterType = 'all' | 'favorites' | 'archived' | 'trash' | 'notebook';

export const NotesApp = () => {
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | undefined>();
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newlyCreatedNotebookId, setNewlyCreatedNotebookId] = useState<string | undefined>();
  const [newlyCreatedNoteId, setNewlyCreatedNoteId] = useState<string | undefined>();
  const [selectedTrashNotebookId, setSelectedTrashNotebookId] = useState<string | undefined>();
  const [mobileView, setMobileView] = useState<'notebooks' | 'notes'>('notebooks');
  
  // Refs to save current edits
  const saveNotebookEditRef = useRef<(() => Promise<void>) | null>(null);
  const saveNoteEditRef = useRef<(() => Promise<void>) | null>(null);
  
  const { notebooks, createNotebook, updateNotebook, deleteNotebook, archiveNotebook, refetch: refetchNotebooks } = useNotebooks();
  const { notes: allNotes, createNote, updateNote, deleteNote, toggleFavorite, archiveNote, refetch: refetchNotes } = useNotes();
  const { archivedNotes, refetch: refetchArchive } = useArchive();
  const { deletedNotes, deletedNotebooks, emptyTrash, permanentlyDeleteNotebook, permanentlyDeleteNote, refetch: refetchTrash } = useTrash();
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);

  // Filter notes based on current filter and search query
  const filteredNotes = useMemo(() => {
    let notes = [];
    
    switch (currentFilter) {
      case 'favorites':
        notes = allNotes.filter(note => note.is_favorite);
        break;
      case 'archived':
        notes = archivedNotes || [];
        break;
      case 'trash':
        // In trash view, only show notes if a specific trash notebook is selected
        if (selectedTrashNotebookId) {
          notes = (deletedNotes || []).filter(note => 
            note.original_notebook_id === selectedTrashNotebookId
          );
        } else {
          // Return empty array when showing notebooks in trash
          notes = [];
        }
        break;
      case 'notebook':
        notes = selectedNotebookId 
          ? allNotes.filter(note => note.notebook_id === selectedNotebookId)
          : [];
        break;
      case 'all':
      default:
        notes = allNotes;
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      notes = notes.filter(note => {
        const titleMatch = note.title.toLowerCase().includes(query);
        const contentMatch = note.content ? 
          JSON.stringify(note.content).toLowerCase().includes(query) : false;
        return titleMatch || contentMatch;
      });
    }

    return notes;
  }, [allNotes, archivedNotes, deletedNotes, currentFilter, selectedNotebookId, selectedTrashNotebookId, searchQuery]);

  const selectedNote = filteredNotes.find(note => note.id === selectedNoteId);

  const handleCreateNote = async () => {
    // Save any current note edit before creating new note
    if (saveNoteEditRef.current) {
      await saveNoteEditRef.current();
    }
    
    const note = await createNote({
      title: 'Untitled Note',
      notebook_id: selectedNotebookId,
      content: null,
      is_favorite: false,
    });
    
    if (note) {
      setSelectedNoteId(note.id);
      setNewlyCreatedNoteId(note.id);
      // Clear the newly created note ID after a short delay to allow editing to complete
      setTimeout(() => setNewlyCreatedNoteId(undefined), 1000);
    }
  };

  const handleCreateNotebook = async () => {
    // Save any current notebook edit before creating new notebook
    if (saveNotebookEditRef.current) {
      await saveNotebookEditRef.current();
    }
    
    const notebook = await createNotebook({
      name: 'New Notebook',
      color: '#6366f1',
    });
    
    if (notebook) {
      setCurrentFilter('notebook');
      setSelectedNotebookId(notebook.id);
      setNewlyCreatedNotebookId(notebook.id);
      // Clear the newly created notebook ID after a short delay to allow editing to complete
      setTimeout(() => setNewlyCreatedNotebookId(undefined), 1000);
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter);
    setSelectedNoteId(undefined); // Clear selected note when changing filters
    setSelectedTrashNotebookId(undefined); // Clear trash notebook selection when changing filters
    setMobileView('notes'); // Switch to notes view on mobile when filter changes
  };

  const handleSelectNotebook = (notebookId: string | undefined) => {
    setSelectedNotebookId(notebookId);
    if (notebookId) {
      setCurrentFilter('notebook');
      setMobileView('notes'); // Switch to notes view on mobile when notebook is selected
    }
  };

  const handleMobileBackToNotebooks = () => {
    setMobileView('notebooks');
    setSelectedNoteId(undefined);
  };

  const handleRenameNotebook = async (id: string, name: string) => {
    await updateNotebook(id, { name });
    refetchNotebooks();
  };

  const handleDeleteNotebook = async (id: string) => {
    await deleteNotebook(id);
    // Clear selection if the deleted notebook was selected
    if (selectedNotebookId === id) {
      setSelectedNotebookId(undefined);
      setCurrentFilter('all');
    }
    // Refresh views
    refetchNotebooks();
    refetchTrash();
  };

  const handleArchiveNotebook = async (id: string) => {
    await archiveNotebook(id);
    // Clear selection if the archived notebook was selected
    if (selectedNotebookId === id) {
      setSelectedNotebookId(undefined);
      setCurrentFilter('all');
    }
    // Refresh views
    refetchNotebooks();
    refetchArchive();
  };

  const getHeaderTitle = () => {
    switch (currentFilter) {
      case 'favorites':
        return 'Favorites';
      case 'archived':
        return 'Archive';
      case 'trash':
        if (selectedTrashNotebookId) {
          const notebook = deletedNotebooks.find(nb => nb.original_notebook_id === selectedTrashNotebookId);
          return `Notes in "${notebook?.name}"`;
        }
        return 'Trash';
      case 'notebook':
        return selectedNotebookId 
          ? notebooks.find(nb => nb.id === selectedNotebookId)?.name || 'Notebook'
          : 'Notebook';
      case 'all':
      default:
        return 'All Notes';
    }
  };

  // Handle context-aware trash deletion
  const handleEmptyTrash = async () => {
    if (selectedTrashNotebookId) {
      // Delete specific notebook and its notes
      const notebook = deletedNotebooks.find(nb => nb.original_notebook_id === selectedTrashNotebookId);
      if (notebook) {
        await permanentlyDeleteNotebook(notebook.id);
        // Go back to notebook list after deleting
        setSelectedTrashNotebookId(undefined);
        setSelectedNoteId(undefined);
      }
    } else {
      // Delete everything in trash
      await emptyTrash();
      setSelectedNoteId(undefined);
    }
    refetchTrash();
  };

  const getEmptyTrashText = () => {
    if (selectedTrashNotebookId) {
      const notebook = deletedNotebooks.find(nb => nb.original_notebook_id === selectedTrashNotebookId);
      return {
        title: "Delete Notebook Permanently",
        description: `Are you sure you want to permanently delete "${notebook?.name}" and all its notes? This action cannot be undone.`,
        confirmText: "Delete Notebook"
      };
    }
    return {
      title: "Empty Trash",
      description: "Are you sure you want to permanently delete all items in the trash? This action cannot be undone.",
      confirmText: "Empty Trash"
    };
  };

  // Add hierarchical navigation
  const showBackButton = (currentFilter === 'archived') || 
                         (currentFilter === 'trash' && selectedTrashNotebookId);

  const handleBackClick = () => {
    if (currentFilter === 'trash' && selectedTrashNotebookId) {
      // Go back to notebook list in trash
      setSelectedTrashNotebookId(undefined);
      setSelectedNoteId(undefined);
    } else {
      // Go back to all notes
      setCurrentFilter('all');
      setSelectedNoteId(undefined);
    }
  };

  // Main unified layout for all views
  return (
    <div className="h-screen bg-background flex">
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          {mobileView === 'notebooks' ? (
            <NotebookSidebar
              notebooks={notebooks}
              selectedNotebookId={selectedNotebookId}
              currentFilter={currentFilter}
              newlyCreatedNotebookId={newlyCreatedNotebookId}
              onSelectNotebook={handleSelectNotebook}
              onCreateNotebook={handleCreateNotebook}
              onFilterChange={handleFilterChange}
              onRenameNotebook={handleRenameNotebook}
              onDeleteNotebook={handleDeleteNotebook}
              onArchiveNotebook={handleArchiveNotebook}
              saveCurrentEditRef={saveNotebookEditRef}
            />
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleMobileBackToNotebooks}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-semibold">{getHeaderTitle()}</h2>
                <div className="flex-1"></div>
                {currentFilter === 'trash' && (
                  (selectedTrashNotebookId && deletedNotebooks.find(nb => nb.original_notebook_id === selectedTrashNotebookId)) ||
                  (!selectedTrashNotebookId && ((deletedNotes?.length ?? 0) > 0 || (deletedNotebooks?.length ?? 0) > 0))
                ) && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setShowEmptyTrashConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {currentFilter !== 'trash' && currentFilter !== 'archived' && (
                  <Button variant="outline" size="sm" onClick={handleCreateNote}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                {currentFilter === 'trash' ? (
                  <TrashView />
                ) : (
                  <NotesList
                    notes={filteredNotes}
                    selectedNoteId={selectedNoteId}
                    newlyCreatedNoteId={newlyCreatedNoteId}
                    onSelectNote={(noteId) => {
                      setSelectedNoteId(noteId);
                      setIsSidebarOpen(false); // Close sidebar when note is selected
                    }}
                    onRenameNote={async (id, title) => { 
                      await updateNote(id, { title }); 
                      refetchNotes();
                    }}
                    onDeleteNote={async (id) => { 
                      await deleteNote(id); 
                      refetchNotes();
                      refetchTrash();
                    }}
                    onArchiveNote={async (id) => { 
                      await archiveNote(id); 
                      refetchNotes();
                      refetchArchive();
                    }}
                    onToggleFavorite={async (id) => { 
                      await toggleFavorite(id); 
                      refetchNotes();
                    }}
                    isTrashView={false}
                    saveCurrentEditRef={saveNoteEditRef}
                  />
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 border-r bg-muted/10">
        <NotebookSidebar
          notebooks={notebooks}
          selectedNotebookId={selectedNotebookId}
          currentFilter={currentFilter}
          newlyCreatedNotebookId={newlyCreatedNotebookId}
          onSelectNotebook={setSelectedNotebookId}
          onCreateNotebook={handleCreateNotebook}
          onFilterChange={handleFilterChange}
          onRenameNotebook={handleRenameNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          onArchiveNotebook={handleArchiveNotebook}
          saveCurrentEditRef={saveNotebookEditRef}
        />
      </div>

      {/* Notes List - Hidden on mobile */}
      <div className="hidden md:block w-80 border-r bg-background">
        <div className="p-4 border-b flex items-center gap-2">
          {/* Hierarchical navigation back button */}
          {showBackButton && (
            <Button variant="ghost" size="sm" onClick={handleBackClick}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {currentFilter === 'trash' && (
            (selectedTrashNotebookId && deletedNotebooks.find(nb => nb.original_notebook_id === selectedTrashNotebookId)) ||
            (!selectedTrashNotebookId && ((deletedNotes?.length ?? 0) > 0 || (deletedNotebooks?.length ?? 0) > 0))
          ) && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowEmptyTrashConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {currentFilter !== 'trash' && currentFilter !== 'archived' && (
            <Button variant="outline" size="sm" onClick={handleCreateNote}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Show either trash view or notes */}
        {currentFilter === 'trash' ? (
          <TrashView />
        ) : (
          <NotesList
            notes={filteredNotes}
            selectedNoteId={selectedNoteId}
            newlyCreatedNoteId={newlyCreatedNoteId}
            onSelectNote={setSelectedNoteId}
            onRenameNote={async (id, title) => { 
              await updateNote(id, { title }); 
              refetchNotes();
            }}
            onDeleteNote={async (id) => { 
              await deleteNote(id); 
              refetchNotes();
              refetchTrash();
            }}
            onArchiveNote={async (id) => { 
              await archiveNote(id); 
              refetchNotes();
              refetchArchive();
            }}
            onToggleFavorite={async (id) => { 
              await toggleFavorite(id); 
              refetchNotes();
            }}
            isTrashView={false}
            saveCurrentEditRef={saveNoteEditRef}
          />
        )}
      </div>

      {/* Note Editor */}
      <div className="flex-1">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            notebooks={notebooks}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-semibold mb-2">No note selected</h2>
              <p className="text-muted-foreground mb-4">
                Choose a note from the sidebar or create a new one
              </p>
              {currentFilter !== 'trash' && currentFilter !== 'archived' && (
                <Button onClick={handleCreateNote}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Note
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Empty Trash Confirmation Dialog */}
      <ConfirmDialog
        open={showEmptyTrashConfirm}
        onOpenChange={setShowEmptyTrashConfirm}
        title={getEmptyTrashText().title}
        description={getEmptyTrashText().description}
        confirmText={getEmptyTrashText().confirmText}
        confirmVariant="destructive"
        onConfirm={handleEmptyTrash}
      />
    </div>
  );
};
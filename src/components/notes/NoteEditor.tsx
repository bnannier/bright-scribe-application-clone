import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OfflineNote, useOfflineNotes } from '@/hooks/useOfflineNotes';
import { OfflineNotebook } from '@/hooks/useOfflineNotebooks';
import { BasicEditor } from '@/components/editor/BasicEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Archive, 
  MoreHorizontal, 
  Upload, 
  Download,
  CloudOff,
  Cloud,
  CloudUpload
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface NoteEditorProps {
  note: OfflineNote;
  notebooks: OfflineNotebook[];
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, notebooks }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState<string>(note.content || '');
  const [selectedNotebookId, setSelectedNotebookId] = useState(note.notebook_id);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const MAX_TITLE_LENGTH = 200;
  const { updateNote, toggleFavorite, archiveNote } = useOfflineNotes();
  const { toast } = useToast();

  // Track original values to detect changes
  const originalValuesRef = useRef({
    title: note.title,
    content: note.content || '',
    notebook_id: note.notebook_id,
  });

  // Track previous note ID for navigation detection
  const previousNoteIdRef = useRef(note.id);

  // Autosave function
  const performAutoSave = useCallback(async () => {
    if (!hasUnsavedChanges || isSaving) return false;

    // Validate title
    if (!title.trim()) {
      return false;
    }
    
    if (title.length > MAX_TITLE_LENGTH) {
      return false;
    }

    setIsSaving(true);
    try {
      const sanitizedTitle = title.replace(/<[^>]*>/g, '').trim();
      
      await updateNote(note.id, {
        title: sanitizedTitle,
        content,
        notebook_id: selectedNotebookId,
      });

      // Update original values after successful save
      originalValuesRef.current = {
        title: sanitizedTitle,
        content,
        notebook_id: selectedNotebookId,
      };
      
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Autosave failed:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [hasUnsavedChanges, isSaving, title, content, selectedNotebookId, note.id, updateNote]);

  // Update state when note prop changes and reset change tracking
  useEffect(() => {
    const currentNoteId = note.id;
    const prevNoteId = previousNoteIdRef.current;
    
    // Save previous note if there are unsaved changes when switching notes
    if (prevNoteId && prevNoteId !== currentNoteId && hasUnsavedChanges) {
      // Capture current values before state reset
      const prevTitle = title;
      const prevContent = content;
      const prevNotebookId = selectedNotebookId;
      
      // Perform save with the previous note's ID
      updateNote(prevNoteId, {
        title: prevTitle.replace(/<[^>]*>/g, '').trim(),
        content: prevContent,
        notebook_id: prevNotebookId,
      }).catch((error) => {
        console.error('Failed to save previous note:', error);
      });
    }
    
    // Update state for new note
    setTitle(note.title);
    setContent(note.content || '');
    setSelectedNotebookId(note.notebook_id);
    setHasUnsavedChanges(false);
    
    // Update original values reference
    originalValuesRef.current = {
      title: note.title,
      content: note.content || '',
      notebook_id: note.notebook_id,
    };

    // Update previous note ID
    previousNoteIdRef.current = currentNoteId;
  }, [note.id]); // Only depend on note.id to avoid circular dependencies

  // Track changes to detect unsaved modifications
  useEffect(() => {
    const hasChanges = 
      title !== originalValuesRef.current.title ||
      content !== originalValuesRef.current.content ||
      selectedNotebookId !== originalValuesRef.current.notebook_id;
    
    setHasUnsavedChanges(hasChanges);
  }, [title, content, selectedNotebookId]);

  // Manual save function
  const handleSave = async () => {
    // Validate title
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Note title cannot be empty."
      });
      return;
    }
    
    if (title.length > MAX_TITLE_LENGTH) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: `Note title cannot exceed ${MAX_TITLE_LENGTH} characters.`
      });
      return;
    }

    const success = await performAutoSave();
    if (success) {
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      });
    }
  };

  const handleToggleFavorite = async () => {
    await toggleFavorite(note.id);
  };

  const handleArchive = async () => {
    await archiveNote(note.id);
    toast({
      title: "Note archived",
      description: "The note has been moved to archive.",
    });
  };

  const handleExportToGoogleDocs = async () => {
    toast({
      title: "Export to Google Docs",
      description: "This feature will be available soon!",
    });
  };

  // Autosave when component unmounts
  useEffect(() => {
    return () => {
      // Perform autosave when component unmounts
      if (hasUnsavedChanges) {
        performAutoSave();
      }
    };
  }, [hasUnsavedChanges, performAutoSave]);

  // Handle browser navigation/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        performAutoSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, performAutoSave]);

  const getSyncStatusIcon = () => {
    switch (note.sync_status) {
      case 'synced':
        return <Cloud className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <CloudUpload className="h-4 w-4 text-yellow-500" />;
      case 'conflict':
        return <CloudOff className="h-4 w-4 text-red-500" />;
      default:
        return <Cloud className="h-4 w-4 text-green-500" />;
    }
  };

  const getSyncStatusText = () => {
    switch (note.sync_status) {
      case 'synced':
        return 'Synced';
      case 'pending':
        return 'Pending sync...';
      case 'conflict':
        return 'Sync conflict';
      default:
        return 'Synced';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input
              value={title}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= MAX_TITLE_LENGTH) {
                  setTitle(value);
                }
              }}
              className="text-xl font-semibold border-none shadow-none p-0 h-auto"
              placeholder="Untitled Note"
              maxLength={MAX_TITLE_LENGTH}
            />
            {title.length > MAX_TITLE_LENGTH * 0.9 && (
              <span className="text-xs text-muted-foreground">
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
            >
              <Star 
                className={`h-4 w-4 ${
                  note.is_favorite 
                    ? 'text-yellow-500 fill-current' 
                    : 'text-muted-foreground'
                }`} 
              />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              {getSyncStatusIcon()}
              <span className="text-xs">{getSyncStatusText()}</span>
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportToGoogleDocs}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Google Docs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              variant={hasUnsavedChanges ? "default" : "outline"}
            >
              {isSaving ? "Saving..." : hasUnsavedChanges ? "Save" : "Saved"}
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Select value={selectedNotebookId || 'no-notebook'} onValueChange={(value) => setSelectedNotebookId(value === 'no-notebook' ? null : value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select notebook" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-notebook">No Notebook</SelectItem>
                {notebooks.map((notebook) => (
                  <SelectItem key={notebook.id} value={notebook.id}>
                    {notebook.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground flex items-center gap-2">
            Last updated: {new Date(note.updated_at).toLocaleString()}
            {hasUnsavedChanges && <span className="text-orange-500">• Unsaved changes</span>}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4 overflow-hidden">
        <BasicEditor
          content={content}
          onChange={setContent}
          placeholder="Start writing your note..."
          className="h-full"
        />
      </div>
    </div>
  );
};
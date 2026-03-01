import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, FileText, Tag, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNotesStore } from '@/stores/notesStore';
import type { Note, NoteInput } from '@/stores/notesStore';
import { NoteEditor } from '@/components/Notes/NoteEditor';

export function NotesPage() {
  const {
    notes,
    selectedNoteId,
    loading,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
  } = useNotesStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  // Filter notes by search
  const filteredNotes = useMemo(() => {
    if (!searchQuery) {return notes;}
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [notes, searchQuery]);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  const handleNewNote = async () => {
    const note = await createNote({
      title: 'Untitled Note',
      content: '',
      tags: [],
    });
    // selectNote is called inside createNote
  };

  const handleSaveNote = async (id: string, data: Partial<NoteInput>) => {
    await updateNote(id, data);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
  };

  const getPreviewText = (content: string): string => {
    // Strip markdown formatting for preview
    return content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^- /gm, '')
      .trim()
      .slice(0, 120);
  };

  const formatDate = (dateStr: string): string => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notes</h1>
          <p className="text-gray-400 mt-1">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={handleNewNote}
          className="flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition shadow-lg shadow-indigo-500/25"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">New Note</span>
        </button>
      </div>

      {/* Split view */}
      <div className="flex gap-0 glass rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Left panel: note list */}
        <div className="w-80 flex-shrink-0 border-r border-[#2a2a4a] flex flex-col">
          {/* Search bar */}
          <div className="p-3 border-b border-[#2a2a4a]">
            <div className="flex items-center gap-2 bg-[#0a0a1a] border border-[#2a2a4a] rounded-lg px-3 py-2">
              <Search size={16} className="text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="bg-transparent outline-none text-sm w-full text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Note list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-4 text-center">
                <FileText size={32} className="mx-auto text-gray-600 mb-2" />
                <p className="text-gray-500 text-sm">
                  {searchQuery ? 'No notes match your search' : 'No notes yet'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleNewNote}
                    className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Create your first note
                  </button>
                )}
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = note.id === selectedNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note.id)}
                    className={`p-3 border-b border-[#1a1a3a] cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500'
                        : 'hover:bg-[#1a1a3a]/50 border-l-2 border-l-transparent'
                    }`}
                  >
                    <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {note.title || 'Untitled'}
                    </h3>
                    {note.content && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {getPreviewText(note.content)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(note.updated_at)}
                      </span>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1 overflow-hidden">
                          <Tag size={10} className="text-gray-600 flex-shrink-0" />
                          {note.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0 bg-indigo-500/15 text-indigo-400 rounded truncate"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="text-xs text-gray-600">+{note.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel: editor */}
        <div className="flex-1 min-w-0">
          {selectedNote ? (
            <NoteEditor
              note={selectedNote}
              onSave={handleSaveNote}
              onDelete={handleDeleteNote}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText size={48} className="mx-auto text-gray-700 mb-3" />
                <p className="text-gray-500">Select a note to start editing</p>
                <button
                  onClick={handleNewNote}
                  className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 transition"
                >
                  <Plus size={16} />
                  Create a new note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

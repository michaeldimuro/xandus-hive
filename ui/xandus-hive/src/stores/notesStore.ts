/**
 * Notes Store
 * Zustand store for notes backed by Supabase
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Note {
  id: string;
  title: string;
  content: string;
  linked_entity_type?: string | null;
  linked_entity_id?: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title: string;
  content?: string;
  linked_entity_type?: string | null;
  linked_entity_id?: string | null;
  tags?: string[];
}

interface NotesStoreState {
  notes: Note[];
  selectedNoteId: string | null;
  loading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  createNote: (data: NoteInput) => Promise<Note | null>;
  updateNote: (id: string, data: Partial<NoteInput>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (id: string | null) => void;
}

export const useNotesStore = create<NotesStoreState>((set, get) => ({
  notes: [],
  selectedNoteId: null,
  loading: true,
  error: null,

  fetchNotes: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      set({ error: error.message, loading: false });
    } else {
      set({ notes: data || [], loading: false });
    }
  },

  createNote: async (payload: NoteInput) => {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        title: payload.title,
        content: payload.content || '',
        linked_entity_type: payload.linked_entity_type || null,
        linked_entity_id: payload.linked_entity_id || null,
        tags: payload.tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }
    if (data) {
      set((s) => ({ notes: [data, ...s.notes], selectedNoteId: data.id }));
    }
    return data;
  },

  updateNote: async (id: string, payload: Partial<NoteInput>) => {
    const { data, error } = await supabase
      .from('notes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return;
    }
    if (data) {
      set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? data : n)),
      }));
    }
  },

  deleteNote: async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) {
      console.error('Error deleting note:', error);
      return;
    }
    set((s) => ({
      notes: s.notes.filter((n) => n.id !== id),
      selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId,
    }));
  },

  selectNote: (id: string | null) => set({ selectedNoteId: id }),
}));

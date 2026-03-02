/**
 * Calendar Store
 * Zustand store for calendar events backed by Supabase
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  all_day: boolean;
  type: 'manual' | 'task' | 'trigger' | 'appointment';
  linked_entity_type?: string | null;
  linked_entity_id?: string | null;
  color?: string | null;
  recurrence?: Record<string, unknown> | null;
  created_at: string;
}

export interface CalendarEventInput {
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  all_day?: boolean;
  type?: CalendarEvent['type'];
  linked_entity_type?: string | null;
  linked_entity_id?: string | null;
  color?: string | null;
  recurrence?: Record<string, unknown> | null;
}

interface CalendarStoreState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  fetchEvents: (rangeStart?: string, rangeEnd?: string) => Promise<void>;
  createEvent: (data: CalendarEventInput) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, data: Partial<CalendarEventInput>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarStoreState>((set, _get) => ({
  events: [],
  loading: true,
  error: null,

  fetchEvents: async (rangeStart?: string, rangeEnd?: string) => {
    set({ loading: true, error: null });
    let query = supabase
      .from('calendar_events')
      .select('*')
      .order('start_at', { ascending: true });

    if (rangeStart) {
      query = query.gte('start_at', rangeStart);
    }
    if (rangeEnd) {
      query = query.lte('start_at', rangeEnd);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching calendar events:', error);
      set({ error: error.message, loading: false });
    } else {
      set({ events: data || [], loading: false });
    }
  },

  createEvent: async (payload: CalendarEventInput) => {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...payload,
        all_day: payload.all_day ?? false,
        type: payload.type ?? 'manual',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
    if (data) {
      set((s) => ({ events: [...s.events, data].toSorted((a, b) => a.start_at.localeCompare(b.start_at)) }));
    }
    return data;
  },

  updateEvent: async (id: string, payload: Partial<CalendarEventInput>) => {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar event:', error);
      return;
    }
    if (data) {
      set((s) => ({
        events: s.events.map((e) => (e.id === id ? data : e)),
      }));
    }
  },

  deleteEvent: async (id: string) => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting calendar event:', error);
      return;
    }
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },
}));

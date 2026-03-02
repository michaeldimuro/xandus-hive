import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type SubAvailability = 'available' | 'busy' | 'unavailable';

export interface Subcontractor {
  id: string;
  name: string;
  company: string | null;
  trade: string | null;
  phone: string | null;
  email: string | null;
  hourly_rate: number | null;
  rating: number | null;
  availability: SubAvailability | null;
  notes: string | null;
  work_history: Record<string, unknown>[] | null;
  created_at: string;
  updated_at: string;
}

export type SubPayload = Omit<Subcontractor, 'id' | 'created_at' | 'updated_at'>;

interface SubcontractorsStoreState {
  subcontractors: Subcontractor[];
  loading: boolean;
  fetchSubcontractors: () => Promise<void>;
  createSubcontractor: (payload: SubPayload) => Promise<void>;
  updateSubcontractor: (id: string, payload: Partial<SubPayload>) => Promise<void>;
  deleteSubcontractor: (id: string) => Promise<void>;
}

export const useSubcontractorsStore = create<SubcontractorsStoreState>((set) => ({
  subcontractors: [],
  loading: true,
  fetchSubcontractors: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('subcontractors')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {set({ subcontractors: data as Subcontractor[], loading: false });}
    else {set({ loading: false });}
  },
  createSubcontractor: async (payload) => {
    const { data } = await supabase
      .from('subcontractors')
      .insert(payload)
      .select()
      .single();
    if (data) {set((s) => ({ subcontractors: [data as Subcontractor, ...s.subcontractors] }));}
  },
  updateSubcontractor: async (id, payload) => {
    const { data } = await supabase
      .from('subcontractors')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (data)
      {set((s) => ({
        subcontractors: s.subcontractors.map((sub) =>
          sub.id === id ? (data as Subcontractor) : sub
        ),
      }));}
  },
  deleteSubcontractor: async (id) => {
    await supabase.from('subcontractors').delete().eq('id', id);
    set((s) => ({ subcontractors: s.subcontractors.filter((sub) => sub.id !== id) }));
  },
}));

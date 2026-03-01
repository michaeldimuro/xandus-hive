import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  stage: LeadStage;
  source: string | null;
  scope_of_work: string | null;
  estimated_value: number | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadPayload = Omit<Lead, 'id' | 'created_at' | 'updated_at'>;

interface LeadsStoreState {
  leads: Lead[];
  loading: boolean;
  fetchLeads: () => Promise<void>;
  createLead: (payload: LeadPayload) => Promise<void>;
  updateLead: (id: string, payload: Partial<LeadPayload>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
}

export const useLeadsStore = create<LeadsStoreState>((set) => ({
  leads: [],
  loading: true,
  fetchLeads: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {set({ leads: data as Lead[], loading: false });}
    else {set({ loading: false });}
  },
  createLead: async (payload) => {
    const { data } = await supabase
      .from('leads')
      .insert(payload)
      .select()
      .single();
    if (data) {set((s) => ({ leads: [data as Lead, ...s.leads] }));}
  },
  updateLead: async (id, payload) => {
    const { data } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (data) {set((s) => ({ leads: s.leads.map((l) => (l.id === id ? (data as Lead) : l)) }));}
  },
  deleteLead: async (id) => {
    await supabase.from('leads').delete().eq('id', id);
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
  },
}));

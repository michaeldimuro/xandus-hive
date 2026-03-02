import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed';
export type CallOutcome = 'answered' | 'voicemail' | 'no_answer' | 'busy';
export type ContactType = 'lead' | 'subcontractor' | 'other';
export type CampaignType = 'outbound_lead' | 'outbound_sub' | 'inbound';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface VoiceCall {
  id: string;
  direction: CallDirection;
  phone_number: string | null;
  contact_name: string | null;
  contact_type: ContactType | null;
  contact_id: string | null;
  provider: string | null;
  provider_call_id: string | null;
  status: CallStatus;
  duration_seconds: number | null;
  recording_url: string | null;
  transcript: string | null;
  outcome: CallOutcome | null;
  script_used: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface VoiceCampaign {
  id: string;
  name: string;
  type: CampaignType;
  script: string | null;
  status: CampaignStatus;
  call_list: Record<string, unknown>[] | null;
  schedule: Record<string, unknown> | null;
  created_at: string;
}

export type CampaignPayload = Omit<VoiceCampaign, 'id' | 'created_at'>;

interface VoiceStoreState {
  calls: VoiceCall[];
  campaigns: VoiceCampaign[];
  loadingCalls: boolean;
  loadingCampaigns: boolean;
  fetchCalls: () => Promise<void>;
  fetchCampaigns: () => Promise<void>;
  createCampaign: (payload: CampaignPayload) => Promise<void>;
  updateCampaign: (id: string, payload: Partial<CampaignPayload>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
}

export const useVoiceStore = create<VoiceStoreState>((set) => ({
  calls: [],
  campaigns: [],
  loadingCalls: true,
  loadingCampaigns: true,
  fetchCalls: async () => {
    set({ loadingCalls: true });
    const { data } = await supabase
      .from('voice_calls')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {set({ calls: data as VoiceCall[], loadingCalls: false });}
    else {set({ loadingCalls: false });}
  },
  fetchCampaigns: async () => {
    set({ loadingCampaigns: true });
    const { data } = await supabase
      .from('voice_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {set({ campaigns: data as VoiceCampaign[], loadingCampaigns: false });}
    else {set({ loadingCampaigns: false });}
  },
  createCampaign: async (payload) => {
    const { data } = await supabase
      .from('voice_campaigns')
      .insert(payload)
      .select()
      .single();
    if (data) {set((s) => ({ campaigns: [data as VoiceCampaign, ...s.campaigns] }));}
  },
  updateCampaign: async (id, payload) => {
    const { data } = await supabase
      .from('voice_campaigns')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (data)
      {set((s) => ({
        campaigns: s.campaigns.map((c) => (c.id === id ? (data as VoiceCampaign) : c)),
      }));}
  },
  deleteCampaign: async (id) => {
    await supabase.from('voice_campaigns').delete().eq('id', id);
    set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }));
  },
}));

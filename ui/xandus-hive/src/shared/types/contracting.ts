export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
export type SubcontractorAvailability = 'available' | 'busy' | 'unavailable';
export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed';
export type CallOutcome = 'answered' | 'voicemail' | 'no_answer' | 'busy';
export type CampaignType = 'outbound_lead' | 'outbound_sub' | 'inbound';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

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

export interface LeadCreate {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  stage?: LeadStage;
  source?: string;
  scope_of_work?: string;
  estimated_value?: number;
  follow_up_date?: string;
  notes?: string;
}

export interface LeadUpdate extends Partial<LeadCreate> {}

export interface Subcontractor {
  id: string;
  name: string;
  company: string | null;
  trade: string;
  phone: string | null;
  email: string | null;
  hourly_rate: number | null;
  rating: number | null;
  availability: SubcontractorAvailability;
  notes: string | null;
  work_history: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface SubcontractorCreate {
  name: string;
  trade: string;
  company?: string;
  phone?: string;
  email?: string;
  hourly_rate?: number;
  rating?: number;
  availability?: SubcontractorAvailability;
  notes?: string;
}

export interface SubcontractorUpdate extends Partial<SubcontractorCreate> {}

export interface VoiceCall {
  id: string;
  direction: CallDirection;
  phone_number: string;
  contact_name: string | null;
  contact_type: 'lead' | 'subcontractor' | 'other' | null;
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
  tags: string[];
  created_at: string;
}

export interface VoiceCallCreate {
  direction: CallDirection;
  phone_number: string;
  contact_name?: string;
  contact_type?: 'lead' | 'subcontractor' | 'other';
  contact_id?: string;
  provider?: string;
  script_used?: string;
}

export interface VoiceCampaign {
  id: string;
  name: string;
  type: CampaignType;
  script: string;
  status: CampaignStatus;
  call_list: { phone: string; name?: string; contact_id?: string }[];
  schedule: Record<string, unknown> | null;
  created_at: string;
}

export interface VoiceCampaignCreate {
  name: string;
  type: CampaignType;
  script: string;
  call_list?: { phone: string; name?: string; contact_id?: string }[];
  schedule?: Record<string, unknown>;
}

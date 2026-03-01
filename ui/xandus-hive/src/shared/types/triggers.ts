export type TriggerType = 'cron' | 'webhook' | 'telegram' | 'manual';
export type ContextMode = 'isolated' | 'group';

export interface CronConfig { expression: string; timezone?: string; }
export interface WebhookConfig { path: string; secret?: string; method?: string; }
export interface TelegramConfig { group_jid: string; pattern: string; }
export type TriggerConfig = CronConfig | WebhookConfig | TelegramConfig | Record<string, unknown>;

export interface Trigger {
  id: string;
  name: string;
  type: TriggerType;
  agent_id: string | null;
  group_folder: string;
  chat_jid: string;
  prompt_template: string;
  config: TriggerConfig;
  context_mode: ContextMode;
  enabled: boolean;
  next_fire_at: string | null;
  last_fired_at: string | null;
  created_at: string;
}

export interface TriggerCreate {
  name: string;
  type: TriggerType;
  agent_id?: string | null;
  group_folder: string;
  chat_jid: string;
  prompt_template: string;
  config: TriggerConfig;
  context_mode?: ContextMode;
  enabled?: boolean;
}

export interface TriggerUpdate extends Partial<TriggerCreate> {}

export interface TriggerLog {
  id: number;
  trigger_id: string;
  fired_at: string;
  duration_ms: number;
  status: 'success' | 'error';
  result: string | null;
  error: string | null;
}

export type CalendarEventType = 'manual' | 'task' | 'trigger' | 'appointment';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  type: CalendarEventType;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  color: string | null;
  recurrence: Record<string, unknown> | null;
  created_at: string;
}

export interface CalendarEventCreate {
  title: string;
  start_at: string;
  description?: string;
  end_at?: string;
  all_day?: boolean;
  type?: CalendarEventType;
  linked_entity_type?: string;
  linked_entity_id?: string;
  color?: string;
  recurrence?: Record<string, unknown>;
}

export interface CalendarEventUpdate extends Partial<CalendarEventCreate> {}

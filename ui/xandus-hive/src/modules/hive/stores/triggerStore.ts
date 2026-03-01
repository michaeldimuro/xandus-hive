import { create } from 'zustand';
import type { Trigger } from '@xandus/shared';
import * as ws from '@/lib/websocket';

interface TriggerStoreState {
  triggers: Trigger[];
  loading: boolean;
  setTriggers: (triggers: Trigger[]) => void;
  addTrigger: (trigger: Trigger) => void;
  updateTrigger: (trigger: Trigger) => void;
  removeTrigger: (id: string) => void;
  fetchTriggers: () => void;
  createTrigger: (payload: Record<string, unknown>) => void;
  updateTriggerData: (id: string, payload: Record<string, unknown>) => void;
  deleteTrigger: (id: string) => void;
  toggleTrigger: (id: string, enabled: boolean) => void;
  fireTrigger: (id: string) => void;
}

export const useTriggerStore = create<TriggerStoreState>((set) => ({
  triggers: [],
  loading: true,
  setTriggers: (triggers) => set({ triggers, loading: false }),
  addTrigger: (trigger) => set((s) => ({ triggers: [...s.triggers, trigger] })),
  updateTrigger: (trigger) => set((s) => ({ triggers: s.triggers.map((t) => t.id === trigger.id ? trigger : t) })),
  removeTrigger: (id) => set((s) => ({ triggers: s.triggers.filter((t) => t.id !== id) })),
  fetchTriggers: () => ws.send({ type: 'trigger.list' }),
  createTrigger: (payload) => ws.send({ type: 'trigger.create', payload }),
  updateTriggerData: (id, payload) => ws.send({ type: 'trigger.update', id, payload }),
  deleteTrigger: (id) => ws.send({ type: 'trigger.delete', id }),
  toggleTrigger: (id, enabled) => ws.send({ type: 'trigger.toggle', id, enabled }),
  fireTrigger: (id) => ws.send({ type: 'trigger.fire', id }),
}));

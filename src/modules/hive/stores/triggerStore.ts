import { create } from "zustand";
import { cron } from "@/lib/openclaw-ws";
import type { CronJob } from "../types/cron";

interface TriggerStoreState {
  triggers: CronJob[];
  loading: boolean;
  setTriggers: (triggers: CronJob[]) => void;
  addTrigger: (trigger: CronJob) => void;
  updateTrigger: (trigger: CronJob) => void;
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
  updateTrigger: (trigger) =>
    set((s) => ({ triggers: s.triggers.map((t) => (t.id === trigger.id ? trigger : t)) })),
  removeTrigger: (id) => set((s) => ({ triggers: s.triggers.filter((t) => t.id !== id) })),

  fetchTriggers: () => {
    cron
      .list()
      .then((res) => {
        const list = (res as { jobs: CronJob[] }).jobs;
        if (Array.isArray(list)) {
          useTriggerStore.getState().setTriggers(list);
        }
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  createTrigger: (payload) => {
    cron
      .add(payload)
      .then((res) => {
        const trigger = (res as { trigger: CronJob }).trigger;
        if (trigger) {
          useTriggerStore.getState().addTrigger(trigger);
        }
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  updateTriggerData: (id, payload) => {
    cron
      .update(id, payload)
      .then((res) => {
        const trigger = (res as { trigger: CronJob }).trigger;
        if (trigger) {
          useTriggerStore.getState().updateTrigger(trigger);
        }
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  deleteTrigger: (id) => {
    cron
      .remove(id)
      .then(() => {
        useTriggerStore.getState().removeTrigger(id);
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  toggleTrigger: (id, enabled) => {
    cron
      .toggle(id, enabled)
      .then(() => {
        const triggers = useTriggerStore.getState().triggers;
        const existing = triggers.find((t) => t.id === id);
        if (existing) {
          useTriggerStore.getState().updateTrigger({ ...existing, enabled });
        }
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  fireTrigger: (id) => {
    cron.run(id).catch(() => {
      /* handled by caller */
    });
  },
}));

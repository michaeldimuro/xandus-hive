import type { AgentProfile } from "@xandus/shared";
import { create } from "zustand";
import { agents } from "@/lib/openclaw-ws";

interface AgentStoreState {
  agents: AgentProfile[];
  loading: boolean;
  setAgents: (agents: AgentProfile[]) => void;
  addAgent: (agent: AgentProfile) => void;
  updateAgent: (agent: AgentProfile) => void;
  removeAgent: (id: string) => void;
  fetchAgents: () => void;
  createAgent: (payload: Record<string, unknown>) => void;
  updateAgentProfile: (id: string, payload: Record<string, unknown>) => void;
  deleteAgent: (id: string) => void;
}

export const useAgentStore = create<AgentStoreState>((set) => ({
  agents: [],
  loading: true,
  setAgents: (agents) => set({ agents, loading: false }),
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (agent) =>
    set((s) => ({ agents: s.agents.map((a) => (a.id === agent.id ? agent : a)) })),
  removeAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),

  fetchAgents: () => {
    agents
      .list()
      .then((res) => {
        const list = (res as { agents: AgentProfile[] }).agents;
        if (Array.isArray(list)) {
          useAgentStore.getState().setAgents(list);
        }
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  createAgent: (payload) => {
    agents
      .create(payload)
      .then((res) => {
        const agent = (res as { agent: AgentProfile }).agent;
        if (agent) {
          useAgentStore.getState().addAgent(agent);
        }
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  updateAgentProfile: (id, payload) => {
    agents
      .update(id, payload)
      .then((res) => {
        const agent = (res as { agent: AgentProfile }).agent;
        if (agent) {
          useAgentStore.getState().updateAgent(agent);
        }
      })
      .catch(() => {
        /* handled by caller */
      });
  },

  deleteAgent: (id) => {
    agents
      .delete(id)
      .then(() => {
        useAgentStore.getState().removeAgent(id);
      })
      .catch(() => {
        /* handled by caller */
      });
  },
}));

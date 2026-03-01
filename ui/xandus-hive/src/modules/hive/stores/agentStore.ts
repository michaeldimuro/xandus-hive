import { create } from "zustand";
import { agents } from "@/lib/openclaw-ws";
import type { AgentProfile } from "../types/agent";

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
        const data = res as Record<string, unknown>;
        const list = data?.agents;
        if (Array.isArray(list)) {
          // Map gateway agent rows to AgentProfile shape
          const mapped: AgentProfile[] = list.map((a: Record<string, unknown>) => ({
            id: typeof a.id === "string" ? a.id : "",
            name: typeof a.name === "string" ? a.name : typeof a.id === "string" ? a.id : "",
            role: typeof a.role === "string" ? a.role : "agent",
            model_preference: typeof a.model === "string" ? a.model : "",
            system_prompt: null,
            skills: Array.isArray(a.skills) ? a.skills : [],
            mcp_tools: [],
            groups: [],
            max_context_tokens: 0,
            status: "active" as const,
            created_at: "",
            updated_at: "",
          }));
          useAgentStore.getState().setAgents(mapped);
        } else {
          // No agents array returned; mark loading done
          useAgentStore.getState().setAgents([]);
        }
      })
      .catch(() => {
        useAgentStore.getState().setAgents([]);
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

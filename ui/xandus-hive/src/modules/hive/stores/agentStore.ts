import { create } from 'zustand';
import type { AgentProfile } from '@xandus/shared';
import * as ws from '@/lib/websocket';

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
  updateAgent: (agent) => set((s) => ({ agents: s.agents.map(a => a.id === agent.id ? agent : a) })),
  removeAgent: (id) => set((s) => ({ agents: s.agents.filter(a => a.id !== id) })),
  fetchAgents: () => ws.send({ type: 'agent.profile.list' }),
  createAgent: (payload) => ws.send({ type: 'agent.profile.create', payload }),
  updateAgentProfile: (id, payload) => ws.send({ type: 'agent.profile.update', id, payload }),
  deleteAgent: (id) => ws.send({ type: 'agent.profile.delete', id }),
}));

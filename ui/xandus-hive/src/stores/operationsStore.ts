/**
 * Hive Operations Store
 * Zustand store for real-time agent activity via WebSocket
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  OperationsRoomState,
  Agent,
  SubAgent,
  TaskFlow,
  OperationEvent,
} from '../types/operations';

export interface QueueGroup {
  chatJid: string;
  groupFolder: string | null;
  containerName: string | null;
  active: boolean;
}

interface QueueState {
  activeCount: number;
  maxConcurrent: number;
  waitingCount: number;
  groups: QueueGroup[];
}

interface SystemMetrics {
  uptime: number;
  dailyCost: number;
  containersActive: number;
}

export interface ScheduledTaskInfo {
  id: string;
  group_folder: string;
  chat_jid: string;
  prompt: string;
  schedule_type: 'cron' | 'interval' | 'once';
  schedule_value: string;
  context_mode: 'group' | 'isolated';
  next_run: string | null;
  last_run: string | null;
  last_result: string | null;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}

interface OperationsStoreState extends OperationsRoomState {
  // Hive real-time state
  queueState: QueueState | null;
  systemMetrics: SystemMetrics | null;
  scheduledTasks: ScheduledTaskInfo[];

  // Actions
  setQueueState: (state: QueueState) => void;
  setSystemMetrics: (metrics: SystemMetrics) => void;
  setScheduledTasks: (tasks: ScheduledTaskInfo[]) => void;
  upsertScheduledTask: (task: ScheduledTaskInfo) => void;
  removeScheduledTask: (taskId: string) => void;
}

export const useOperationsStore = create<OperationsStoreState>()(
  devtools(
    (set) => ({
      // Initial state
      mainAgent: null,
      subAgents: {},
      taskFlow: {
        backlog: [],
        todo: [],
        inProgress: [],
        review: [],
        done: [],
      },
      liveFeed: [],
      isConnected: false,
      connectionError: null,
      unseenEventCount: 0,
      queueState: null,
      systemMetrics: null,
      scheduledTasks: [],

      addEvent: (event: OperationEvent) =>
        set((state) => ({
          liveFeed: [event, ...state.liveFeed].slice(0, 50),
          lastEventAt: new Date(),
          unseenEventCount: state.unseenEventCount + 1,
        }), false, 'addEvent'),

      updateMainAgent: (updates: Partial<Agent>) =>
        set((state) => ({
          mainAgent: state.mainAgent
            ? { ...state.mainAgent, ...updates, lastActivityAt: updates.lastActivityAt || new Date() }
            : {
                id: updates.id || 'unknown',
                name: updates.name || 'Agent',
                status: updates.status || 'idle',
                currentTask: updates.currentTask || '',
                progress: updates.progress || 0,
                startedAt: updates.startedAt || new Date(),
                lastActivityAt: new Date(),
                ...updates,
              },
        }), false, 'updateMainAgent'),

      addSubAgent: (agent: SubAgent) =>
        set((state) => ({
          subAgents: { ...state.subAgents, [agent.id]: agent },
        }), false, 'addSubAgent'),

      updateSubAgent: (id: string, updates: Partial<SubAgent>) =>
        set((state) => {
          const existing = state.subAgents[id];
          if (!existing) {return state;}
          return {
            subAgents: {
              ...state.subAgents,
              [id]: { ...existing, ...updates, lastActivityAt: updates.lastActivityAt || new Date() },
            },
          };
        }, false, 'updateSubAgent'),

      removeSubAgent: (id: string) =>
        set((state) => {
          const { [id]: _, ...rest } = state.subAgents;
          return { subAgents: rest };
        }, false, 'removeSubAgent'),

      updateTaskFlow: (taskFlow: TaskFlow) =>
        set({ taskFlow }, false, 'updateTaskFlow'),

      setConnected: (status: boolean, error: string | null = null) =>
        set(
          { isConnected: status, connectionError: error },
          false,
          status ? 'connectionEstablished' : `connectionFailed: ${error}`
        ),

      clearEvents: () =>
        set({ liveFeed: [] }, false, 'clearEvents'),

      setQueueState: (state: QueueState) =>
        set({ queueState: state }, false, 'setQueueState'),

      setSystemMetrics: (metrics: SystemMetrics) =>
        set({ systemMetrics: metrics }, false, 'setSystemMetrics'),

      setScheduledTasks: (tasks: ScheduledTaskInfo[]) =>
        set({ scheduledTasks: tasks }, false, 'setScheduledTasks'),

      upsertScheduledTask: (task: ScheduledTaskInfo) =>
        set((state) => {
          const idx = state.scheduledTasks.findIndex((t) => t.id === task.id);
          if (idx >= 0) {
            const updated = [...state.scheduledTasks];
            updated[idx] = task;
            return { scheduledTasks: updated };
          }
          return { scheduledTasks: [task, ...state.scheduledTasks] };
        }, false, 'upsertScheduledTask'),

      removeScheduledTask: (taskId: string) =>
        set((state) => ({
          scheduledTasks: state.scheduledTasks.filter((t) => t.id !== taskId),
        }), false, 'removeScheduledTask'),
    }),
    { name: 'operations-store', enabled: import.meta.env.DEV }
  )
);

// Selector hooks
export const useMainAgent = () => useOperationsStore((s) => s.mainAgent);
export const useLiveFeed = () => useOperationsStore((s) => s.liveFeed);
export const useConnectionStatus = () =>
  useOperationsStore((s) => ({ isConnected: s.isConnected, error: s.connectionError }));

/** Server → Client events */

import type { AgentProfile } from './types/agents.js';
import type { Trigger } from './types/triggers.js';

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

export interface AgentSessionStarted {
  type: 'agent.session.started';
  groupFolder: string;
  containerName: string;
  chatJid: string;
  model?: string;
  source: 'message' | 'task' | 'trigger';
  timestamp: string;
}

export interface AgentSessionTerminated {
  type: 'agent.session.terminated';
  containerName: string;
  outcome: 'success' | 'error' | 'timeout';
  durationMs: number;
  error?: string;
  timestamp: string;
}

export interface AgentContainerOutput {
  type: 'agent.container.output';
  containerName: string;
  line: string;
  timestamp: string;
}

export interface AgentToolInvoked {
  type: 'agent.tool.invoked';
  containerName: string;
  toolName: string;
  toolInput?: string;
  timestamp: string;
}

export interface AgentResponse {
  type: 'agent.response';
  containerName: string;
  text: string;
  model?: string;
  timestamp: string;
}

export interface QueueState {
  type: 'queue.state';
  activeCount: number;
  maxConcurrent: number;
  groups: Array<{
    chatJid: string;
    groupFolder: string | null;
    containerName: string | null;
    active: boolean;
  }>;
  waitingCount: number;
  timestamp: string;
}

export interface TaskScheduled {
  type: 'task.scheduled';
  taskId: string;
  prompt: string;
  schedule: string;
  groupFolder: string;
  timestamp: string;
}

export interface TaskExecuting {
  type: 'task.executing';
  taskId: string;
  timestamp: string;
}

export interface TaskCompleted {
  type: 'task.completed';
  taskId: string;
  result?: string;
  timestamp: string;
}

export interface TaskFailed {
  type: 'task.failed';
  taskId: string;
  error: string;
  timestamp: string;
}

export interface TaskListResponse {
  type: 'task.list';
  tasks: ScheduledTaskInfo[];
  timestamp: string;
}

export interface TaskUpdated {
  type: 'task.updated';
  task: ScheduledTaskInfo;
  timestamp: string;
}

export interface TaskDeleted {
  type: 'task.deleted';
  taskId: string;
  timestamp: string;
}

export interface IpcMessageSent {
  type: 'ipc.message.sent';
  chatJid: string;
  text: string;
  timestamp: string;
}

export interface IpcFileSent {
  type: 'ipc.file.sent';
  chatJid: string;
  filePath: string;
  timestamp: string;
}

export interface SystemMetrics {
  type: 'system.metrics';
  uptime: number;
  dailyCost: number;
  containersActive: number;
  timestamp: string;
}

export interface SystemHeartbeat {
  type: 'system.heartbeat';
  timestamp: string;
}

export interface AgentProfileListEvent {
  type: 'agent.profile.list';
  agents: AgentProfile[];
  timestamp: string;
}

export interface AgentProfileCreatedEvent {
  type: 'agent.profile.created';
  agent: AgentProfile;
  timestamp: string;
}

export interface AgentProfileUpdatedEvent {
  type: 'agent.profile.updated';
  agent: AgentProfile;
  timestamp: string;
}

export interface AgentProfileDeletedEvent {
  type: 'agent.profile.deleted';
  id: string;
  timestamp: string;
}

export interface TriggerListEvent {
  type: 'trigger.list';
  triggers: Trigger[];
  timestamp: string;
}

export interface TriggerCreatedEvent {
  type: 'trigger.created';
  trigger: Trigger;
  timestamp: string;
}

export interface TriggerUpdatedEvent {
  type: 'trigger.updated';
  trigger: Trigger;
  timestamp: string;
}

export interface TriggerDeletedEvent {
  type: 'trigger.deleted';
  id: string;
  timestamp: string;
}

export interface TriggerFiredEvent {
  type: 'trigger.fired';
  triggerId: string;
  status: 'success' | 'error';
  result?: string;
  error?: string;
  timestamp: string;
}

export interface SystemError {
  type: 'system.error';
  message: string;
  timestamp: string;
}

export type ServerEvent =
  | AgentSessionStarted
  | AgentSessionTerminated
  | AgentContainerOutput
  | AgentToolInvoked
  | AgentResponse
  | QueueState
  | TaskScheduled
  | TaskExecuting
  | TaskCompleted
  | TaskFailed
  | TaskListResponse
  | TaskUpdated
  | TaskDeleted
  | IpcMessageSent
  | IpcFileSent
  | SystemMetrics
  | AgentProfileListEvent
  | AgentProfileCreatedEvent
  | AgentProfileUpdatedEvent
  | AgentProfileDeletedEvent
  | TriggerListEvent
  | TriggerCreatedEvent
  | TriggerUpdatedEvent
  | TriggerDeletedEvent
  | TriggerFiredEvent
  | SystemHeartbeat
  | SystemError;

export type ServerEventMap = {
  'agent.session.started': AgentSessionStarted;
  'agent.session.terminated': AgentSessionTerminated;
  'agent.container.output': AgentContainerOutput;
  'agent.tool.invoked': AgentToolInvoked;
  'agent.response': AgentResponse;
  'queue.state': QueueState;
  'task.scheduled': TaskScheduled;
  'task.executing': TaskExecuting;
  'task.completed': TaskCompleted;
  'task.failed': TaskFailed;
  'task.list': TaskListResponse;
  'task.updated': TaskUpdated;
  'task.deleted': TaskDeleted;
  'ipc.message.sent': IpcMessageSent;
  'ipc.file.sent': IpcFileSent;
  'system.metrics': SystemMetrics;
  'agent.profile.list': AgentProfileListEvent;
  'agent.profile.created': AgentProfileCreatedEvent;
  'agent.profile.updated': AgentProfileUpdatedEvent;
  'agent.profile.deleted': AgentProfileDeletedEvent;
  'trigger.list': TriggerListEvent;
  'trigger.created': TriggerCreatedEvent;
  'trigger.updated': TriggerUpdatedEvent;
  'trigger.deleted': TriggerDeletedEvent;
  'trigger.fired': TriggerFiredEvent;
  'system.heartbeat': SystemHeartbeat;
  'system.error': SystemError;
};

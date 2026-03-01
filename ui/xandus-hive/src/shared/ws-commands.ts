/** Client → Server commands */

import type { AgentProfileCreate, AgentProfileUpdate } from './types/agents.js';
import type { TriggerCreate, TriggerUpdate } from './types/triggers.js';

export interface SubscribeCommand {
  type: 'subscribe';
  channels: string[];
}

export interface ConsoleAttachCommand {
  type: 'console.attach';
  groupFolder: string;
}

export interface ConsoleDetachCommand {
  type: 'console.detach';
  groupFolder: string;
}

export interface AgentSendMessageCommand {
  type: 'agent.send_message';
  chatJid: string;
  text: string;
}

export interface AgentCancelCommand {
  type: 'agent.cancel';
  chatJid: string;
}

export interface AgentTriggerCommand {
  type: 'agent.trigger';
  chatJid: string;
  prompt: string;
}

export interface TaskCreateCommand {
  type: 'task.create';
  prompt: string;
  scheduleType: 'cron' | 'interval' | 'once';
  scheduleValue: string;
  groupFolder: string;
}

export interface TaskPauseCommand {
  type: 'task.pause';
  taskId: string;
}

export interface TaskResumeCommand {
  type: 'task.resume';
  taskId: string;
}

export interface TaskCancelCommand {
  type: 'task.cancel';
  taskId: string;
}

export interface TaskListCommand {
  type: 'task.list';
}

export interface TaskUpdateCommand {
  type: 'task.update';
  taskId: string;
  prompt?: string;
  scheduleType?: 'cron' | 'interval' | 'once';
  scheduleValue?: string;
  contextMode?: 'group' | 'isolated';
}

export interface SystemStatusCommand {
  type: 'system.status';
}

export interface AgentProfileListCommand {
  type: 'agent.profile.list';
}

export interface AgentProfileCreateCommand {
  type: 'agent.profile.create';
  payload: AgentProfileCreate;
}

export interface AgentProfileUpdateCommand {
  type: 'agent.profile.update';
  id: string;
  payload: AgentProfileUpdate;
}

export interface AgentProfileDeleteCommand {
  type: 'agent.profile.delete';
  id: string;
}

export interface TriggerListCommand {
  type: 'trigger.list';
}

export interface TriggerCreateCommand {
  type: 'trigger.create';
  payload: TriggerCreate;
}

export interface TriggerUpdateCommand {
  type: 'trigger.update';
  id: string;
  payload: TriggerUpdate;
}

export interface TriggerDeleteCommand {
  type: 'trigger.delete';
  id: string;
}

export interface TriggerToggleCommand {
  type: 'trigger.toggle';
  id: string;
  enabled: boolean;
}

export interface TriggerFireCommand {
  type: 'trigger.fire';
  id: string;
}

export interface PingCommand {
  type: 'ping';
}

export type ClientCommand =
  | SubscribeCommand
  | ConsoleAttachCommand
  | ConsoleDetachCommand
  | AgentSendMessageCommand
  | AgentCancelCommand
  | AgentTriggerCommand
  | TaskCreateCommand
  | TaskPauseCommand
  | TaskResumeCommand
  | TaskCancelCommand
  | TaskListCommand
  | TaskUpdateCommand
  | AgentProfileListCommand
  | AgentProfileCreateCommand
  | AgentProfileUpdateCommand
  | AgentProfileDeleteCommand
  | TriggerListCommand
  | TriggerCreateCommand
  | TriggerUpdateCommand
  | TriggerDeleteCommand
  | TriggerToggleCommand
  | TriggerFireCommand
  | SystemStatusCommand
  | PingCommand;

export type ClientCommandMap = {
  subscribe: SubscribeCommand;
  'console.attach': ConsoleAttachCommand;
  'console.detach': ConsoleDetachCommand;
  'agent.send_message': AgentSendMessageCommand;
  'agent.cancel': AgentCancelCommand;
  'agent.trigger': AgentTriggerCommand;
  'task.create': TaskCreateCommand;
  'task.pause': TaskPauseCommand;
  'task.resume': TaskResumeCommand;
  'task.cancel': TaskCancelCommand;
  'task.list': TaskListCommand;
  'task.update': TaskUpdateCommand;
  'agent.profile.list': AgentProfileListCommand;
  'agent.profile.create': AgentProfileCreateCommand;
  'agent.profile.update': AgentProfileUpdateCommand;
  'agent.profile.delete': AgentProfileDeleteCommand;
  'trigger.list': TriggerListCommand;
  'trigger.create': TriggerCreateCommand;
  'trigger.update': TriggerUpdateCommand;
  'trigger.delete': TriggerDeleteCommand;
  'trigger.toggle': TriggerToggleCommand;
  'trigger.fire': TriggerFireCommand;
  'system.status': SystemStatusCommand;
  ping: PingCommand;
};

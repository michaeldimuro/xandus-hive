/**
 * useHiveWebSocket — Connects to Xandus Hive core via WebSocket.
 * All real-time agent data flows through this hook.
 */

import { useEffect, useRef, useState } from 'react';
import * as ws from '@/lib/websocket';
import { useOperationsStore } from '@/stores/operationsStore';
import { useAgentStore } from '@/modules/hive/stores/agentStore';
import { useTriggerStore } from '@/modules/hive/stores/triggerStore';
import { useSkillStore } from '@/modules/hive/stores/skillStore';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { AgentProfile, Trigger } from '@xandus/shared';

let initialized = false;

function handleWsMessage(data: Record<string, unknown>): void {
  const store = useOperationsStore.getState();
  const type = data.type as string;
  const timestamp = (data.timestamp as string) || new Date().toISOString();

  switch (type) {
    case 'agent.session.started':
      store.updateMainAgent({
        id: 'xandus',
        name: 'Xandus',
        status: 'working',
        currentTask: (data.groupFolder as string) || '',
        startedAt: new Date(timestamp),
        lastActivityAt: new Date(timestamp),
      });
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: 'agent.session.started',
        timestamp,
        agent_id: 'xandus',
        session_id: data.containerName as string,
        payload: {
          groupFolder: data.groupFolder,
          chatJid: data.chatJid,
          model: data.model,
          source: data.source,
        },
      });
      break;

    case 'agent.session.terminated':
      store.updateMainAgent({ status: 'idle' });
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: 'agent.session.terminated',
        timestamp,
        agent_id: 'xandus',
        session_id: data.containerName as string,
        payload: {
          outcome: data.outcome,
          durationMs: data.durationMs,
          error: data.error,
        },
      });
      break;

    case 'agent.tool.invoked':
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: 'agent.work_activity',
        timestamp,
        agent_id: 'xandus',
        session_id: data.containerName as string,
        payload: {
          toolName: data.toolName,
          toolInput: data.toolInput,
        },
      });
      break;

    case 'agent.response':
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: 'agent.work_activity',
        timestamp,
        agent_id: 'xandus',
        session_id: data.containerName as string,
        payload: {
          response: (data.text as string)?.slice(0, 200),
          model: data.model,
        },
      });
      break;

    case 'queue.state':
      store.setQueueState({
        activeCount: data.activeCount as number,
        maxConcurrent: data.maxConcurrent as number,
        waitingCount: data.waitingCount as number,
        groups: (data.groups as Array<{ chatJid: string; groupFolder: string | null; containerName: string | null; active: boolean }>) || [],
      });
      break;

    case 'system.metrics':
      store.setSystemMetrics({
        uptime: data.uptime as number,
        dailyCost: data.dailyCost as number,
        containersActive: data.containersActive as number,
      });
      break;

    case 'task.list':
      if (Array.isArray(data.tasks)) {
        store.setScheduledTasks(data.tasks as Parameters<typeof store.setScheduledTasks>[0]);
      }
      break;

    case 'task.updated':
      if (data.task) {
        store.upsertScheduledTask(data.task as Parameters<typeof store.upsertScheduledTask>[0]);
      }
      break;

    case 'task.deleted':
      if (data.taskId) {
        store.removeScheduledTask(data.taskId as string);
      }
      break;

    case 'task.executing':
    case 'task.completed':
    case 'task.failed':
    case 'task.scheduled':
    case 'ipc.message.sent':
    case 'ipc.file.sent':
      store.addEvent({
        id: `evt-${Date.now()}`,
        type,
        timestamp,
        agent_id: 'xandus',
        payload: data,
      });
      break;

    // Agent profile events
    case 'agent.profile.list':
      if (Array.isArray(data.agents)) {
        useAgentStore.getState().setAgents(data.agents as AgentProfile[]);
      }
      break;

    case 'agent.profile.created':
      if (data.agent) {
        useAgentStore.getState().addAgent(data.agent as AgentProfile);
      }
      break;

    case 'agent.profile.updated':
      if (data.agent) {
        useAgentStore.getState().updateAgent(data.agent as AgentProfile);
      }
      break;

    case 'agent.profile.deleted':
      if (data.id) {
        useAgentStore.getState().removeAgent(data.id as string);
      }
      break;

    // Trigger events
    case 'trigger.list':
      if (Array.isArray(data.triggers)) {
        useTriggerStore.getState().setTriggers(data.triggers as Trigger[]);
      }
      break;

    case 'trigger.created':
      if (data.trigger) {
        useTriggerStore.getState().addTrigger(data.trigger as Trigger);
      }
      break;

    case 'trigger.updated':
      if (data.trigger) {
        useTriggerStore.getState().updateTrigger(data.trigger as Trigger);
      }
      break;

    case 'trigger.deleted':
      if (data.id) {
        useTriggerStore.getState().removeTrigger(data.id as string);
      }
      break;

    case 'trigger.fired':
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: 'trigger.fired',
        timestamp,
        agent_id: 'xandus',
        payload: { triggerId: data.triggerId, status: data.status, result: data.result, error: data.error },
      });
      break;

    // Skill events
    case 'skill.list':
      if (Array.isArray(data.skills)) {
        useSkillStore.getState().setSkills(data.skills);
      }
      break;

    case 'skill.content':
      if (data.skill) {
        useSkillStore.getState().setActiveSkill(data.skill as any);
      }
      break;

    case 'skill.saved':
      useSkillStore.getState().fetchSkills();
      break;

    case 'skill.deleted':
      useSkillStore.getState().fetchSkills();
      break;

    case 'system.heartbeat':
    case 'pong':
    case 'ack':
      // silent
      break;
  }
}

export function useHiveWebSocket() {
  const [loading, setLoading] = useState(!initialized);
  const isConnected = useOperationsStore((state) => state.isConnected);
  const connectionError = useOperationsStore((state) => state.connectionError);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const store = useOperationsStore.getState();

    const unsubMsg = ws.onMessage(handleWsMessage);
    const unsubStatus = ws.onStatusChange((connected) => {
      store.setConnected(connected, connected ? null : 'WebSocket disconnected');
      if (connected) {
        useAgentStore.getState().fetchAgents();
        useTriggerStore.getState().fetchTriggers();
        useSkillStore.getState().fetchSkills();
      }
    });

    // Connect with auth token when Supabase is configured
    const connectWithAuth = async () => {
      if (supabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        ws.connect(session?.access_token || undefined);
      } else {
        ws.connect();
      }
    };

    connectWithAuth();

    // Reconnect with fresh token only on token refresh (not initial session)
    let unsubAuth: (() => void) | null = null;
    if (supabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          ws.disconnect();
          ws.connect(session?.access_token || undefined);
        }
      });
      unsubAuth = () => subscription.unsubscribe();
    }

    if (!initialized) {
      initialized = true;
    }
    setLoading(false);

    cleanupRef.current = () => {
      unsubMsg();
      unsubStatus();
      unsubAuth?.();
    };

    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return {
    isConnected,
    error: connectionError,
    loading,
  };
}

/**
 * useHiveWebSocket -- Connects to Xandus Hive core via OpenClaw WebSocket protocol.
 * All real-time agent data flows through this hook.
 */

import { useEffect, useRef, useState } from "react";
import * as oc from "@/lib/openclaw-ws";
import { useAgentStore } from "@/modules/hive/stores/agentStore";
import { useSkillStore } from "@/modules/hive/stores/skillStore";
import { useTriggerStore } from "@/modules/hive/stores/triggerStore";
import { useOperationsStore } from "@/stores/operationsStore";

let initialized = false;

/**
 * Register all OpenClaw event subscriptions.
 * Returns a cleanup function that removes every listener.
 */
function registerEventListeners(): () => void {
  const unsubs: Array<() => void> = [];

  // -- Session lifecycle (OpenClaw: session.created / session.ended) --
  unsubs.push(
    oc.onEvent("session.created", (data) => {
      const store = useOperationsStore.getState();
      const timestamp = (data.timestamp as string) || new Date().toISOString();
      store.updateMainAgent({
        id: "xandus",
        name: "Xandus",
        status: "working",
        currentTask: (data.groupFolder as string) || "",
        startedAt: new Date(timestamp),
        lastActivityAt: new Date(timestamp),
      });
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: "agent.session.started",
        timestamp,
        agent_id: "xandus",
        session_id: data.containerName as string,
        payload: {
          groupFolder: data.groupFolder,
          chatJid: data.chatJid,
          model: data.model,
          source: data.source,
        },
      });
    }),
  );

  unsubs.push(
    oc.onEvent("session.ended", (data) => {
      const store = useOperationsStore.getState();
      const timestamp = (data.timestamp as string) || new Date().toISOString();
      store.updateMainAgent({ status: "idle" });
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: "agent.session.terminated",
        timestamp,
        agent_id: "xandus",
        session_id: data.containerName as string,
        payload: {
          outcome: data.outcome,
          durationMs: data.durationMs,
          error: data.error,
        },
      });
    }),
  );

  // -- Legacy event names (server may still emit these) --
  unsubs.push(
    oc.onEvent("agent.session.started", (data) => {
      const store = useOperationsStore.getState();
      const timestamp = (data.timestamp as string) || new Date().toISOString();
      store.updateMainAgent({
        id: "xandus",
        name: "Xandus",
        status: "working",
        currentTask: (data.groupFolder as string) || "",
        startedAt: new Date(timestamp),
        lastActivityAt: new Date(timestamp),
      });
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: "agent.session.started",
        timestamp,
        agent_id: "xandus",
        session_id: data.containerName as string,
        payload: {
          groupFolder: data.groupFolder,
          chatJid: data.chatJid,
          model: data.model,
          source: data.source,
        },
      });
    }),
  );

  unsubs.push(
    oc.onEvent("agent.session.terminated", (data) => {
      const store = useOperationsStore.getState();
      const timestamp = (data.timestamp as string) || new Date().toISOString();
      store.updateMainAgent({ status: "idle" });
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: "agent.session.terminated",
        timestamp,
        agent_id: "xandus",
        session_id: data.containerName as string,
        payload: {
          outcome: data.outcome,
          durationMs: data.durationMs,
          error: data.error,
        },
      });
    }),
  );

  // -- Streaming messages (OpenClaw: session.message) --
  unsubs.push(
    oc.onEvent("session.message", (data) => {
      const store = useOperationsStore.getState();
      const timestamp = (data.timestamp as string) || new Date().toISOString();
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: "agent.work_activity",
        timestamp,
        agent_id: "xandus",
        session_id: data.sessionId as string,
        payload: {
          blocks: data.blocks,
          text: (data.text as string)?.slice(0, 200),
          model: data.model,
        },
      });
    }),
  );

  // -- Tool lifecycle (OpenClaw: session.tool.start / session.tool.end) --
  unsubs.push(
    oc.onEvent("session.tool.start", (data) => {
      const store = useOperationsStore.getState();
      const timestamp = (data.timestamp as string) || new Date().toISOString();
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: "agent.work_activity",
        timestamp,
        agent_id: "xandus",
        session_id: data.sessionId as string,
        payload: {
          toolName: data.toolName,
          toolInput: data.toolInput,
        },
      });
    }),
  );

  unsubs.push(
    oc.onEvent("session.tool.end", (data) => {
      const store = useOperationsStore.getState();
      const timestamp = (data.timestamp as string) || new Date().toISOString();
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: "agent.work_activity",
        timestamp,
        agent_id: "xandus",
        session_id: data.sessionId as string,
        payload: {
          toolName: data.toolName,
          toolResult: data.toolResult,
        },
      });
    }),
  );

  // -- Legacy tool/response events --
  unsubs.push(
    oc.onEvent("agent.tool.invoked", (data) => {
      const store = useOperationsStore.getState();
      const timestamp = (data.timestamp as string) || new Date().toISOString();
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: "agent.work_activity",
        timestamp,
        agent_id: "xandus",
        session_id: data.containerName as string,
        payload: {
          toolName: data.toolName,
          toolInput: data.toolInput,
        },
      });
    }),
  );

  unsubs.push(
    oc.onEvent("agent.response", (data) => {
      const store = useOperationsStore.getState();
      const timestamp = (data.timestamp as string) || new Date().toISOString();
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: "agent.work_activity",
        timestamp,
        agent_id: "xandus",
        session_id: data.containerName as string,
        payload: {
          response: (data.text as string)?.slice(0, 200),
          model: data.model,
        },
      });
    }),
  );

  // -- Presence / health (OpenClaw) --
  unsubs.push(
    oc.onEvent("presence.update", (data) => {
      const store = useOperationsStore.getState();
      const status = data.status as string;
      if (status === "online" || status === "working") {
        store.updateMainAgent({ status: status === "working" ? "working" : "active" });
      } else {
        store.updateMainAgent({ status: "idle" });
      }
    }),
  );

  unsubs.push(
    oc.onEvent("health.update", (data) => {
      const store = useOperationsStore.getState();
      if (
        data.uptime !== undefined ||
        data.dailyCost !== undefined ||
        data.containersActive !== undefined
      ) {
        store.setSystemMetrics({
          uptime: (data.uptime as number) ?? 0,
          dailyCost: (data.dailyCost as number) ?? 0,
          containersActive: (data.containersActive as number) ?? 0,
        });
      }
    }),
  );

  // -- Tick heartbeat with system metrics --
  unsubs.push(
    oc.onEvent("tick", (data) => {
      const store = useOperationsStore.getState();
      if (data.uptime !== undefined || data.dailyCost !== undefined) {
        store.setSystemMetrics({
          uptime: (data.uptime as number) ?? 0,
          dailyCost: (data.dailyCost as number) ?? 0,
          containersActive: (data.containersActive as number) ?? 0,
        });
      }
    }),
  );

  // -- Queue state --
  unsubs.push(
    oc.onEvent("queue.state", (data) => {
      const store = useOperationsStore.getState();
      store.setQueueState({
        activeCount: data.activeCount as number,
        maxConcurrent: data.maxConcurrent as number,
        waitingCount: data.waitingCount as number,
        groups:
          (data.groups as Array<{
            chatJid: string;
            groupFolder: string | null;
            containerName: string | null;
            active: boolean;
          }>) || [],
      });
    }),
  );

  // -- System metrics (legacy) --
  unsubs.push(
    oc.onEvent("system.metrics", (data) => {
      const store = useOperationsStore.getState();
      store.setSystemMetrics({
        uptime: data.uptime as number,
        dailyCost: data.dailyCost as number,
        containersActive: data.containersActive as number,
      });
    }),
  );

  // -- Task events --
  unsubs.push(
    oc.onEvent("task.list", (data) => {
      const store = useOperationsStore.getState();
      if (Array.isArray(data.tasks)) {
        store.setScheduledTasks(data.tasks as Parameters<typeof store.setScheduledTasks>[0]);
      }
    }),
  );

  unsubs.push(
    oc.onEvent("task.updated", (data) => {
      const store = useOperationsStore.getState();
      if (data.task) {
        store.upsertScheduledTask(data.task as Parameters<typeof store.upsertScheduledTask>[0]);
      }
    }),
  );

  unsubs.push(
    oc.onEvent("task.deleted", (data) => {
      const store = useOperationsStore.getState();
      if (data.taskId) {
        store.removeScheduledTask(data.taskId as string);
      }
    }),
  );

  // Miscellaneous task/IPC events -> live feed
  for (const evtName of [
    "task.executing",
    "task.completed",
    "task.failed",
    "task.scheduled",
    "ipc.message.sent",
    "ipc.file.sent",
  ] as const) {
    unsubs.push(
      oc.onEvent(evtName, (data) => {
        const store = useOperationsStore.getState();
        const timestamp = (data.timestamp as string) || new Date().toISOString();
        store.addEvent({
          id: `evt-${Date.now()}`,
          type: evtName,
          timestamp,
          agent_id: "xandus",
          payload: data,
        });
      }),
    );
  }

  // -- Agent profile events (pushed from server, e.g. when another client makes changes) --
  unsubs.push(
    oc.onEvent("agent.profile.list", (data) => {
      if (Array.isArray(data.agents)) {
        useAgentStore.getState().setAgents(data.agents);
      }
    }),
  );

  unsubs.push(
    oc.onEvent("agent.profile.created", (data) => {
      if (data.agent) {
        useAgentStore.getState().addAgent(data.agent as never);
      }
    }),
  );

  unsubs.push(
    oc.onEvent("agent.profile.updated", (data) => {
      if (data.agent) {
        useAgentStore.getState().updateAgent(data.agent as never);
      }
    }),
  );

  unsubs.push(
    oc.onEvent("agent.profile.deleted", (data) => {
      if (data.id) {
        useAgentStore.getState().removeAgent(data.id as string);
      }
    }),
  );

  // -- Trigger events (pushed from server) --
  unsubs.push(
    oc.onEvent("trigger.list", (data) => {
      if (Array.isArray(data.triggers)) {
        useTriggerStore.getState().setTriggers(data.triggers);
      }
    }),
  );

  unsubs.push(
    oc.onEvent("trigger.created", (data) => {
      if (data.trigger) {
        useTriggerStore.getState().addTrigger(data.trigger as never);
      }
    }),
  );

  unsubs.push(
    oc.onEvent("trigger.updated", (data) => {
      if (data.trigger) {
        useTriggerStore.getState().updateTrigger(data.trigger as never);
      }
    }),
  );

  unsubs.push(
    oc.onEvent("trigger.deleted", (data) => {
      if (data.id) {
        useTriggerStore.getState().removeTrigger(data.id as string);
      }
    }),
  );

  unsubs.push(
    oc.onEvent("trigger.fired", (data) => {
      const store = useOperationsStore.getState();
      const timestamp = (data.timestamp as string) || new Date().toISOString();
      store.addEvent({
        id: `evt-${Date.now()}`,
        type: "trigger.fired",
        timestamp,
        agent_id: "xandus",
        payload: {
          triggerId: data.triggerId,
          status: data.status,
          result: data.result,
          error: data.error,
        },
      });
    }),
  );

  // -- Skill events (pushed from server) --
  unsubs.push(
    oc.onEvent("skill.list", (data) => {
      if (Array.isArray(data.skills)) {
        useSkillStore.getState().setSkills(data.skills);
      }
    }),
  );

  unsubs.push(
    oc.onEvent("skill.content", (data) => {
      if (data.skill) {
        useSkillStore.getState().setActiveSkill(data.skill as never);
      }
    }),
  );

  unsubs.push(
    oc.onEvent("skill.saved", () => {
      useSkillStore.getState().fetchSkills();
    }),
  );

  unsubs.push(
    oc.onEvent("skill.deleted", () => {
      useSkillStore.getState().fetchSkills();
    }),
  );

  return () => {
    for (const unsub of unsubs) {
      unsub();
    }
  };
}

export function useHiveWebSocket() {
  const [loading, setLoading] = useState(!initialized);
  const isConnected = useOperationsStore((state) => state.isConnected);
  const connectionError = useOperationsStore((state) => state.connectionError);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const store = useOperationsStore.getState();

    // Register all event listeners
    const unsubEvents = registerEventListeners();

    // Connection status listener
    const unsubStatus = oc.onStatusChange((connected) => {
      store.setConnected(connected, connected ? null : "WebSocket disconnected");
      if (connected) {
        // Fetch initial data on (re)connect
        useAgentStore.getState().fetchAgents();
        useTriggerStore.getState().fetchTriggers();
        useSkillStore.getState().fetchSkills();
      }
    });

    // Connect with gateway token for WS auth.
    // The gateway validates its own token (OPENCLAW_GATEWAY_TOKEN), not the
    // Supabase JWT. Supabase auth is used separately for direct DB queries.
    const gatewayToken = import.meta.env.VITE_GATEWAY_TOKEN as string | undefined;
    oc.connect({ token: gatewayToken });

    if (!initialized) {
      initialized = true;
    }
    setLoading(false);

    cleanupRef.current = () => {
      unsubEvents();
      unsubStatus();
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

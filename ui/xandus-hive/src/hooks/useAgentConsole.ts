import { useCallback, useEffect, useRef, useState } from "react";
import * as oc from "@/lib/openclaw-ws";

const MAX_LINES = 500;

export interface ConsoleLine {
  text: string;
  timestamp: string;
  type: "stdout" | "tool" | "response" | "system";
}

export function useAgentConsole(groupFolder: string | null) {
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [isAttached, setIsAttached] = useState(false);
  const currentGroup = useRef<string | null>(null);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    // Container output -> stdout lines
    unsubs.push(
      oc.onEvent("agent.container.output", (data) => {
        if (!isAttached) {
          return;
        }
        setLines((prev) => {
          const next = [
            ...prev,
            {
              text: data.line as string,
              timestamp: data.timestamp as string,
              type: "stdout" as const,
            },
          ];
          return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
        });
      }),
    );

    // OpenClaw session.message -> response lines
    unsubs.push(
      oc.onEvent("session.message", (data) => {
        if (!isAttached) {
          return;
        }
        const text = data.text as string;
        if (text) {
          setLines((prev) => {
            const next = [
              ...prev,
              {
                text: `[response] ${text.slice(0, 500)}`,
                timestamp: (data.timestamp as string) || new Date().toISOString(),
                type: "response" as const,
              },
            ];
            return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
          });
        }
      }),
    );

    // OpenClaw session.tool.start -> tool lines
    unsubs.push(
      oc.onEvent("session.tool.start", (data) => {
        if (!isAttached) {
          return;
        }
        setLines((prev) => {
          const next = [
            ...prev,
            {
              text: `[tool] ${String(data.toolName)}${data.toolInput ? ` -- ${JSON.stringify(data.toolInput)}` : ""}`,
              timestamp: (data.timestamp as string) || new Date().toISOString(),
              type: "tool" as const,
            },
          ];
          return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
        });
      }),
    );

    // Legacy tool invoked
    unsubs.push(
      oc.onEvent("agent.tool.invoked", (data) => {
        if (!isAttached) {
          return;
        }
        setLines((prev) => {
          const next = [
            ...prev,
            {
              text: `[tool] ${String(data.toolName)}${data.toolInput ? ` -- ${JSON.stringify(data.toolInput)}` : ""}`,
              timestamp: data.timestamp as string,
              type: "tool" as const,
            },
          ];
          return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
        });
      }),
    );

    // Legacy response
    unsubs.push(
      oc.onEvent("agent.response", (data) => {
        if (!isAttached) {
          return;
        }
        setLines((prev) => {
          const next = [
            ...prev,
            {
              text: `[response] ${(data.text as string)?.slice(0, 500)}`,
              timestamp: data.timestamp as string,
              type: "response" as const,
            },
          ];
          return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
        });
      }),
    );

    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }, [isAttached]);

  const attach = useCallback((gf: string) => {
    currentGroup.current = gf;
    oc.xandus.console
      .attach(gf)
      .then(() => {
        setIsAttached(true);
      })
      .catch(() => {
        // Still mark as attached locally so we receive events
        setIsAttached(true);
      });
    setLines([{ text: `Attached to ${gf}`, timestamp: new Date().toISOString(), type: "system" }]);
  }, []);

  const detach = useCallback(() => {
    if (currentGroup.current) {
      oc.xandus.console.detach(currentGroup.current).catch(() => {
        /* ignore */
      });
      currentGroup.current = null;
    }
    setIsAttached(false);
  }, []);

  // Auto-attach when groupFolder changes
  useEffect(() => {
    if (groupFolder) {
      attach(groupFolder);
    }
    return () => {
      detach();
    };
  }, [groupFolder, attach, detach]);

  return { lines, isAttached, attach, detach };
}

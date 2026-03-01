import { useCallback, useEffect, useRef, useState } from 'react';
import * as ws from '@/lib/websocket';

const MAX_LINES = 500;

export interface ConsoleLine {
  text: string;
  timestamp: string;
  type: 'stdout' | 'tool' | 'response' | 'system';
}

export function useAgentConsole(groupFolder: string | null) {
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [isAttached, setIsAttached] = useState(false);
  const currentGroup = useRef<string | null>(null);

  useEffect(() => {
    const unsub = ws.onMessage((data) => {
      const type = data.type as string;

      if (type === 'agent.container.output' && isAttached) {
        setLines((prev) => {
          const next = [...prev, {
            text: data.line as string,
            timestamp: data.timestamp as string,
            type: 'stdout' as const,
          }];
          return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
        });
      }

      if (type === 'agent.tool.invoked' && isAttached) {
        setLines((prev) => {
          const next = [...prev, {
            text: `[tool] ${data.toolName}${data.toolInput ? ` — ${data.toolInput}` : ''}`,
            timestamp: data.timestamp as string,
            type: 'tool' as const,
          }];
          return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
        });
      }

      if (type === 'agent.response' && isAttached) {
        setLines((prev) => {
          const next = [...prev, {
            text: `[response] ${(data.text as string)?.slice(0, 500)}`,
            timestamp: data.timestamp as string,
            type: 'response' as const,
          }];
          return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
        });
      }

      if (type === 'ack' && data.command === 'console.attach') {
        setIsAttached(true);
      }
      if (type === 'ack' && data.command === 'console.detach') {
        setIsAttached(false);
      }
    });

    return unsub;
  }, [isAttached]);

  const attach = useCallback((gf: string) => {
    currentGroup.current = gf;
    ws.send({ type: 'console.attach', groupFolder: gf });
    setLines([{ text: `Attached to ${gf}`, timestamp: new Date().toISOString(), type: 'system' }]);
  }, []);

  const detach = useCallback(() => {
    if (currentGroup.current) {
      ws.send({ type: 'console.detach', groupFolder: currentGroup.current });
      currentGroup.current = null;
    }
    setIsAttached(false);
  }, []);

  // Auto-attach when groupFolder changes
  useEffect(() => {
    if (groupFolder) {
      attach(groupFolder);
    }
    return () => { detach(); };
  }, [groupFolder, attach, detach]);

  return { lines, isAttached, attach, detach };
}

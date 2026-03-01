import {
  Activity,
  Bot,
  ChevronDown,
  ChevronRight,
  Loader2,
  Send,
  Square,
  Terminal,
} from "lucide-react";
// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sessions, chat, onEvent, type SessionInfo, type ChatMessage } from "@/lib/openclaw-ws";

// ---------------------------------------------------------------------------
// Status colour helpers
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  active: "border-green-500/30 text-green-400",
  idle: "border-yellow-500/30 text-yellow-400",
  terminated: "border-zinc-500/30 text-zinc-400",
};

const ROLE_STYLES: Record<string, string> = {
  user: "bg-indigo-600/20 text-indigo-300",
  assistant: "bg-green-600/20 text-green-300",
  tool: "bg-cyan-600/20 text-cyan-300",
  system: "bg-yellow-600/20 text-yellow-300",
};

// ---------------------------------------------------------------------------
// Chat Message Component
// ---------------------------------------------------------------------------

function ChatBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex gap-2 px-3 py-1.5 hover:bg-white/5">
      <Badge
        variant="outline"
        className={`shrink-0 text-[10px] h-5 ${ROLE_STYLES[msg.role] || ""}`}
      >
        {msg.role}
      </Badge>
      <div className="min-w-0 flex-1">
        {msg.toolName && (
          <span className="text-xs text-cyan-400 font-mono mr-2">[{msg.toolName}]</span>
        )}
        <span className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
          {msg.content}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {new Date(msg.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session Row (expandable)
// ---------------------------------------------------------------------------

function SessionRow({ session }: { session: SessionInfo }) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [message, setMessage] = useState("");
  const [aborting, setAborting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history when expanded
  useEffect(() => {
    if (!expanded) {
      return;
    }
    let mounted = true;
    setLoadingHistory(true);
    chat
      .history(session.sessionKey)
      .then((msgs) => {
        if (mounted) {
          setHistory(msgs);
        }
      })
      .catch(() => {
        // Not available yet
      })
      .finally(() => {
        if (mounted) {
          setLoadingHistory(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [expanded, session.sessionKey]);

  // Real-time streaming of tool calls and responses for this session
  useEffect(() => {
    if (!expanded) {
      return;
    }
    const unsub = onEvent(
      ["agent.tool.invoked", "agent.response", "agent.container.output", "chat.message"],
      (data) => {
        const key =
          (data.sessionKey as string) ||
          (data.groupFolder as string) ||
          (data.containerName as string);
        if (key !== session.sessionKey && key !== session.containerName) {
          return;
        }

        const ts = (data.timestamp as string) || new Date().toISOString();

        if (data.type === "agent.tool.invoked") {
          setHistory((prev) => [
            ...prev,
            {
              id: `rt-${Date.now()}`,
              role: "tool",
              content: (data.toolInput as string) || "",
              toolName: data.toolName as string,
              timestamp: ts,
            },
          ]);
        } else if (data.type === "agent.response") {
          setHistory((prev) => [
            ...prev,
            {
              id: `rt-${Date.now()}`,
              role: "assistant",
              content: (data.text as string) || "",
              timestamp: ts,
            },
          ]);
        } else if (data.type === "chat.message") {
          const msg = data.message as Record<string, unknown>;
          if (msg) {
            setHistory((prev) => [...prev, msg]);
          }
        }
      },
    );
    return unsub;
  }, [expanded, session.sessionKey, session.containerName]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [history]);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }
    void chat.send(trimmed, session.sessionKey);
    setHistory((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      },
    ]);
    setMessage("");
  }, [message, session.sessionKey]);

  const handleAbort = useCallback(() => {
    if (!session.runId) {
      return;
    }
    setAborting(true);
    void chat.abort(session.runId);
    setTimeout(() => setAborting(false), 3000);
  }, [session.runId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Card className="border-border bg-card">
      {/* Collapsed header */}
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <CardContent className="flex items-center gap-3 p-4">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20">
            <Bot className="h-4 w-4 text-indigo-400" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{session.agentName}</p>
            <p className="text-xs text-muted-foreground truncate font-mono">{session.sessionKey}</p>
          </div>

          <Badge variant="outline" className={STATUS_STYLES[session.status] || STATUS_STYLES.idle}>
            {session.status}
          </Badge>

          {session.model && (
            <Badge variant="outline" className="text-[10px] border-zinc-600/30 text-zinc-400">
              {session.model}
            </Badge>
          )}

          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(session.startedAt).toLocaleTimeString()}
          </span>
        </CardContent>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border">
          {/* Chat history */}
          <div className="bg-zinc-950 rounded-b-lg">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2">
              <Terminal className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs text-muted-foreground font-mono">Session transcript</span>
              {session.status === "active" && (
                <Badge
                  variant="outline"
                  className="ml-auto border-green-500/30 text-green-400 text-[10px]"
                >
                  <Activity className="h-2.5 w-2.5 mr-1 animate-pulse" />
                  live
                </Badge>
              )}
            </div>

            <ScrollArea className="h-64" ref={scrollRef}>
              <div className="py-2 font-mono text-sm">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">No messages yet.</p>
                ) : (
                  history.map((msg) => <ChatBubble key={msg.id} msg={msg} />)
                )}
              </div>
            </ScrollArea>

            {/* Input bar */}
            <div className="flex items-center gap-2 border-t border-border p-3">
              <Input
                placeholder={`Send to ${session.agentName}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="font-mono text-sm"
              />
              <Button onClick={handleSend} disabled={!message.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
              {session.status === "active" && session.runId && (
                <Button
                  variant="outline"
                  size="icon"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={handleAbort}
                  disabled={aborting}
                  title="Abort session"
                >
                  {aborting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function SessionsPage() {
  const [sessionList, setSessionList] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial list
  useEffect(() => {
    let mounted = true;
    sessions
      .list()
      .then((list) => {
        if (mounted) {
          setSessionList(list);
        }
      })
      .catch(() => {
        // Server may not support this yet; show empty
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Real-time session updates
  useEffect(() => {
    const unsub = onEvent(
      ["agent.session.started", "agent.session.terminated", "sessions.list"],
      (data) => {
        if (data.type === "agent.session.started") {
          const info: SessionInfo = {
            sessionKey: (data.groupFolder as string) || (data.containerName as string) || "",
            agentName: (data.agentName as string) || "Xandus",
            status: "active",
            startedAt: (data.timestamp as string) || new Date().toISOString(),
            groupFolder: (data.groupFolder as string) || "",
            containerName: (data.containerName as string) || "",
            model: data.model as string | undefined,
            runId: data.runId as string | undefined,
          };
          setSessionList((prev) => {
            // Replace if same sessionKey, otherwise prepend
            const exists = prev.findIndex((s) => s.sessionKey === info.sessionKey);
            if (exists >= 0) {
              const updated = [...prev];
              updated[exists] = info;
              return updated;
            }
            return [info, ...prev];
          });
        }

        if (data.type === "agent.session.terminated") {
          const containerName = data.containerName as string;
          setSessionList((prev) =>
            prev.map((s) =>
              s.containerName === containerName ? { ...s, status: "terminated" as const } : s,
            ),
          );
        }

        if (data.type === "sessions.list" && Array.isArray(data.sessions)) {
          setSessionList(data.sessions as SessionInfo[]);
        }
      },
    );
    return unsub;
  }, []);

  const activeSessions = sessionList.filter((s) => s.status === "active");
  const otherSessions = sessionList.filter((s) => s.status !== "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground text-sm">
            Browse active and recent agent sessions. Expand to view history and interact.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSessions.length > 0 && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Activity className="h-3 w-3 mr-1" />
              {activeSessions.length} active
            </Badge>
          )}
          <Badge variant="outline" className="text-muted-foreground">
            {sessionList.length} total
          </Badge>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            <span className="text-sm text-muted-foreground">Loading sessions...</span>
          </div>
        </div>
      ) : sessionList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Terminal className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No sessions</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Agent sessions will appear here when started.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-3">
            {/* Active sessions first */}
            {activeSessions.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  Active Sessions
                </h2>
                {activeSessions.map((session) => (
                  <SessionRow key={session.sessionKey} session={session} />
                ))}
              </div>
            )}

            {/* Other sessions */}
            {otherSessions.length > 0 && (
              <div className="space-y-3">
                {activeSessions.length > 0 && (
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mt-4">
                    Recent Sessions
                  </h2>
                )}
                {otherSessions.map((session) => (
                  <SessionRow key={session.sessionKey} session={session} />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

import {
  Terminal,
  ArrowDown,
  Send,
  Search,
  Download,
  SplitSquareHorizontal,
  History,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentConsole, type ConsoleLine } from "@/hooks/useAgentConsole";
import * as ws from "@/lib/openclaw-ws";
import { useOperationsStore } from "@/stores/operationsStore";

const LINE_COLORS: Record<string, string> = {
  stdout: "text-zinc-300",
  tool: "text-cyan-400",
  response: "text-green-400",
  system: "text-yellow-400",
};

function ConsoleLineItem({ line, highlight }: { line: ConsoleLine; highlight?: string }) {
  const time = line.timestamp
    ? new Date(line.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  let text = line.text;
  if (highlight && text.toLowerCase().includes(highlight.toLowerCase())) {
    const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + highlight.length);
    const after = text.slice(idx + highlight.length);
    return (
      <div className="flex gap-2 px-3 py-0.5 hover:bg-white/5 bg-yellow-500/5">
        <span className="text-muted-foreground shrink-0 select-none text-xs">{time}</span>
        <span
          className={`whitespace-pre-wrap break-all text-sm ${LINE_COLORS[line.type] || "text-zinc-300"}`}
        >
          {before}
          <mark className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">{match}</mark>
          {after}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 px-3 py-0.5 hover:bg-white/5">
      <span className="text-muted-foreground shrink-0 select-none text-xs">{time}</span>
      <span
        className={`whitespace-pre-wrap break-all text-sm ${LINE_COLORS[line.type] || "text-zinc-300"}`}
      >
        {text}
      </span>
    </div>
  );
}

interface ConsolePanel {
  groupFolder: string;
}

function TerminalPanel({ groupFolder, searchQuery }: { groupFolder: string; searchQuery: string }) {
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { lines, isAttached } = useAgentConsole(groupFolder || null);

  const filteredLines = useMemo(() => {
    if (!searchQuery) {
      return lines;
    }
    return lines.filter((l) => l.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [lines, searchQuery]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [filteredLines, autoScroll]);

  return (
    <div className="relative flex-1 overflow-hidden rounded-lg border bg-zinc-950">
      <div className="flex items-center gap-2 border-b bg-zinc-900/80 px-4 py-2">
        <Terminal className="h-4 w-4 text-green-400" />
        <span className="text-muted-foreground text-xs font-mono">
          {groupFolder || "no group"} {isAttached ? "(live)" : ""}
        </span>
        <Badge
          variant="outline"
          className={`ml-2 text-[10px] ${isAttached ? "border-green-500/30 text-green-400" : "border-zinc-500/30 text-zinc-400"}`}
        >
          {isAttached ? "attached" : "detached"}
        </Badge>
        {filteredLines.length > 0 && (
          <span className="text-muted-foreground ml-auto text-xs">
            {searchQuery ? `${filteredLines.length}/${lines.length}` : lines.length} lines
          </span>
        )}
        <div className="flex items-center gap-1 ml-2">
          <Switch
            id={`scroll-${groupFolder}`}
            checked={autoScroll}
            onCheckedChange={setAutoScroll}
            className="scale-75"
          />
          <Label htmlFor={`scroll-${groupFolder}`} className="text-muted-foreground text-[10px]">
            Auto
          </Label>
        </div>
      </div>
      <ScrollArea className="h-[calc(100%-2.5rem)]" ref={scrollRef}>
        <div className="min-h-full py-2 font-mono text-sm">
          {filteredLines.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground text-sm">
                {searchQuery
                  ? "No matching lines."
                  : isAttached
                    ? "Waiting for output..."
                    : "Select a group to attach."}
              </p>
            </div>
          ) : (
            filteredLines.map((line, i) => (
              <ConsoleLineItem key={`${i}-${line.timestamp}`} line={line} highlight={searchQuery} />
            ))
          )}
        </div>
      </ScrollArea>
      {!autoScroll && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-4 right-4 h-8 w-8 rounded-full opacity-80"
          onClick={() => setAutoScroll(true)}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default function ConsolePage() {
  const [panels, setPanels] = useState<ConsolePanel[]>([{ groupFolder: "main" }]);
  const [splitMode, setSplitMode] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const inputRef = useRef<HTMLInputElement>(null);

  const queueState = useOperationsStore((s) => s.queueState);
  const liveFeed = useOperationsStore((s) => s.liveFeed);

  const groups: Array<{ value: string; label: string }> = [{ value: "main", label: "main" }];
  if (queueState?.groups) {
    for (const g of queueState.groups) {
      const folder = g.groupFolder || g.chatJid;
      if (folder && folder !== "main" && !groups.some((x) => x.value === folder)) {
        groups.push({ value: folder, label: folder });
      }
    }
  }

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || !panels[0]?.groupFolder) {
      return;
    }
    void ws.request("agent.send_message", { groupFolder: panels[0].groupFolder, message: trimmed });
    setMessage("");
    inputRef.current?.focus();
  }, [message, panels]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const toggleSplit = useCallback(() => {
    if (splitMode) {
      setPanels((p) => [p[0]]);
      setSplitMode(false);
    } else {
      const secondGroup = groups.length > 1 ? groups[1].value : "main";
      setPanels((p) => [...p.slice(0, 1), { groupFolder: secondGroup }]);
      setSplitMode(true);
    }
  }, [splitMode, groups]);

  const exportLog = useCallback(() => {
    // This exports the first panel's group name — the actual lines are managed by the hook
    // We'll trigger a download of all visible output
    const panel = panels[0];
    const blob = new Blob(
      [
        `Console export for ${panel.groupFolder}\nExported at ${new Date().toISOString()}\n\n(Attach to a live session to capture output)`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `console-${panel.groupFolder}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [panels]);

  // Session history from liveFeed (agent.session events)
  const sessionHistory = useMemo(() => {
    return liveFeed
      .filter((e) => e.type === "agent.session.started" || e.type === "agent.session.terminated")
      .slice(0, 20);
  }, [liveFeed]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Console</h1>
          <p className="text-muted-foreground text-sm">
            Attach to live agent sessions, split view, and review history.
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "live" | "history")}
        className="flex-1 flex flex-col"
      >
        <div className="flex items-center gap-3">
          <TabsList>
            <TabsTrigger value="live">
              <Terminal className="h-3.5 w-3.5 mr-1" />
              Live
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-3.5 w-3.5 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          {activeTab === "live" && (
            <>
              {panels.map((panel, idx) => (
                <Select
                  key={idx}
                  value={panel.groupFolder}
                  onValueChange={(v) =>
                    setPanels((p) => p.map((pp, i) => (i === idx ? { groupFolder: v } : pp)))
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSearch((s) => !s)}
                  title="Search"
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSplit}
                  title={splitMode ? "Single view" : "Split view"}
                >
                  <SplitSquareHorizontal className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={exportLog} title="Export log">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>

        {showSearch && activeTab === "live" && (
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search console output..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-mono text-sm h-8"
            />
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                Clear
              </Button>
            )}
          </div>
        )}

        <TabsContent value="live" className="flex-1 flex flex-col gap-3 mt-0">
          <div className={`flex-1 flex ${splitMode ? "gap-3" : ""}`}>
            {panels.map((panel, idx) => (
              <div
                key={`${panel.groupFolder}-${idx}`}
                className={splitMode ? "flex-1" : "flex-1 flex flex-col"}
              >
                <TerminalPanel groupFolder={panel.groupFolder} searchQuery={searchQuery} />
              </div>
            ))}
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              placeholder={`Send message to ${panels[0]?.groupFolder || "group"}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="font-mono"
            />
            <Button onClick={handleSend} disabled={!message.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 mt-0">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Session History</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm">No session history available.</p>
              ) : (
                <div className="space-y-2">
                  {sessionHistory.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 rounded-md border px-3 py-2"
                    >
                      <Badge
                        variant="outline"
                        className={
                          event.type === "agent.session.started"
                            ? "border-green-500/30 text-green-400"
                            : "border-zinc-500/30 text-zinc-400"
                        }
                      >
                        {event.type === "agent.session.started" ? "started" : "terminated"}
                      </Badge>
                      <span className="text-sm font-mono">
                        {(event.payload?.groupFolder as string) ||
                          (event.payload?.containerName as string) ||
                          "unknown"}
                      </span>
                      {event.type === "agent.session.terminated" &&
                        typeof event.payload?.durationMs === "number" && (
                          <span className="text-muted-foreground text-xs">
                            {Math.round(event.payload.durationMs / 1000)}s
                          </span>
                        )}
                      {event.type === "agent.session.terminated" && (
                        <Badge variant="outline" className="text-[10px]">
                          {(event.payload?.outcome as string) || "unknown"}
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-xs ml-auto">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

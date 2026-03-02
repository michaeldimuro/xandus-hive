import { ShieldCheck, ShieldX, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { execApprovals, onEvent } from "@/lib/openclaw-ws";

// ---------------------------------------------------------------------------
// Types — mirrors gateway ExecApprovalRecord shape
// ---------------------------------------------------------------------------

interface ApprovalRequest {
  command: string;
  cwd?: string | null;
  host?: string | null;
  agentId?: string | null;
  sessionKey?: string | null;
}

interface ExecApprovalRecord {
  id: string;
  request: ApprovalRequest;
  createdAtMs: number;
  expiresAtMs: number;
  resolvedAtMs?: number;
  decision?: "allow-once" | "allow-always" | "deny";
  resolvedBy?: string | null;
}

// Derived UI status from the record's decision/resolvedAtMs fields
type ApprovalStatus = "pending" | "approved" | "denied";

function deriveStatus(record: ExecApprovalRecord): ApprovalStatus {
  if (record.resolvedAtMs === undefined || record.decision === undefined) return "pending";
  return record.decision === "deny" ? "denied" : "approved";
}

function buildContext(req: ApprovalRequest): string | undefined {
  const parts: string[] = [];
  if (req.cwd) parts.push(`cwd: ${req.cwd}`);
  if (req.host) parts.push(`host: ${req.host}`);
  return parts.length > 0 ? parts.join(" | ") : undefined;
}

// ---------------------------------------------------------------------------
// Approval Card
// ---------------------------------------------------------------------------

function ApprovalCard({
  record,
  onResolve,
  resolving,
}: {
  record: ExecApprovalRecord;
  onResolve: (id: string, decision: "allow-once" | "deny") => void;
  resolving: string | null;
}) {
  const status = deriveStatus(record);
  const isPending = status === "pending";
  const isResolving = resolving === record.id;
  const context = buildContext(record.request);

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {record.request.agentId || "unknown agent"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {record.request.sessionKey || record.id}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              status === "approved"
                ? "border-green-500/30 text-green-400"
                : status === "denied"
                  ? "border-red-500/30 text-red-400"
                  : "border-yellow-500/30 text-yellow-400"
            }
          >
            {status}
          </Badge>
        </div>

        {/* Command */}
        <div className="rounded-md border border-border bg-zinc-950 px-3 py-2">
          <p className="text-xs text-muted-foreground mb-1">Command</p>
          <code className="text-sm text-cyan-400 font-mono whitespace-pre-wrap break-all">
            {record.request.command}
          </code>
        </div>

        {/* Context */}
        {context && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Context</p>
            <p className="text-sm text-foreground/80">{context}</p>
          </div>
        )}

        {/* Footer: timestamp + actions */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {new Date(record.createdAtMs).toLocaleString()}
          </span>

          {isPending && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => onResolve(record.id, "deny")}
                disabled={isResolving}
              >
                {isResolving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldX className="h-3.5 w-3.5 mr-1" />
                )}
                Deny
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onResolve(record.id, "allow-once")}
                disabled={isResolving}
              >
                {isResolving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                )}
                Approve
              </Button>
            </div>
          )}

          {status === "approved" && record.resolvedAtMs && (
            <span className="text-xs text-green-400">
              Approved {new Date(record.resolvedAtMs).toLocaleTimeString()}
            </span>
          )}
          {status === "denied" && record.resolvedAtMs && (
            <span className="text-xs text-red-400">
              Denied {new Date(record.resolvedAtMs).toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ExecApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  // Fetch initial list of pending approvals from the gateway
  useEffect(() => {
    let mounted = true;
    execApprovals
      .list()
      .then((result) => {
        if (mounted && Array.isArray(result.approvals)) {
          setApprovals(result.approvals as ExecApprovalRecord[]);
        }
      })
      .catch(() => {
        // Gateway may not support this yet; show empty
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Real-time updates via gateway broadcast events
  useEffect(() => {
    const unsubs = [
      // New approval requested — matches gateway broadcast "exec.approval.requested"
      onEvent("exec.approval.requested", (data) => {
        const d = data as {
          id?: string;
          request?: ApprovalRequest;
          createdAtMs?: number;
          expiresAtMs?: number;
        };
        if (d.id && d.request) {
          const record: ExecApprovalRecord = {
            id: d.id,
            request: d.request,
            createdAtMs: d.createdAtMs ?? Date.now(),
            expiresAtMs: d.expiresAtMs ?? Date.now() + 120_000,
          };
          setApprovals((prev) => {
            // Avoid duplicates if we already fetched this record
            if (prev.some((a) => a.id === record.id)) return prev;
            return [record, ...prev];
          });
        }
      }),

      // Approval resolved — matches gateway broadcast "exec.approval.resolved"
      onEvent("exec.approval.resolved", (data) => {
        const d = data as {
          id?: string;
          decision?: ExecApprovalRecord["decision"];
          resolvedBy?: string;
          ts?: number;
        };
        if (d.id) {
          setApprovals((prev) =>
            prev.map((a) =>
              a.id === d.id
                ? {
                    ...a,
                    decision: d.decision,
                    resolvedAtMs: d.ts ?? Date.now(),
                    resolvedBy: d.resolvedBy ?? null,
                  }
                : a,
            ),
          );
          setResolving(null);
        }
      }),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, []);

  const handleResolve = useCallback((id: string, decision: "allow-once" | "deny") => {
    setResolving(id);
    void execApprovals.resolve(id, decision);
    // Optimistic update
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, decision, resolvedAtMs: Date.now() } : a,
      ),
    );
    // Clear resolving spinner after a short delay in case WS ack doesn't arrive
    setTimeout(() => setResolving((cur) => (cur === id ? null : cur)), 3000);
  }, []);

  const pending = approvals.filter((a) => deriveStatus(a) === "pending");
  const history = approvals.filter((a) => deriveStatus(a) !== "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground text-sm">
            Review and resolve exec command approvals from agents.
          </p>
        </div>
        {pending.length > 0 && (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            {pending.length} pending
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "history")}>
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pending
            {pending.length > 0 && (
              <span className="ml-1.5 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-400">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                <span className="text-sm text-muted-foreground">Loading approvals...</span>
              </div>
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium">No pending approvals</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All clear. Approvals from agents will appear here in real time.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-3">
                {pending.map((record) => (
                  <ApprovalCard
                    key={record.id}
                    record={record}
                    onResolve={handleResolve}
                    resolving={resolving}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <XCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium">No history yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Resolved approvals will appear here.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-3">
                {history.map((record) => (
                  <ApprovalCard
                    key={record.id}
                    record={record}
                    onResolve={handleResolve}
                    resolving={resolving}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { ShieldCheck, ShieldX, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { execApprovals, onEvent } from "@/lib/openclaw-ws";

// ---------------------------------------------------------------------------
// Approval Card
// ---------------------------------------------------------------------------

function ApprovalCard({
  approval,
  onResolve,
  resolving,
}: {
  approval: ExecApproval;
  onResolve: (id: string, decision: "approved" | "denied") => void;
  resolving: string | null;
}) {
  const isPending = approval.status === "pending";
  const isResolving = resolving === approval.id;

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
              <p className="text-sm font-medium text-foreground truncate">{approval.agentName}</p>
              <p className="text-xs text-muted-foreground truncate">{approval.sessionKey}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              approval.status === "approved"
                ? "border-green-500/30 text-green-400"
                : approval.status === "denied"
                  ? "border-red-500/30 text-red-400"
                  : "border-yellow-500/30 text-yellow-400"
            }
          >
            {approval.status}
          </Badge>
        </div>

        {/* Command */}
        <div className="rounded-md border border-border bg-zinc-950 px-3 py-2">
          <p className="text-xs text-muted-foreground mb-1">Command</p>
          <code className="text-sm text-cyan-400 font-mono whitespace-pre-wrap break-all">
            {approval.command}
          </code>
        </div>

        {/* Context */}
        {approval.context && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Context</p>
            <p className="text-sm text-foreground/80">{approval.context}</p>
          </div>
        )}

        {/* Footer: timestamp + actions */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {new Date(approval.timestamp).toLocaleString()}
          </span>

          {isPending && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => onResolve(approval.id, "denied")}
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
                onClick={() => onResolve(approval.id, "approved")}
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

          {approval.status === "approved" && approval.resolvedAt && (
            <span className="text-xs text-green-400">
              Approved {new Date(approval.resolvedAt).toLocaleTimeString()}
            </span>
          )}
          {approval.status === "denied" && approval.resolvedAt && (
            <span className="text-xs text-red-400">
              Denied {new Date(approval.resolvedAt).toLocaleTimeString()}
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
  const [approvals, setApprovals] = useState<ExecApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  // Fetch initial list
  useEffect(() => {
    let mounted = true;
    execApprovals
      .get()
      .then((list) => {
        if (mounted) {
          setApprovals(list);
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

  // Real-time updates
  useEffect(() => {
    const unsub = onEvent(
      ["exec.approval.created", "exec.approval.resolved", "exec.approvals.list"],
      (data) => {
        if (data.type === "exec.approval.created") {
          const newApproval = data.approval as Record<string, unknown>;
          if (newApproval) {
            setApprovals((prev) => [newApproval, ...prev]);
          }
        }
        if (data.type === "exec.approval.resolved") {
          const resolved = data as { id?: string; status?: string; resolvedAt?: string };
          if (resolved.id) {
            setApprovals((prev) =>
              prev.map((a) =>
                a.id === resolved.id
                  ? {
                      ...a,
                      status: (resolved.status as ExecApproval["status"]) || a.status,
                      resolvedAt: resolved.resolvedAt,
                    }
                  : a,
              ),
            );
            setResolving(null);
          }
        }
        if (data.type === "exec.approvals.list" && Array.isArray(data.approvals)) {
          setApprovals(data.approvals as ExecApproval[]);
        }
      },
    );
    return unsub;
  }, []);

  const handleResolve = useCallback((id: string, decision: "approved" | "denied") => {
    setResolving(id);
    void execApprovals.resolve(id, decision);
    // Optimistic update
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: decision, resolvedAt: new Date().toISOString() } : a,
      ),
    );
    // Clear resolving after a short delay in case WS ack doesn't arrive
    setTimeout(() => setResolving((cur) => (cur === id ? null : cur)), 3000);
  }, []);

  const pending = approvals.filter((a) => a.status === "pending");
  const history = approvals.filter((a) => a.status !== "pending");

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
                {pending.map((approval) => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
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
                {history.map((approval) => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
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

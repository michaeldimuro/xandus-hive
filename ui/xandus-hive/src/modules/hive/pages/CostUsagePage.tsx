import {
  DollarSign,
  Calendar,
  TrendingUp,
  Database,
  AlertTriangle,
  Download,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { xandus } from "@/lib/openclaw-ws";
import { useOperationsStore } from "@/stores/operationsStore";
import { useTriggerStore } from "../stores/triggerStore";

const MAX_DAILY_COST = 12.0; // matches .env default
const ALERT_THRESHOLD = 0.8; // warn at 80%

interface DailyTotal {
  date: string;
  total_cost: number;
  total_input: number;
  total_output: number;
}

interface ModelBreakdown {
  model: string;
  total_cost: number;
  total_input: number;
  total_output: number;
  request_count: number;
}

interface CostSummaryData {
  today: number;
  week: number;
  month: number;
  allTime: number;
  dailyTotals: DailyTotal[];
  modelBreakdown: ModelBreakdown[];
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" });
  } catch {
    return dateStr;
  }
}

export default function CostUsagePage() {
  const [data, setData] = useState<CostSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const systemMetrics = useOperationsStore((s) => s.systemMetrics);
  const triggers = useTriggerStore((s) => s.triggers);
  const liveFeed = useOperationsStore((s) => s.liveFeed);

  useEffect(() => {
    let mounted = true;

    Promise.all([xandus.cost.summary(), xandus.cost.daily(), xandus.cost.models()])
      .then(([summaryRes, dailyRes, modelsRes]) => {
        if (!mounted) {
          return;
        }
        const summary = summaryRes as Record<string, unknown>;
        const daily = (dailyRes as Record<string, unknown>)?.dailyTotals as
          | DailyTotal[]
          | undefined;
        const models = (modelsRes as Record<string, unknown>)?.modelBreakdown as
          | ModelBreakdown[]
          | undefined;

        setData({
          today: Number(summary?.today ?? 0),
          week: Number(summary?.week ?? 0),
          month: Number(summary?.month ?? 0),
          allTime: Number(summary?.allTime ?? 0),
          dailyTotals: daily ?? [],
          modelBreakdown: models ?? [],
        });
        setError(null);
      })
      .catch((err) => {
        if (mounted) {
          const msg = err instanceof Error ? err.message : "Failed to load cost data";
          // xandus.cost.* methods are provided by the cost-aggregator plugin.
          // If methods are unknown, the plugin may not be loaded.
          setError(msg.includes("unknown method") ? "Cost aggregator plugin not loaded" : msg);
        }
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

  // Cost alert: use real-time dailyCost from system.metrics WS event
  const liveDailyCost = systemMetrics?.dailyCost ?? data?.today ?? 0;
  const costRatio = liveDailyCost / MAX_DAILY_COST;
  const showAlert = costRatio >= ALERT_THRESHOLD;

  // Trigger fire events from liveFeed
  const triggerCosts = useMemo(() => {
    const fires = liveFeed.filter((e) => e.type === "trigger.fired");
    const triggerMap = new Map<string, { name: string; fires: number }>();
    for (const fire of fires) {
      const tId = fire.payload?.triggerId as string;
      if (!tId) {
        continue;
      }
      const existing = triggerMap.get(tId);
      if (existing) {
        existing.fires++;
      } else {
        const trigger = triggers.find((t) => t.id === tId);
        triggerMap.set(tId, { name: trigger?.name || tId.slice(0, 8), fires: 1 });
      }
    }
    return Array.from(triggerMap.entries()).map(([id, info]) => ({ id, ...info }));
  }, [liveFeed, triggers]);

  const exportCsv = useCallback(() => {
    if (!data) {
      return;
    }
    const rows = [["Date", "Cost", "Input Tokens", "Output Tokens"]];
    for (const day of data.dailyTotals) {
      rows.push([
        day.date,
        day.total_cost.toFixed(4),
        String(day.total_input),
        String(day.total_output),
      ]);
    }
    rows.push([]);
    rows.push(["Model", "Cost", "Requests", "Input Tokens", "Output Tokens"]);
    for (const m of data.modelBreakdown) {
      rows.push([
        m.model,
        m.total_cost.toFixed(4),
        String(m.request_count),
        String(m.total_input),
        String(m.total_output),
      ]);
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cost-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const summaryCards = [
    {
      label: "Today",
      value: liveDailyCost,
      icon: DollarSign,
      color: "text-green-400 bg-green-500/10",
    },
    {
      label: "This Week",
      value: data?.week ?? 0,
      icon: Calendar,
      color: "text-blue-400 bg-blue-500/10",
    },
    {
      label: "This Month",
      value: data?.month ?? 0,
      icon: TrendingUp,
      color: "text-purple-400 bg-purple-500/10",
    },
    {
      label: "All Time",
      value: data?.allTime ?? 0,
      icon: Database,
      color: "text-orange-400 bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost & Usage</h1>
          <p className="text-muted-foreground text-sm">
            Token usage, cost analytics, and budget alerts.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Cost alert banner */}
      {showAlert && (
        <Card
          className={
            costRatio >= 1
              ? "border-red-500/40 bg-red-500/5"
              : "border-yellow-500/40 bg-yellow-500/5"
          }
        >
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle
              className={`h-5 w-5 ${costRatio >= 1 ? "text-red-400" : "text-yellow-400"}`}
            />
            <div>
              <p
                className={`text-sm font-medium ${costRatio >= 1 ? "text-red-400" : "text-yellow-400"}`}
              >
                {costRatio >= 1 ? "Daily cost limit reached!" : "Approaching daily cost limit"}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatCost(liveDailyCost)} of {formatCost(MAX_DAILY_COST)} (
                {Math.round(costRatio * 100)}%)
              </p>
            </div>
            <div className="ml-auto h-2 w-32 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${costRatio >= 1 ? "bg-red-500" : "bg-yellow-500"}`}
                style={{ width: `${Math.min(costRatio * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color.split(" ")[1]}`}
                >
                  <Icon className={`h-5 w-5 ${card.color.split(" ")[0]}`} />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium">{card.label}</p>
                  <p className="text-xl font-bold">{loading ? "--" : formatCost(card.value)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <Card className="border-red-500/20">
          <CardContent className="p-4">
            <p className="text-sm text-red-400">Failed to load cost data: {error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily spend table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Spend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : !data?.dailyTotals?.length ? (
              <p className="text-muted-foreground text-sm">No cost data recorded yet.</p>
            ) : (
              <div className="max-h-[480px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Input</TableHead>
                      <TableHead className="text-right">Output</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dailyTotals.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="text-sm">{formatDate(day.date)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCost(day.total_cost)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right text-xs">
                          {formatTokens(day.total_input)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right text-xs">
                          {formatTokens(day.total_output)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-Model Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : !data?.modelBreakdown?.length ? (
              <p className="text-muted-foreground text-sm">No model data available.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Input</TableHead>
                    <TableHead className="text-right">Output</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.modelBreakdown.map((model) => (
                    <TableRow key={model.model}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {model.model}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCost(model.total_cost)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right text-xs">
                        {model.request_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right text-xs">
                        {formatTokens(model.total_input)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right text-xs">
                        {formatTokens(model.total_output)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-trigger cost tracking */}
      {triggerCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Trigger Activity (This Session)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trigger</TableHead>
                  <TableHead className="text-right">Fires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triggerCosts.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{t.name}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{t.fires}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

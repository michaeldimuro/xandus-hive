import type { GatewayRequestHandlerOptions, OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

// ---------------------------------------------------------------------------
// Date range helpers
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

type DateRange = { startMs: number; endMs: number };

function parseDateRange(params: Record<string, unknown>): DateRange {
  const now = Date.now();
  const todayStart = now - (now % DAY_MS);

  // Parse startDate / endDate (YYYY-MM-DD strings)
  const startDate = typeof params?.startDate === "string" ? params.startDate.trim() : null;
  const endDate = typeof params?.endDate === "string" ? params.endDate.trim() : null;

  if (startDate && endDate) {
    const startMs = dateStringToMs(startDate);
    const endMs = dateStringToMs(endDate);
    if (startMs !== null && endMs !== null) {
      return { startMs, endMs: endMs + DAY_MS - 1 };
    }
  }

  // Parse days parameter
  const rawDays = params?.days;
  const days =
    typeof rawDays === "number" && Number.isFinite(rawDays) ? Math.max(1, Math.floor(rawDays)) : 30;

  const startMs = todayStart - (days - 1) * DAY_MS;
  const endMs = todayStart + DAY_MS - 1;
  return { startMs, endMs };
}

function dateStringToMs(dateStr: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    return null;
  }
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(ms) ? null : ms;
}

function sendError(respond: (ok: boolean, payload?: unknown) => void, err: unknown) {
  respond(false, { error: err instanceof Error ? err.message : String(err) });
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

const costAggregatorPlugin = {
  id: "xandus-cost-aggregator",
  name: "Xandus Cost Aggregator",
  description: "Gateway methods for cost summary, daily breakdown, and per-model cost analysis",
  configSchema: emptyPluginConfigSchema(),

  register(api: OpenClawPluginApi) {
    // -----------------------------------------------------------------------
    // xandus.cost.summary
    //
    // Accepts: { agentId?: string, days?: number, startDate?: string, endDate?: string }
    // Returns aggregated cost/token data for the given agent and time range.
    // -----------------------------------------------------------------------
    api.registerGatewayMethod(
      "xandus.cost.summary",
      async ({ params, respond }: GatewayRequestHandlerOptions) => {
        try {
          const { loadCostUsageSummary, discoverAllSessions, loadSessionCostSummary } =
            await import("../../src/infra/session-cost-usage.js");
          const { loadConfig } = await import("../../src/config/config.js");
          const { listAgentIds } = await import("../../src/agents/agent-scope.js");

          const config = loadConfig();
          const { startMs, endMs } = parseDateRange(params ?? {});
          const agentId =
            typeof params?.agentId === "string" && params.agentId.trim()
              ? params.agentId.trim()
              : null;

          if (agentId) {
            // Per-agent summary: scan that agent's sessions
            const summary = await loadCostUsageSummary({
              startMs,
              endMs,
              config,
              agentId,
            });
            respond(true, { agentId, ...summary });
            return;
          }

          // All-agents summary: aggregate across all agents
          const agents = listAgentIds(config);
          const agentSummaries: Array<{
            agentId: string;
            totalCost: number;
            totalTokens: number;
            input: number;
            output: number;
          }> = [];
          let grandTotalCost = 0;
          let grandTotalTokens = 0;
          let grandInput = 0;
          let grandOutput = 0;
          let grandCacheRead = 0;
          let grandCacheWrite = 0;

          for (const agId of agents) {
            const summary = await loadCostUsageSummary({
              startMs,
              endMs,
              config,
              agentId: agId,
            });
            agentSummaries.push({
              agentId: agId,
              totalCost: summary.totals.totalCost,
              totalTokens: summary.totals.totalTokens,
              input: summary.totals.input,
              output: summary.totals.output,
            });
            grandTotalCost += summary.totals.totalCost;
            grandTotalTokens += summary.totals.totalTokens;
            grandInput += summary.totals.input;
            grandOutput += summary.totals.output;
            grandCacheRead += summary.totals.cacheRead;
            grandCacheWrite += summary.totals.cacheWrite;
          }

          respond(true, {
            updatedAt: Date.now(),
            startMs,
            endMs,
            totals: {
              totalCost: grandTotalCost,
              totalTokens: grandTotalTokens,
              input: grandInput,
              output: grandOutput,
              cacheRead: grandCacheRead,
              cacheWrite: grandCacheWrite,
            },
            byAgent: agentSummaries.sort((a, b) => b.totalCost - a.totalCost),
          });
        } catch (err) {
          sendError(respond, err);
        }
      },
    );

    // -----------------------------------------------------------------------
    // xandus.cost.daily
    //
    // Accepts: { agentId?: string, days?: number, startDate?: string, endDate?: string }
    // Returns daily cost breakdown, optionally filtered by agent.
    // -----------------------------------------------------------------------
    api.registerGatewayMethod(
      "xandus.cost.daily",
      async ({ params, respond }: GatewayRequestHandlerOptions) => {
        try {
          const { loadCostUsageSummary } = await import("../../src/infra/session-cost-usage.js");
          const { loadConfig } = await import("../../src/config/config.js");
          const { listAgentIds } = await import("../../src/agents/agent-scope.js");

          const config = loadConfig();
          const { startMs, endMs } = parseDateRange(params ?? {});
          const agentId =
            typeof params?.agentId === "string" && params.agentId.trim()
              ? params.agentId.trim()
              : null;

          if (agentId) {
            const summary = await loadCostUsageSummary({
              startMs,
              endMs,
              config,
              agentId,
            });
            respond(true, {
              agentId,
              daily: summary.daily,
            });
            return;
          }

          // Aggregate daily breakdown by agent
          const agents = listAgentIds(config);
          const dailyByAgent: Array<{
            agentId: string;
            daily: Array<{
              date: string;
              totalCost: number;
              totalTokens: number;
              input: number;
              output: number;
            }>;
          }> = [];

          // Also build a combined daily view
          const combinedDailyMap = new Map<
            string,
            { date: string; totalCost: number; totalTokens: number; input: number; output: number }
          >();

          for (const agId of agents) {
            const summary = await loadCostUsageSummary({
              startMs,
              endMs,
              config,
              agentId: agId,
            });

            const dailyEntries = summary.daily.map((day) => ({
              date: day.date,
              totalCost: day.totalCost,
              totalTokens: day.totalTokens,
              input: day.input,
              output: day.output,
            }));

            dailyByAgent.push({
              agentId: agId,
              daily: dailyEntries,
            });

            for (const day of summary.daily) {
              const existing = combinedDailyMap.get(day.date) ?? {
                date: day.date,
                totalCost: 0,
                totalTokens: 0,
                input: 0,
                output: 0,
              };
              existing.totalCost += day.totalCost;
              existing.totalTokens += day.totalTokens;
              existing.input += day.input;
              existing.output += day.output;
              combinedDailyMap.set(day.date, existing);
            }
          }

          const combinedDaily = Array.from(combinedDailyMap.values()).sort((a, b) =>
            a.date.localeCompare(b.date),
          );

          respond(true, {
            updatedAt: Date.now(),
            daily: combinedDaily,
            byAgent: dailyByAgent,
          });
        } catch (err) {
          sendError(respond, err);
        }
      },
    );

    // -----------------------------------------------------------------------
    // xandus.cost.models
    //
    // Accepts: { agentId?: string, days?: number, startDate?: string, endDate?: string }
    // Returns cost breakdown by model/provider.
    // -----------------------------------------------------------------------
    api.registerGatewayMethod(
      "xandus.cost.models",
      async ({ params, respond }: GatewayRequestHandlerOptions) => {
        try {
          const { discoverAllSessions, loadSessionCostSummary } =
            await import("../../src/infra/session-cost-usage.js");
          const { loadConfig } = await import("../../src/config/config.js");
          const { listAgentIds } = await import("../../src/agents/agent-scope.js");

          const config = loadConfig();
          const { startMs, endMs } = parseDateRange(params ?? {});
          const agentId =
            typeof params?.agentId === "string" && params.agentId.trim()
              ? params.agentId.trim()
              : null;

          // Determine which agents to scan
          const agentIds = agentId ? [agentId] : listAgentIds(config);

          type ModelBucket = {
            provider: string;
            model: string;
            count: number;
            totalCost: number;
            totalTokens: number;
            input: number;
            output: number;
            cacheRead: number;
            cacheWrite: number;
          };

          const modelMap = new Map<string, ModelBucket>();

          for (const agId of agentIds) {
            const sessions = await discoverAllSessions({
              agentId: agId,
              startMs,
              endMs,
            });

            for (const session of sessions) {
              const summary = await loadSessionCostSummary({
                sessionId: session.sessionId,
                sessionFile: session.sessionFile,
                config,
                agentId: agId,
                startMs,
                endMs,
              });

              if (!summary?.modelUsage) {
                continue;
              }

              for (const mu of summary.modelUsage) {
                const key = `${mu.provider ?? "unknown"}::${mu.model ?? "unknown"}`;
                const existing = modelMap.get(key) ?? {
                  provider: mu.provider ?? "unknown",
                  model: mu.model ?? "unknown",
                  count: 0,
                  totalCost: 0,
                  totalTokens: 0,
                  input: 0,
                  output: 0,
                  cacheRead: 0,
                  cacheWrite: 0,
                };
                existing.count += mu.count;
                existing.totalCost += mu.totals.totalCost;
                existing.totalTokens += mu.totals.totalTokens;
                existing.input += mu.totals.input;
                existing.output += mu.totals.output;
                existing.cacheRead += mu.totals.cacheRead;
                existing.cacheWrite += mu.totals.cacheWrite;
                modelMap.set(key, existing);
              }
            }
          }

          const models = Array.from(modelMap.values()).sort((a, b) => b.totalCost - a.totalCost);

          respond(true, {
            updatedAt: Date.now(),
            startMs,
            endMs,
            models,
          });
        } catch (err) {
          sendError(respond, err);
        }
      },
    );

    api.logger.info("[xandus-cost-aggregator] registered gateway methods");
  },
};

export default costAggregatorPlugin;

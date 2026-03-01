import type { GatewayRequestHandlerOptions, OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

// ---------------------------------------------------------------------------
// Supabase REST API helpers
// ---------------------------------------------------------------------------

type SupabaseEnv = {
  url: string;
  serviceKey: string;
};

function resolveSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !serviceKey) {
    return null;
  }
  return { url, serviceKey };
}

function buildHeaders(env: SupabaseEnv): Record<string, string> {
  return {
    apikey: env.serviceKey,
    Authorization: `Bearer ${env.serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

type QueryFilter = {
  column: string;
  operator?: string;
  value: string | number | boolean;
};

function buildQueryString(params: {
  filters?: QueryFilter[];
  select?: string;
  limit?: number;
  offset?: number;
  order?: string;
}): string {
  const parts: string[] = [];
  if (params.select) {
    parts.push(`select=${encodeURIComponent(params.select)}`);
  }
  if (params.filters) {
    for (const f of params.filters) {
      const op = f.operator ?? "eq";
      parts.push(`${encodeURIComponent(f.column)}=${op}.${encodeURIComponent(String(f.value))}`);
    }
  }
  if (typeof params.limit === "number" && Number.isFinite(params.limit)) {
    parts.push(`limit=${params.limit}`);
  }
  if (typeof params.offset === "number" && Number.isFinite(params.offset)) {
    parts.push(`offset=${params.offset}`);
  }
  if (params.order) {
    parts.push(`order=${encodeURIComponent(params.order)}`);
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

// Validate table name to prevent injection (alphanumeric, underscores, hyphens)
function isValidTableName(name: unknown): name is string {
  return typeof name === "string" && /^[a-zA-Z_][a-zA-Z0-9_-]{0,62}$/.test(name);
}

function sendError(respond: (ok: boolean, payload?: unknown) => void, err: unknown) {
  respond(false, { error: err instanceof Error ? err.message : String(err) });
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

const supabaseProxyPlugin = {
  id: "xandus-supabase-proxy",
  name: "Xandus Supabase Proxy",
  description: "Gateway methods for querying, upserting, and deleting Supabase data via REST API",
  configSchema: emptyPluginConfigSchema(),

  register(api: OpenClawPluginApi) {
    // -----------------------------------------------------------------------
    // xandus.supabase.query
    // -----------------------------------------------------------------------
    api.registerGatewayMethod(
      "xandus.supabase.query",
      async ({ params, respond }: GatewayRequestHandlerOptions) => {
        try {
          const env = resolveSupabaseEnv();
          if (!env) {
            respond(false, { error: "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set" });
            return;
          }

          const table = params?.table;
          if (!isValidTableName(table)) {
            respond(false, { error: "invalid or missing table name" });
            return;
          }

          const filters = Array.isArray(params?.filters) ? (params.filters as QueryFilter[]) : [];
          const select = typeof params?.select === "string" ? params.select : "*";
          const limit =
            typeof params?.limit === "number" && Number.isFinite(params.limit)
              ? Math.min(Math.max(1, Math.floor(params.limit)), 1000)
              : 100;
          const offset =
            typeof params?.offset === "number" && Number.isFinite(params.offset)
              ? Math.max(0, Math.floor(params.offset))
              : 0;
          const order = typeof params?.order === "string" ? params.order : undefined;

          const qs = buildQueryString({ filters, select, limit, offset, order });
          const url = `${env.url}/rest/v1/${encodeURIComponent(table)}${qs}`;

          const res = await fetch(url, {
            method: "GET",
            headers: buildHeaders(env),
          });

          if (!res.ok) {
            const body = await res.text().catch(() => "");
            respond(false, {
              error: `Supabase query failed: ${res.status} ${res.statusText}`,
              detail: body,
            });
            return;
          }

          const data = await res.json();
          respond(true, { data });
        } catch (err) {
          sendError(respond, err);
        }
      },
    );

    // -----------------------------------------------------------------------
    // xandus.supabase.upsert
    // -----------------------------------------------------------------------
    api.registerGatewayMethod(
      "xandus.supabase.upsert",
      async ({ params, respond }: GatewayRequestHandlerOptions) => {
        try {
          const env = resolveSupabaseEnv();
          if (!env) {
            respond(false, { error: "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set" });
            return;
          }

          const table = params?.table;
          if (!isValidTableName(table)) {
            respond(false, { error: "invalid or missing table name" });
            return;
          }

          const data = params?.data;
          if (!data || typeof data !== "object") {
            respond(false, { error: "data must be a non-null object" });
            return;
          }

          // Support single object or array of objects
          const body = Array.isArray(data) ? data : [data];
          if (body.length === 0) {
            respond(false, { error: "data array must not be empty" });
            return;
          }

          // Determine merge/resolution column (default: "id")
          const onConflict =
            typeof params?.onConflict === "string" ? params.onConflict.trim() : "id";

          const headers = buildHeaders(env);
          headers["Prefer"] = "return=representation,resolution=merge-duplicates";

          const url = `${env.url}/rest/v1/${encodeURIComponent(table)}?on_conflict=${encodeURIComponent(onConflict)}`;

          const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const respBody = await res.text().catch(() => "");
            respond(false, {
              error: `Supabase upsert failed: ${res.status} ${res.statusText}`,
              detail: respBody,
            });
            return;
          }

          const result = await res.json();
          respond(true, { data: result });
        } catch (err) {
          sendError(respond, err);
        }
      },
    );

    // -----------------------------------------------------------------------
    // xandus.supabase.delete
    // -----------------------------------------------------------------------
    api.registerGatewayMethod(
      "xandus.supabase.delete",
      async ({ params, respond }: GatewayRequestHandlerOptions) => {
        try {
          const env = resolveSupabaseEnv();
          if (!env) {
            respond(false, { error: "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set" });
            return;
          }

          const table = params?.table;
          if (!isValidTableName(table)) {
            respond(false, { error: "invalid or missing table name" });
            return;
          }

          const id = params?.id;
          if (id === undefined || id === null || id === "") {
            respond(false, { error: "id is required" });
            return;
          }

          // Determine the ID column name (default: "id")
          const idColumn =
            typeof params?.idColumn === "string" && params.idColumn.trim()
              ? params.idColumn.trim()
              : "id";

          const headers = buildHeaders(env);
          headers["Prefer"] = "return=representation";

          const url = `${env.url}/rest/v1/${encodeURIComponent(table)}?${encodeURIComponent(idColumn)}=eq.${encodeURIComponent(String(id))}`;

          const res = await fetch(url, {
            method: "DELETE",
            headers,
          });

          if (!res.ok) {
            const body = await res.text().catch(() => "");
            respond(false, {
              error: `Supabase delete failed: ${res.status} ${res.statusText}`,
              detail: body,
            });
            return;
          }

          const result = await res.json();
          respond(true, { deleted: result });
        } catch (err) {
          sendError(respond, err);
        }
      },
    );

    api.logger.info("[xandus-supabase-proxy] registered gateway methods");
  },
};

export default supabaseProxyPlugin;

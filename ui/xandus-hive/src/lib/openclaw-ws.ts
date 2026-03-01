/**
 * OpenClaw WebSocket client for Xandus Hive dashboard.
 *
 * Connects to the OpenClaw gateway using protocol v3.
 * Handles connect challenge, authentication, reconnection,
 * and provides typed methods for all gateway operations.
 */

// --- Frame Types ---

export type RequestFrame = {
  type: "req";
  id: string;
  method: string;
  params?: unknown;
};

export type ResponseFrame = {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code: string; message: string; details?: unknown };
};

export type EventFrame = {
  type: "event";
  event: string;
  payload?: unknown;
  seq?: number;
  stateVersion?: { presence?: number; health?: number };
};

export type HelloOk = {
  type: "hello-ok";
  protocol: number;
  server?: { version?: string; connId?: string };
  features?: { methods?: string[]; events?: string[] };
  snapshot?: unknown;
  auth?: {
    deviceToken?: string;
    role?: string;
    scopes?: string[];
    issuedAtMs?: number;
  };
  policy?: {
    maxPayload?: number;
    maxBufferedBytes?: number;
    tickIntervalMs?: number;
  };
};

// --- Client Types ---

type EventHandler = (event: string, payload: unknown) => void;

type Pending = {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
};

export type ConnectionState = "disconnected" | "connecting" | "connected";

export type OpenClawClientConfig = {
  url?: string;
  token?: string;
  password?: string;
  clientName?: string;
  onStateChange?: (state: ConnectionState) => void;
  onEvent?: EventHandler;
  onHello?: (hello: HelloOk) => void;
  onError?: (error: string) => void;
};

// --- Client Implementation ---

let ws: WebSocket | null = null;
let config: OpenClawClientConfig = {};
let state: ConnectionState = "disconnected";
let hello: HelloOk | null = null;
let lastSeq: number | null = null;

const pending = new Map<string, Pending>();
const eventHandlers: EventHandler[] = [];

let __wsConnectNonce: string | null = null;
let connectSent = false;
let connectTimer: ReturnType<typeof setTimeout> | null = null;
let backoffMs = 800;
let stopped = false;

function setState(next: ConnectionState) {
  if (state !== next) {
    state = next;
    config.onStateChange?.(next);
    const connected = next === "connected";
    for (const handler of statusChangeHandlers) {
      try {
        handler(connected);
      } catch {
        /* ignore */
      }
    }
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

function flushPending(err: Error) {
  for (const [, p] of pending) {
    p.reject(err);
  }
  pending.clear();
}

function scheduleReconnect() {
  if (stopped) {
    return;
  }
  const delay = backoffMs;
  backoffMs = Math.min(backoffMs * 1.7, 15_000);
  setTimeout(() => doConnect(), delay);
}

function sendConnectFrame() {
  if (connectSent || !ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }
  connectSent = true;
  if (connectTimer !== null) {
    clearTimeout(connectTimer);
    connectTimer = null;
  }

  const auth =
    config.token || config.password
      ? { token: config.token, password: config.password }
      : undefined;

  const params = {
    minProtocol: 3,
    maxProtocol: 3,
    client: {
      id: config.clientName ?? "xandus-hive",
      version: "1.0.0",
      platform: navigator?.platform ?? "web",
      mode: "ui",
    },
    role: "operator",
    scopes: ["operator.admin", "operator.approvals", "operator.pairing"],
    caps: [],
    auth,
    userAgent: navigator?.userAgent,
    locale: navigator?.language,
  };

  request<HelloOk>("connect", params)
    .then((h) => {
      backoffMs = 800;
      hello = h;
      setState("connected");
      config.onHello?.(h);
    })
    .catch(() => {
      ws?.close(4008, "connect failed");
    });
}

function handleMessage(raw: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  const frame = parsed as { type?: unknown };

  // Event frame
  if (frame.type === "event") {
    const evt = parsed as EventFrame;

    // Handle connect challenge
    if (evt.event === "connect.challenge") {
      const payload = evt.payload as { nonce?: string } | undefined;
      if (payload?.nonce) {
        _wsConnectNonce = payload.nonce;
        sendConnectFrame();
      }
      return;
    }

    // Sequence gap detection
    const seq = typeof evt.seq === "number" ? evt.seq : null;
    if (seq !== null && lastSeq !== null && seq > lastSeq + 1) {
      config.onError?.(`event gap: expected seq ${String(lastSeq + 1)}, got ${String(seq)}`);
    }
    if (seq !== null) {
      lastSeq = seq;
    }

    // Dispatch to handlers
    config.onEvent?.(evt.event, evt.payload);
    for (const handler of eventHandlers) {
      try {
        handler(evt.event, evt.payload);
      } catch (err) {
        console.error("[openclaw-ws] event handler error:", err);
      }
    }
    return;
  }

  // Response frame
  if (frame.type === "res") {
    const res = parsed as ResponseFrame;
    const p = pending.get(res.id);
    if (!p) {
      return;
    }
    pending.delete(res.id);
    if (res.ok) {
      p.resolve(res.payload);
    } else {
      const msg = res.error?.message ?? "request failed";
      const code = res.error?.code ?? "UNAVAILABLE";
      p.reject(new Error(`[${code}] ${msg}`));
    }
  }
}

function doConnect() {
  if (stopped) {
    return;
  }
  setState("connecting");

  const url = config.url || `ws://${window.location.host}`;
  ws = new WebSocket(url);
  _wsConnectNonce = null;
  connectSent = false;

  ws.addEventListener("open", () => {
    // Wait for connect.challenge event; queue timeout fallback
    if (connectTimer !== null) {
      clearTimeout(connectTimer);
    }
    connectTimer = setTimeout(() => sendConnectFrame(), 750);
  });

  ws.addEventListener("message", (ev) => handleMessage(String(ev.data ?? "")));

  ws.addEventListener("close", () => {
    ws = null;
    hello = null;
    _wsConnectNonce = null;
    connectSent = false;
    flushPending(new Error("gateway disconnected"));
    setState("disconnected");
    scheduleReconnect();
  });

  ws.addEventListener("error", () => {
    // close handler will fire
  });
}

// --- Public API ---

export function connect(cfgOrToken?: OpenClawClientConfig | string): void {
  if (typeof cfgOrToken === "string") {
    config = { token: cfgOrToken };
  } else {
    config = cfgOrToken ?? {};
  }
  stopped = false;
  backoffMs = 800;
  lastSeq = null;
  doConnect();
}

export function disconnect(): void {
  stopped = true;
  if (connectTimer !== null) {
    clearTimeout(connectTimer);
  }
  ws?.close();
  ws = null;
  hello = null;
  flushPending(new Error("client stopped"));
  setState("disconnected");
}

export function getState(): ConnectionState {
  return state;
}

export function getHello(): HelloOk | null {
  return hello;
}

export function isConnected(): boolean {
  return state === "connected" && ws?.readyState === WebSocket.OPEN;
}

export function request<T = unknown>(method: string, params?: unknown): Promise<T> {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error("gateway not connected"));
  }
  const id = generateId();
  const frame: RequestFrame = { type: "req", id, method, params };
  const p = new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: (v) => resolve(v as T), reject });
  });
  ws.send(JSON.stringify(frame));
  return p;
}

export function onEvent(
  handlerOrEvent: EventHandler | string,
  cb?: (payload: Record<string, unknown>) => void,
): () => void {
  if (typeof handlerOrEvent === "string" && cb) {
    // Overload: onEvent("event.name", (payload) => { ... })
    const eventName = handlerOrEvent;
    const handler: EventHandler = (event, payload) => {
      if (event === eventName) {
        cb((payload ?? {}) as Record<string, unknown>);
      }
    };
    eventHandlers.push(handler);
    return () => {
      const idx = eventHandlers.indexOf(handler);
      if (idx >= 0) {
        eventHandlers.splice(idx, 1);
      }
    };
  }
  // Original: onEvent((event, payload) => { ... })
  const handler = handlerOrEvent as EventHandler;
  eventHandlers.push(handler);
  return () => {
    const idx = eventHandlers.indexOf(handler);
    if (idx >= 0) {
      eventHandlers.splice(idx, 1);
    }
  };
}

// Connection status change handler
const statusChangeHandlers: ((connected: boolean) => void)[] = [];

export function onStatusChange(handler: (connected: boolean) => void): () => void {
  statusChangeHandlers.push(handler);
  return () => {
    const idx = statusChangeHandlers.indexOf(handler);
    if (idx >= 0) {
      statusChangeHandlers.splice(idx, 1);
    }
  };
}

// --- Typed Convenience Methods ---

// Sessions
export const sessions = {
  list: () => request<{ sessions: unknown[] }>("sessions.list"),
  preview: (sessionKey: string) => request("sessions.preview", { sessionKey }),
  resolve: (sessionKey: string) => request("sessions.resolve", { sessionKey }),
  reset: (sessionKey: string) => request("sessions.reset", { sessionKey }),
  delete: (sessionKey: string) => request("sessions.delete", { sessionKey }),
  usage: () => request("sessions.usage"),
};

// Agent
export const agent = {
  send: (message: string, sessionKey?: string, agentId?: string) =>
    request("agent", { message, sessionKey, agentId }),
  identity: () => request("agent.identity.get"),
  wait: (sessionKey: string) => request("agent.wait", { sessionKey }),
};

// Chat (WebSocket-native chat)
export const chat = {
  history: (sessionKey?: string) => request("chat.history", { sessionKey }),
  send: (message: string, sessionKey?: string) => request("chat.send", { message, sessionKey }),
  abort: (runId?: string) => request("chat.abort", { runId }),
};

// Agents (Multi-Agent management)
export const agents = {
  list: () => request("agents.list"),
  create: (params: Record<string, unknown>) => request("agents.create", params),
  update: (agentId: string, params: Record<string, unknown>) =>
    request("agents.update", { agentId, ...params }),
  delete: (agentId: string) => request("agents.delete", { agentId }),
  files: {
    list: (agentId: string) => request("agents.files.list", { agentId }),
    get: (agentId: string, path: string) => request("agents.files.get", { agentId, path }),
    set: (agentId: string, path: string, content: string) =>
      request("agents.files.set", { agentId, path, content }),
  },
};

// Config
export const gatewayConfig = {
  get: () => request("config.get"),
  set: (key: string, value: unknown) => request("config.set", { key, value }),
  patch: (delta: Record<string, unknown>) => request("config.patch", { delta }),
  schema: () => request("config.schema"),
};

// Cron
export const cron = {
  list: () => request("cron.list"),
  status: () => request("cron.status"),
  add: (job: Record<string, unknown>) => request("cron.add", job),
  update: (jobId: string, job: Record<string, unknown>) =>
    request("cron.update", { id: jobId, ...job }),
  remove: (jobId: string) => request("cron.remove", { id: jobId }),
  run: (jobId: string) => request("cron.run", { id: jobId }),
  runs: (jobId: string) => request("cron.runs", { id: jobId }),
  toggle: (jobId: string, enabled: boolean) => request("cron.update", { id: jobId, enabled }),
};

// Models
export const models = {
  list: () => request("models.list"),
};

// Exec Approvals
export const execApprovals = {
  get: () => request("exec.approvals.get"),
  set: (policies: unknown) => request("exec.approvals.set", { policies }),
  resolve: (id: string, decision: "approve" | "deny") =>
    request("exec.approval.resolve", { id, decision }),
};

// Skills
export const skills = {
  status: () => request("skills.status"),
  list: () => request("skills.list"),
  bins: () => request("skills.bins"),
  get: (name: string, scope?: string) => request("skills.get", { name, scope }),
  install: (name: string) => request("skills.install", { name }),
  save: (name: string, scope: string, content: string) =>
    request("skills.save", { name, scope, content }),
  delete: (name: string, scope?: string) => request("skills.delete", { name, scope }),
  assign: (agentId: string, skillNames: string[]) =>
    request("skills.assign", { agentId, skills: skillNames }),
};

// Usage & Cost
export const usage = {
  status: () => request("usage.status"),
  cost: () => request("usage.cost"),
  logs: () => request("sessions.usage.logs"),
  timeseries: (params?: Record<string, unknown>) => request("sessions.usage.timeseries", params),
};

// Logs
export const logs = {
  tail: () => request("logs.tail"),
};

// Health
export const health = () => request("health");

// --- Custom Xandus Extensions ---

export const xandus = {
  console: {
    attach: (groupFolder: string) => request("xandus.console.attach", { groupFolder }),
    detach: (groupFolder: string) => request("xandus.console.detach", { groupFolder }),
  },
  supabase: {
    query: (table: string, filters?: Record<string, unknown>) =>
      request("xandus.supabase.query", { table, ...filters }),
    upsert: (table: string, data: unknown) => request("xandus.supabase.upsert", { table, data }),
    delete: (table: string, id: string) => request("xandus.supabase.delete", { table, id }),
  },
  agent: {
    listAgents: () => request("xandus.agent.listAgents"),
    readFile: (agentId: string, path: string) =>
      request<{ path: string; content: string }>("xandus.agent.readFile", { agentId, path }),
    writeFile: (agentId: string, path: string, content: string) =>
      request("xandus.agent.writeFile", { agentId, path, content }),
    listSkills: (agentId: string) => request("xandus.agent.listSkills", { agentId }),
  },
  cost: {
    summary: (agentId?: string, days?: number) => request("xandus.cost.summary", { agentId, days }),
    daily: (agentId?: string, days?: number) => request("xandus.cost.daily", { agentId, days }),
    models: (agentId?: string, days?: number) => request("xandus.cost.models", { agentId, days }),
  },
};

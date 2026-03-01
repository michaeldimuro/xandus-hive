/**
 * WebSocket client singleton for Xandus Hive.
 * Connects to core's /ws endpoint with reconnect logic.
 */

type MessageHandler = (event: Record<string, unknown>) => void;

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;
const handlers = new Set<MessageHandler>();
const statusHandlers = new Set<(connected: boolean) => void>();

// Store event listener references for cleanup
let handleOpen: (() => void) | null = null;
let handleMessage: ((event: MessageEvent) => void) | null = null;
let handleClose: (() => void) | null = null;
let handleError: (() => void) | null = null;

function getReconnectDelay(): number {
  return Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
}

export function onMessage(handler: MessageHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function onStatusChange(handler: (connected: boolean) => void): () => void {
  statusHandlers.add(handler);
  return () => statusHandlers.delete(handler);
}

export function send(data: Record<string, unknown>): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function isConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

export function connect(token?: string): void {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const url = token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL;

  try {
    ws = new WebSocket(url);
  } catch {
    scheduleReconnect(token);
    return;
  }

  handleOpen = () => {
    reconnectAttempts = 0;
    statusHandlers.forEach((h) => h(true));

    // Subscribe to all events
    send({ type: 'subscribe', channels: ['all'] });

    // Start heartbeat
    if (heartbeatTimer) {clearInterval(heartbeatTimer);}
    heartbeatTimer = setInterval(() => {
      send({ type: 'ping' });
    }, 25000);
  };

  handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      handlers.forEach((h) => h(data));
    } catch {
      // ignore parse errors
    }
  };

  handleClose = () => {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    statusHandlers.forEach((h) => h(false));
    ws = null;
    scheduleReconnect(token);
  };

  handleError = () => {
    // onclose will fire after onerror
  };

  ws.addEventListener('open', handleOpen);
  ws.addEventListener('message', handleMessage);
  ws.addEventListener('close', handleClose);
  ws.addEventListener('error', handleError);
}

function scheduleReconnect(token?: string): void {
  if (reconnectTimer) {return;}
  reconnectAttempts++;
  const delay = getReconnectDelay();
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect(token);
  }, delay);
}

export function disconnect(): void {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (ws) {
    // Remove event listeners before closing to prevent stale event processing
    if (handleMessage) {ws.removeEventListener('message', handleMessage);}
    if (handleOpen) {ws.removeEventListener('open', handleOpen);}
    if (handleClose) {ws.removeEventListener('close', handleClose);}
    if (handleError) {ws.removeEventListener('error', handleError);}
    ws.close();
    ws = null;
  }
  handleOpen = null;
  handleMessage = null;
  handleClose = null;
  handleError = null;
  reconnectAttempts = 0;
}

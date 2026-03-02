# Xandus Hive UI

A standalone dashboard for [OpenClaw](https://github.com/openclaw/openclaw). Connects to your OpenClaw gateway via WebSocket and provides real-time agent control, session management, approvals, skills, triggers, and more.

Runs alongside OpenClaw's built-in control UI as an alternative with additional features.

## Features

**Hive (Agent Control)**
- Command Center — real-time metrics, queue status, recent events
- Agents — create, manage, and monitor agents
- Sessions — view and manage agent sessions
- Approvals — approve/deny exec commands in real-time
- Skills — upload, edit, and assign skills to agents
- Triggers — create and manage cron-scheduled tasks
- Console — interactive agent control with streaming output
- Cost & Usage — model costs, daily spend, session logs

**Workspace**
- Kanban board with drag-and-drop
- Calendar, Notes, Done tasks archive

**Business Modules** (requires Supabase)
- Contracting — leads, subcontractors, voice calls
- Real Estate — properties, deal analysis, market data
- Finance — accounts, transactions, budgets

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (22+ recommended)
- A running [OpenClaw](https://github.com/openclaw/openclaw) gateway (default: `localhost:18789`)
- Your OpenClaw gateway token

## Setup

```bash
git clone <your-repo-url> xandux-hive-ui
cd xandux-hive-ui
cp .env.example .env
```

Edit `.env` and set your gateway token:

```bash
VITE_GATEWAY_TOKEN=your-gateway-token-here
```

Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The dashboard connects to your OpenClaw gateway automatically.

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_GATEWAY_URL` | No | `ws://localhost:18789` | OpenClaw gateway WebSocket URL |
| `VITE_GATEWAY_TOKEN` | Yes | — | Gateway authentication token |
| `VITE_SUPABASE_URL` | No | — | Supabase project URL (for business modules) |
| `VITE_SUPABASE_ANON_KEY` | No | — | Supabase anon key (for business modules) |

## Build for Production

```bash
npm run build
```

Output goes to `./dist/`. Serve with any static file server.

## Tech Stack

- React 19 + React Router 7
- Vite 7 + TypeScript 5.9
- Zustand 5 (state management)
- Tailwind CSS 4 + Shadcn UI
- OpenClaw WebSocket Protocol v3

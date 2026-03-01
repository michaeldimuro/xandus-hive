# Xandus Hive

An AI assistant platform built on [OpenClaw](https://github.com/openclaw/openclaw), extending the gateway with a custom React dashboard, Supabase integration, cost tracking, and agent workspace management.

Xandus Hive takes the multi-channel AI gateway provided by OpenClaw and adds a full-featured control dashboard, gateway extensions for database operations and cost analytics, and a curated library of agent skills.

## Architecture

```
+------------------------------------------------------+
|                    Xandus Hive                        |
|                                                       |
|  +------------------+    +-------------------------+  |
|  | OpenClaw Gateway |    | Xandus Dashboard        |  |
|  | (Node.js)        |    | (React + Vite + Tailwind)|  |
|  |                  |<-->| served at /control-ui    |  |
|  | - Agent runtime  |    +-------------------------+  |
|  | - Channel mgmt   |                                 |
|  | - Skill executor |    +-------------------------+  |
|  | - WS protocol    |    | Gateway Extensions      |  |
|  |                  |<-->| - supabase-proxy        |  |
|  |                  |    | - agent-editor          |  |
|  |                  |    | - cost-aggregator       |  |
|  +------------------+    +-------------------------+  |
|                                                       |
|  +--------------------------------------------------+ |
|  | Skills Library (60+ skills)                       | |
|  | web search, PDF gen, Supabase CRUD, calendar, ... | |
|  +--------------------------------------------------+ |
+------------------------------------------------------+
```

**OpenClaw Gateway** handles agent orchestration, messaging channels (Telegram, WhatsApp, Discord, Slack, and more), skill execution, and the WebSocket protocol.

**Xandus Dashboard** is a React 19 single-page application (Vite 7, Tailwind v4, shadcn/ui, Zustand 5) served as the gateway's control UI. It communicates with the gateway over WebSocket.

**Gateway Extensions** are OpenClaw plugins that register custom gateway methods, exposing Supabase database operations, agent workspace management, and cost analytics to the dashboard.

## Prerequisites

- **Node.js >= 22**
- **pnpm** (recommended; `corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker** (for containerized deployment)

## Setup

### 1. Clone and install

```bash
git clone <repo-url> xandus-hive
cd xandus-hive

pnpm install
```

### 2. Configure environment

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env
```

Key variables:

| Variable                    | Required              | Description                          |
| --------------------------- | --------------------- | ------------------------------------ |
| `ANTHROPIC_API_KEY`         | Yes                   | API key for Anthropic models         |
| `TELEGRAM_BOT_TOKEN`        | Yes                   | Telegram bot token (primary channel) |
| `SUPABASE_URL`              | For Supabase features | Supabase project URL                 |
| `SUPABASE_SERVICE_KEY`      | For Supabase features | Supabase service role key            |
| `BRAVE_SEARCH_API_KEY`      | For web search        | Brave Search API key                 |
| `OPENCLAW_GATEWAY_TOKEN`    | Recommended           | Token for gateway API authentication |
| `OPENCLAW_GATEWAY_PASSWORD` | Recommended           | Password for gateway web UI access   |
| `OPENCLAW_GATEWAY_PORT`     | No (default: 18789)   | Port the gateway listens on          |

### 3. Build the gateway

```bash
pnpm build
```

### 4. Build the dashboard

```bash
pnpm hive:build
```

This compiles the React dashboard and outputs it to `dist/control-ui/`, where the gateway automatically discovers and serves it.

## Running

### Local development

Run the gateway:

```bash
pnpm dev gateway
```

Run the dashboard dev server (with hot reload):

```bash
cd ui/xandus-hive
pnpm dev
```

### Docker deployment

The project includes a multi-stage Dockerfile and compose file for production deployment:

```bash
docker compose -f docker-compose.xandus-hive.yml up --build -d
```

This builds a single container image that:

1. Compiles the OpenClaw gateway from source
2. Builds the Xandus dashboard
3. Bundles everything into a Node.js 22 slim runtime image
4. Starts the gateway on port 18789

View logs:

```bash
docker compose -f docker-compose.xandus-hive.yml logs -f
```

Environment variables are passed through from the host or a `.env` file. The compose file mounts a `skills/` directory for persistent skill storage and a named volume for OpenClaw data.

## Gateway Extensions

Xandus Hive adds three OpenClaw gateway extensions, each registering custom gateway methods accessible over the WebSocket protocol:

### xandus-supabase-proxy

Proxies Supabase REST API operations through the gateway, so the dashboard and agents can query, upsert, and delete database records without exposing Supabase credentials to the client.

**Methods:** `xandus.supabase.query`, `xandus.supabase.upsert`, `xandus.supabase.delete`

### xandus-agent-editor

Provides workspace management for agents -- listing agents, reading and writing files in agent workspaces, and enumerating available skills. Used by the dashboard's agent detail and skills pages.

**Methods:** `xandus.agent.listAgents`, `xandus.agent.readFile`, `xandus.agent.writeFile`, `xandus.agent.listSkills`

### xandus-cost-aggregator

Aggregates token usage and cost data across agents and sessions, providing summary, daily breakdown, and per-model cost analytics.

**Methods:** `xandus.cost.summary`, `xandus.cost.daily`, `xandus.cost.models`

## Dashboard

The Xandus Hive dashboard is located at `ui/xandus-hive/` and is built with React 19, Vite 7, Tailwind v4, shadcn/ui components, and Zustand 5 for state management. It connects to the gateway over WebSocket.

### Hive module

- **Command Center** -- Overview dashboard with agent status, recent operations, and quick actions
- **Agents** -- List and manage agents; per-agent detail view with workspace file editor
- **Sessions** -- Browse and inspect agent sessions
- **Approvals** -- Review and approve/reject pending agent actions
- **Skills** -- View and manage the skill library
- **Triggers** -- Configure cron-based and event-driven triggers
- **Console** -- Live agent console with streaming output
- **Cost/Usage** -- Cost analytics with daily breakdown, per-model stats, and per-agent tracking
- **API Explorer** -- Interactive gateway method explorer

### Workspace module

- Task management with Kanban board
- Calendar integration
- Notes

### Additional modules

- **Synergy** -- Contracting management (leads, subcontractors, voice calls)
- **Real Estate** -- Property tracking, deal analysis, market data
- **Finance** -- Accounts, transactions, financial planning
- **Settings** -- Application and gateway configuration

## Skills

The `skills/` directory contains 60+ agent skills covering web search, PDF generation, Supabase CRUD operations, calendar management, note-taking, GitHub integration, Slack messaging, voice calls, weather, and more. Skills are markdown-defined instructions that agents load at runtime.

## Project Structure

```
xandus-hive/
  src/                          # OpenClaw gateway source
  extensions/
    xandus-supabase-proxy/      # Supabase REST proxy extension
    xandus-agent-editor/        # Agent workspace editor extension
    xandus-cost-aggregator/     # Cost analytics extension
    ...                         # Other OpenClaw extensions
  ui/xandus-hive/               # Xandus dashboard (React)
    src/
      modules/
        hive/                   # Agent management, console, cost, triggers
        workspace/              # Tasks, calendar, notes
        contracting/            # Leads, subcontractors
        realestate/             # Properties, deals, market data
        finance/                # Accounts, transactions, planning
        settings/               # Configuration
      lib/
        openclaw-ws.ts          # OpenClaw WebSocket client
      stores/                   # Zustand state stores
  skills/                       # Agent skill definitions
  Dockerfile.xandus-hive        # Multi-stage Docker build
  docker-compose.xandus-hive.yml # Docker Compose for deployment
```

## License

MIT

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOperationsStore } from '@/stores/operationsStore';
import { Activity, Bot, Circle } from 'lucide-react';
import type { OperationEvent } from '@/types/operations';

function formatDuration(startedAt: Date): string {
  const ms = Date.now() - new Date(startedAt).getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {return `${hours}h ${minutes % 60}m`;}
  if (minutes > 0) {return `${minutes}m ${seconds % 60}s`;}
  return `${seconds}s`;
}

function formatEventTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return '--';
  }
}

function getEventDescription(event: OperationEvent): string {
  const payload = event.payload || {};
  switch (event.type) {
    case 'agent.session.started':
      return `Session started for ${payload.groupFolder || 'unknown'}`;
    case 'agent.session.terminated':
      return `Session ended (${payload.outcome || 'unknown'})`;
    case 'agent.work_activity':
      if (payload.toolName) {return `Tool: ${payload.toolName}`;}
      if (payload.response) {return `Response: ${(payload.response as string).slice(0, 80)}...`;}
      return 'Agent activity';
    case 'trigger.fired':
      return `Trigger fired (${payload.status || 'unknown'})`;
    case 'task.executing':
      return 'Task executing';
    case 'task.completed':
      return 'Task completed';
    case 'task.failed':
      return `Task failed: ${payload.error || 'unknown'}`;
    default:
      return event.type;
  }
}

function getEventBadgeStyle(type: string): string {
  if (type.includes('started')) {return 'bg-green-500/10 text-green-400 border-green-500/20';}
  if (type.includes('terminated') || type.includes('failed')) {return 'bg-red-500/10 text-red-400 border-red-500/20';}
  if (type.includes('tool') || type.includes('work_activity')) {return 'bg-blue-500/10 text-blue-400 border-blue-500/20';}
  if (type.includes('trigger')) {return 'bg-purple-500/10 text-purple-400 border-purple-500/20';}
  return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
}

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  working: { color: 'bg-green-400', label: 'Working' },
  active: { color: 'bg-green-400', label: 'Active' },
  idle: { color: 'bg-zinc-400', label: 'Idle' },
  waiting: { color: 'bg-yellow-400', label: 'Waiting' },
};

export function AgentActivityPanel() {
  const mainAgent = useOperationsStore((s) => s.mainAgent);
  const subAgents = useOperationsStore((s) => s.subAgents);
  const liveFeed = useOperationsStore((s) => s.liveFeed);
  const recentEvents = liveFeed.slice(0, 20);

  const activeSubAgents = Object.values(subAgents).filter(
    (a) => a.status === 'active' || a.status === 'working'
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Main Agent Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" />
            Main Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mainAgent ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Circle
                    className={`h-2.5 w-2.5 fill-current ${
                      STATUS_STYLES[mainAgent.status]?.color || 'text-zinc-400'
                    }`}
                  />
                  <span className="font-medium">{mainAgent.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {STATUS_STYLES[mainAgent.status]?.label || mainAgent.status}
                  </Badge>
                </div>
                {mainAgent.status === 'working' && mainAgent.startedAt && (
                  <span className="text-muted-foreground text-xs">
                    {formatDuration(mainAgent.startedAt)}
                  </span>
                )}
              </div>
              {mainAgent.currentTask && (
                <p className="text-muted-foreground text-sm">
                  Current: <span className="text-foreground font-mono text-xs">{mainAgent.currentTask}</span>
                </p>
              )}
              {activeSubAgents.length > 0 && (
                <div className="border-t pt-2">
                  <p className="text-muted-foreground mb-1 text-xs font-medium">
                    Active Sub-agents ({activeSubAgents.length})
                  </p>
                  {activeSubAgents.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2 py-1">
                      <Circle className="h-2 w-2 fill-current text-blue-400" />
                      <span className="text-sm">{sub.name}</span>
                      <span className="text-muted-foreground text-xs">{sub.currentTask}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No agent activity. Waiting for sessions.</p>
          )}
        </CardContent>
      </Card>

      {/* Live Feed */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Live Feed
            {recentEvents.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {recentEvents.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[360px] px-6 pb-4">
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No events yet. Activity will appear here in real-time.
              </p>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-muted/30"
                  >
                    <span className="text-muted-foreground mt-0.5 shrink-0 text-xs font-mono">
                      {formatEventTime(event.timestamp)}
                    </span>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${getEventBadgeStyle(event.type)}`}>
                      {event.type.split('.').pop()}
                    </Badge>
                    <span className="text-sm leading-tight">
                      {getEventDescription(event)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

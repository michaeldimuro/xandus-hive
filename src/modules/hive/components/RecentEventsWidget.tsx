import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOperationsStore } from '@/stores/operationsStore';
import { Radio } from 'lucide-react';
import type { OperationEvent } from '@/types/operations';

function formatTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--';
  }
}

function getEventLabel(type: string): string {
  const parts = type.split('.');
  return parts[parts.length - 1] || type;
}

function getEventBrief(event: OperationEvent): string {
  const payload = event.payload || {};
  switch (event.type) {
    case 'agent.session.started':
      return `Started on ${payload.groupFolder || 'group'}`;
    case 'agent.session.terminated':
      return `Ended: ${payload.outcome || 'complete'}`;
    case 'agent.work_activity':
      if (payload.toolName) {return `Tool: ${payload.toolName}`;}
      if (payload.response) {return (payload.response as string).slice(0, 60);}
      return 'Activity';
    case 'trigger.fired':
      return `${payload.status || 'fired'}`;
    case 'task.executing':
      return 'Running task';
    case 'task.completed':
      return 'Task done';
    case 'task.failed':
      return `Error: ${((payload.error as string) || 'unknown').slice(0, 40)}`;
    default:
      return event.type;
  }
}

function getEventColor(type: string): string {
  if (type.includes('started')) {return 'bg-green-500/10 text-green-400 border-green-500/20';}
  if (type.includes('terminated') || type.includes('failed')) {return 'bg-red-500/10 text-red-400 border-red-500/20';}
  if (type.includes('trigger')) {return 'bg-purple-500/10 text-purple-400 border-purple-500/20';}
  if (type.includes('task')) {return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';}
  return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
}

export function RecentEventsWidget() {
  const liveFeed = useOperationsStore((s) => s.liveFeed);
  const recentEvents = liveFeed.slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4" />
          Recent Events
          {recentEvents.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recentEvents.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[240px] px-6 pb-4">
          {recentEvents.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No recent events.
            </p>
          ) : (
            <div className="space-y-1.5">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 rounded px-1.5 py-1 text-sm"
                >
                  <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                    {formatTime(event.timestamp)}
                  </span>
                  <Badge variant="outline" className={`shrink-0 text-[10px] ${getEventColor(event.type)}`}>
                    {getEventLabel(event.type)}
                  </Badge>
                  <span className="text-muted-foreground truncate text-xs">
                    {getEventBrief(event)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

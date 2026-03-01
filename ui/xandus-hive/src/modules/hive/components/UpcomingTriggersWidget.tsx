import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTriggerStore } from '../stores/triggerStore';
import { Zap } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  cron: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  webhook: 'bg-green-500/10 text-green-400 border-green-500/20',
  telegram: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  manual: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) {return 'Not scheduled';}
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) {return 'Overdue';}

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {return `in ${days}d ${hours % 24}h`;}
  if (hours > 0) {return `in ${hours}h ${minutes % 60}m`;}
  if (minutes > 0) {return `in ${minutes}m`;}
  return 'in <1m';
}

export function UpcomingTriggersWidget() {
  const triggers = useTriggerStore((s) => s.triggers);

  const upcoming = triggers
    .filter((t) => t.enabled && t.next_fire_at)
    .toSorted((a, b) => {
      const aTime = a.next_fire_at ? new Date(a.next_fire_at).getTime() : Infinity;
      const bTime = b.next_fire_at ? new Date(b.next_fire_at).getTime() : Infinity;
      return aTime - bTime;
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4" />
          Upcoming Triggers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">No upcoming triggers scheduled.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((trigger) => (
              <div
                key={trigger.id}
                className="flex items-center justify-between rounded-md bg-muted/30 px-2.5 py-2"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Badge variant="outline" className={`shrink-0 text-[10px] ${TYPE_COLORS[trigger.type] || ''}`}>
                    {trigger.type}
                  </Badge>
                  <span className="truncate text-sm">{trigger.name}</span>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatRelativeTime(trigger.next_fire_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

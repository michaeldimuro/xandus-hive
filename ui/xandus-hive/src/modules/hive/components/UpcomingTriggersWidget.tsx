import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTriggerStore } from "../stores/triggerStore";

function formatRelativeTime(iso: string | undefined): string {
  if (!iso) {
    return "Not scheduled";
  }
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) {
    return "Overdue";
  }

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `in ${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `in ${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `in ${minutes}m`;
  }
  return "in <1m";
}

export function UpcomingTriggersWidget() {
  const triggers = useTriggerStore((s) => s.triggers);

  const upcoming = triggers
    .filter((t) => t.enabled && t.nextRunAt)
    .toSorted((a, b) => {
      const aTime = a.nextRunAt ? new Date(a.nextRunAt).getTime() : Infinity;
      const bTime = b.nextRunAt ? new Date(b.nextRunAt).getTime() : Infinity;
      return aTime - bTime;
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4" />
          Upcoming Cron Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">No upcoming cron jobs scheduled.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((trigger) => (
              <div
                key={trigger.id}
                className="flex items-center justify-between rounded-md bg-muted/30 px-2.5 py-2"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-muted-foreground shrink-0 text-[10px] font-mono">
                    {trigger.schedule}
                  </span>
                  <span className="truncate text-sm">{trigger.name}</span>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatRelativeTime(trigger.nextRunAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOperationsStore } from '@/stores/operationsStore';
import { Layers, Circle } from 'lucide-react';

export function QueueStatusWidget() {
  const queueState = useOperationsStore((s) => s.queueState);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4" />
          Queue Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {queueState ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border p-2 text-center">
                <p className="text-lg font-bold text-green-400">
                  {queueState.activeCount}
                </p>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Active</p>
              </div>
              <div className="rounded-md border p-2 text-center">
                <p className="text-lg font-bold">
                  {queueState.maxConcurrent}
                </p>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Max</p>
              </div>
              <div className="rounded-md border p-2 text-center">
                <p className="text-lg font-bold text-yellow-400">
                  {queueState.waitingCount}
                </p>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Waiting</p>
              </div>
            </div>

            {queueState.groups.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">Active Groups</p>
                <div className="space-y-1.5">
                  {queueState.groups
                    .filter((g) => g.active)
                    .map((group) => (
                      <div
                        key={group.chatJid}
                        className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-1.5"
                      >
                        <Circle className="h-2 w-2 shrink-0 fill-current text-green-400" />
                        <span className="truncate text-sm font-mono">
                          {group.groupFolder || group.chatJid}
                        </span>
                        {group.containerName && (
                          <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                            {group.containerName.slice(0, 12)}
                          </Badge>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No queue data available.</p>
        )}
      </CardContent>
    </Card>
  );
}

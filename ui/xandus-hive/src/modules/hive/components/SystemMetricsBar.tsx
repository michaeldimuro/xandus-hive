import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOperationsStore } from '@/stores/operationsStore';
import { Clock, DollarSign, Container } from 'lucide-react';

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {return `${days}d ${hours}h ${minutes}m`;}
  if (hours > 0) {return `${hours}h ${minutes}m`;}
  return `${minutes}m`;
}

export function SystemMetricsBar() {
  const metrics = useOperationsStore((s) => s.systemMetrics);
  const isConnected = useOperationsStore((s) => s.isConnected);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium">Uptime</p>
            <p className="text-lg font-semibold">
              {metrics ? formatUptime(metrics.uptime) : '--'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium">Daily Cost</p>
            <p className="text-lg font-semibold">
              ${metrics ? metrics.dailyCost.toFixed(2) : '0.00'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Container className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium">Active Containers</p>
            <p className="text-lg font-semibold">
              {metrics ? metrics.containersActive : 0}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isConnected ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium">Connection</p>
            <Badge variant="outline" className={isConnected ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

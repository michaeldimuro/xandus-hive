import { SystemMetricsBar } from '../components/SystemMetricsBar';
import { AgentActivityPanel } from '../components/AgentActivityPanel';
import { QueueStatusWidget } from '../components/QueueStatusWidget';
import { UpcomingTriggersWidget } from '../components/UpcomingTriggersWidget';
import { RecentEventsWidget } from '../components/RecentEventsWidget';

export default function CommandCenterPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground text-sm">
            Real-time overview of agent activity, triggers, and system health.
          </p>
        </div>
      </div>

      <SystemMetricsBar />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2">
          <AgentActivityPanel />
        </div>

        {/* Right column - 1/3 width */}
        <div className="flex flex-col gap-4">
          <QueueStatusWidget />
          <UpcomingTriggersWidget />
          <RecentEventsWidget />
        </div>
      </div>
    </div>
  );
}

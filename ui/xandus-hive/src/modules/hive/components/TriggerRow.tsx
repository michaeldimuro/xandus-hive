import type { Trigger } from '@xandus/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Play } from 'lucide-react';
import { useTriggerStore } from '../stores/triggerStore';

const TYPE_COLORS: Record<string, string> = {
  cron: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  webhook: 'bg-green-500/10 text-green-400 border-green-500/20',
  telegram: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  manual: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function formatConfig(trigger: Trigger): string {
  const config = trigger.config as Record<string, unknown>;
  switch (trigger.type) {
    case 'cron': return (config.expression as string) || '-';
    case 'webhook': return `/api/hooks/${config.path || ''}`;
    case 'telegram': return (config.pattern as string) || '-';
    case 'manual': return 'On demand';
    default: return '-';
  }
}

function formatTime(iso: string | null): string {
  if (!iso) {return '-';}
  return new Date(iso).toLocaleString();
}

interface TriggerRowProps {
  trigger: Trigger;
  onEdit: (trigger: Trigger) => void;
}

export function TriggerRow({ trigger, onEdit }: TriggerRowProps) {
  const toggleTrigger = useTriggerStore((s) => s.toggleTrigger);
  const deleteTrigger = useTriggerStore((s) => s.deleteTrigger);
  const fireTrigger = useTriggerStore((s) => s.fireTrigger);

  return (
    <TableRow>
      <TableCell className="font-medium">{trigger.name}</TableCell>
      <TableCell>
        <Badge variant="outline" className={TYPE_COLORS[trigger.type] || ''}>
          {trigger.type}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs font-mono">
        {formatConfig(trigger)}
      </TableCell>
      <TableCell>
        <Switch
          checked={trigger.enabled}
          onCheckedChange={(checked) => toggleTrigger(trigger.id, checked)}
        />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{formatTime(trigger.last_fired_at)}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{formatTime(trigger.next_fire_at)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fireTrigger(trigger.id)} title="Fire now">
            <Play className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(trigger)} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTrigger(trigger.id)} title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

import { Pencil, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { useTriggerStore } from "../stores/triggerStore";
import type { CronJob } from "../types/cron";

function formatTime(iso: string | undefined): string {
  if (!iso) {
    return "-";
  }
  return new Date(iso).toLocaleString();
}

interface TriggerRowProps {
  trigger: CronJob;
  onEdit: (trigger: CronJob) => void;
}

export function TriggerRow({ trigger, onEdit }: TriggerRowProps) {
  const toggleTrigger = useTriggerStore((s) => s.toggleTrigger);
  const deleteTrigger = useTriggerStore((s) => s.deleteTrigger);
  const fireTrigger = useTriggerStore((s) => s.fireTrigger);

  return (
    <TableRow>
      <TableCell className="font-medium">{trigger.name}</TableCell>
      <TableCell className="text-muted-foreground text-xs font-mono">
        {trigger.schedule || "-"}
      </TableCell>
      <TableCell>
        <Switch
          checked={trigger.enabled}
          onCheckedChange={(checked) => toggleTrigger(trigger.id, checked)}
        />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatTime(trigger.lastRunAt)}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatTime(trigger.nextRunAt)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => fireTrigger(trigger.id)}
            title="Run now"
          >
            <Play className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(trigger)}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => deleteTrigger(trigger.id)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

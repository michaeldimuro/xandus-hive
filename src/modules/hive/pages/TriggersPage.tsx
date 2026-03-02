import { Plus, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TriggerFormDialog } from "../components/TriggerFormDialog";
import { TriggerRow } from "../components/TriggerRow";
import { useTriggerStore } from "../stores/triggerStore";
import type { CronJob } from "../types/cron";

export default function TriggersPage() {
  const triggers = useTriggerStore((s) => s.triggers);
  const loading = useTriggerStore((s) => s.loading);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<CronJob | null>(null);

  const handleCreate = () => {
    setEditingTrigger(null);
    setDialogOpen(true);
  };

  const handleEdit = (trigger: CronJob) => {
    setEditingTrigger(trigger);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cron Jobs</h1>
          <p className="text-muted-foreground text-sm">
            Manage scheduled cron jobs for agent automation.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            <span className="text-sm text-muted-foreground">Loading cron jobs...</span>
          </div>
        </div>
      ) : triggers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Zap className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No cron jobs configured</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Create your first cron job to automate agent tasks.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {triggers.map((trigger) => (
                <TriggerRow key={trigger.id} trigger={trigger} onEdit={handleEdit} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TriggerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} trigger={editingTrigger} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAgentStore } from "../stores/agentStore";
import { useTriggerStore } from "../stores/triggerStore";
import type { CronJob, CronJobCreate } from "../types/cron";

interface TriggerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: CronJob | null;
}

export function TriggerFormDialog({ open, onOpenChange, trigger }: TriggerFormDialogProps) {
  const createTrigger = useTriggerStore((s) => s.createTrigger);
  const updateTriggerData = useTriggerStore((s) => s.updateTriggerData);
  const agents = useAgentStore((s) => s.agents);

  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [prompt, setPrompt] = useState("");
  const [session, setSession] = useState("main");
  const [agentId, setAgentId] = useState<string>("");
  const [enabled, setEnabled] = useState(true);

  const isEdit = !!trigger;

  useEffect(() => {
    if (trigger) {
      setName(trigger.name);
      setSchedule(trigger.schedule);
      setPrompt(trigger.prompt);
      setSession(trigger.session || "main");
      setAgentId(trigger.agentId || "");
      setEnabled(trigger.enabled);
    } else {
      setName("");
      setSchedule("");
      setPrompt("");
      setSession("main");
      setAgentId("");
      setEnabled(true);
    }
  }, [trigger, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CronJobCreate = {
      name,
      schedule,
      prompt,
      session,
      agentId: agentId || undefined,
      enabled,
    };

    if (isEdit) {
      updateTriggerData(trigger.id, payload as unknown as Record<string, unknown>);
    } else {
      createTrigger(payload as unknown as Record<string, unknown>);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Cron Job" : "Create Cron Job"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the cron job configuration."
              : "Configure a new cron job to schedule agent tasks."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cron-name">Name</Label>
            <Input
              id="cron-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Daily report"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cron-schedule">Schedule (cron expression)</Label>
            <Input
              id="cron-schedule"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="0 9 * * *"
              required
              className="font-mono text-xs"
            />
            <p className="text-muted-foreground text-xs">
              e.g. &quot;0 9 * * *&quot; = every day at 9:00 AM, &quot;*/15 * * * *&quot; = every 15
              minutes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cron-prompt">Prompt</Label>
            <Textarea
              id="cron-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the prompt to send to the agent..."
              className="font-mono text-xs min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cron-session">Session</Label>
              <Input
                id="cron-session"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="main"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cron-agent">Agent (optional)</Label>
              <Select
                value={agentId || "__default__"}
                onValueChange={(v) => setAgentId(v === "__default__" ? "" : v)}
              >
                <SelectTrigger id="cron-agent">
                  <SelectValue placeholder="Default agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">Default agent</SelectItem>
                  {agents
                    .filter((a) => a.status === "active")
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !prompt.trim() || !schedule.trim()}>
              {isEdit ? "Save Changes" : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

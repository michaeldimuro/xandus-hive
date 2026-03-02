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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAgentStore } from "../stores/agentStore";
import type { AgentProfile } from "../types/agent";
import { modelDisplayName } from "../utils/model-names";

interface AgentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: AgentProfile | null;
}

const ROLES = ["orchestrator", "developer", "researcher", "assistant"] as const;
const MODELS = [
  "MiniMax-M2.5",
  "MiniMax-M2.5-highspeed",
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
] as const;

export function AgentFormDialog({ open, onOpenChange, agent }: AgentFormDialogProps) {
  const createAgent = useAgentStore((s) => s.createAgent);
  const updateAgentProfile = useAgentStore((s) => s.updateAgentProfile);

  const [name, setName] = useState("");
  const [role, setRole] = useState<string>(ROLES[3]);
  const [model, setModel] = useState<string>(MODELS[1]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [maxContextTokens, setMaxContextTokens] = useState(200000);
  const [status, setStatus] = useState<"active" | "disabled">("active");

  const isEdit = !!agent;

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setRole(agent.role);
      setModel(agent.model_preference);
      setSystemPrompt(agent.system_prompt || "");
      setMaxContextTokens(agent.max_context_tokens);
      setStatus(agent.status);
    } else {
      setName("");
      setRole(ROLES[3]);
      setModel(MODELS[1]);
      setSystemPrompt("");
      setMaxContextTokens(200000);
      setStatus("active");
    }
  }, [agent, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name,
      role,
      model_preference: model,
      system_prompt: systemPrompt || null,
      max_context_tokens: maxContextTokens,
    };

    if (isEdit) {
      payload.status = status;
      updateAgentProfile(agent.id, payload);
    } else {
      createAgent(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Agent" : "Create Agent"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the agent profile configuration." : "Configure a new agent profile."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Name</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="agent-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-model">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="agent-model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {modelDisplayName(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-prompt">System Prompt</Label>
            <Textarea
              id="agent-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter system prompt..."
              className="font-mono text-xs min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-tokens">Max Context Tokens</Label>
            <Input
              id="agent-tokens"
              type="number"
              value={maxContextTokens}
              onChange={(e) => setMaxContextTokens(Number(e.target.value))}
              min={1000}
              max={1000000}
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-3">
              <Switch
                id="agent-status"
                checked={status === "active"}
                onCheckedChange={(checked) => setStatus(checked ? "active" : "disabled")}
              />
              <Label htmlFor="agent-status">{status === "active" ? "Active" : "Disabled"}</Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEdit ? "Save Changes" : "Create Agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

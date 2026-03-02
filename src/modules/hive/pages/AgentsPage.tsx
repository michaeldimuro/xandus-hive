import { Plus, Bot } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentCard } from "../components/AgentCard";
import { AgentFormDialog } from "../components/AgentFormDialog";
import { useAgentStore } from "../stores/agentStore";
import type { AgentProfile } from "../types/agent";

export default function AgentsPage() {
  const agents = useAgentStore((s) => s.agents);
  const loading = useAgentStore((s) => s.loading);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentProfile | null>(null);

  const handleCreate = () => {
    setEditingAgent(null);
    setDialogOpen(true);
  };

  const handleEdit = (agent: AgentProfile) => {
    setEditingAgent(agent);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground text-sm">
            Manage agent profiles and their configurations.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            <span className="text-sm text-muted-foreground">Loading agents...</span>
          </div>
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bot className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No agents configured</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Create your first agent profile to get started.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <AgentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} agent={editingAgent} />
    </div>
  );
}

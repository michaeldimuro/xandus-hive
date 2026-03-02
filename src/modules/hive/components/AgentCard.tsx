import { Pencil, Cpu, Wrench, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAgentStore } from "../stores/agentStore";
import type { AgentProfile } from "../types/agent";
import { modelDisplayName } from "../utils/model-names";

interface AgentCardProps {
  agent: AgentProfile;
  onEdit: (agent: AgentProfile) => void;
}

export function AgentCard({ agent, onEdit }: AgentCardProps) {
  const navigate = useNavigate();
  const updateAgentProfile = useAgentStore((s) => s.updateAgentProfile);

  const handleToggleStatus = (checked: boolean) => {
    updateAgentProfile(agent.id, { status: checked ? "active" : "disabled" });
  };

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-muted-foreground/40"
      onClick={() => navigate(`/hive/agents/${agent.id}`)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-indigo-600 text-white text-sm font-semibold">
              {(agent.name || "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-semibold leading-none">{agent.name || "Unnamed Agent"}</p>
            <p className="text-xs text-muted-foreground">{agent.role}</p>
          </div>
        </div>
        <Badge
          variant={agent.status === "active" ? "default" : "secondary"}
          className={
            agent.status === "active"
              ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30 hover:bg-emerald-600/20"
              : "bg-muted text-muted-foreground"
          }
        >
          {agent.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Badge variant="outline" className="text-xs font-mono">
            {modelDisplayName(agent.model_preference)}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {(agent.skills || []).length} skills
          </span>
          <span className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            {(agent.mcp_tools || []).length} tools
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {(agent.groups || []).length} groups
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-2">
            <Switch
              checked={agent.status === "active"}
              onCheckedChange={handleToggleStatus}
              onClick={(e) => e.stopPropagation()}
              className="scale-75"
            />
            <span className="text-xs text-muted-foreground">
              {agent.status === "active" ? "Active" : "Disabled"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(agent);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

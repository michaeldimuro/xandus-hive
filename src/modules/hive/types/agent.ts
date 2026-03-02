/** Agent profile as returned by the OpenClaw agents.list method */
export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  model_preference: string;
  system_prompt: string | null;
  skills: string[];
  mcp_tools: string[];
  groups: string[];
  max_context_tokens: number;
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
}

export interface AgentProfileCreate {
  name: string;
  role: string;
  model_preference?: string;
  system_prompt?: string;
  skills?: string[];
  mcp_tools?: string[];
  groups?: string[];
  max_context_tokens?: number;
}

export interface AgentProfileUpdate extends Partial<AgentProfileCreate> {
  status?: "active" | "disabled";
}

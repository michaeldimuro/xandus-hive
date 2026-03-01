import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAgentStore } from '../stores/agentStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { modelDisplayName } from '../utils/model-names';
import { SkillAssignDialog } from '../components/SkillAssignDialog';
import { useSkillStore } from '../stores/skillStore';

const EMPTY_SKILLS: string[] = [];

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const agent = useAgentStore((s) => s.agents.find((a) => a.id === id));
  const updateAgentProfile = useAgentStore((s) => s.updateAgentProfile);
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt || '');
  const [promptDirty, setPromptDirty] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const allSkills = useSkillStore((s) => s.skills);
  const globalSkills = useMemo(() => allSkills.filter((sk) => sk.scope === 'global'), [allSkills]);
  const agentSkills = agent?.skills || EMPTY_SKILLS;

  useEffect(() => { useSkillStore.getState().fetchSkills(); }, []);

  if (!agent) {
    return (
      <div className="space-y-4">
        <Link to="/hive/agents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-lg font-medium">Agent not found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The agent profile could not be found. It may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  const handleSavePrompt = () => {
    updateAgentProfile(agent.id, { system_prompt: systemPrompt || null });
    setPromptDirty(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/hive/agents" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{agent.name || 'Unnamed Agent'}</h1>
          <p className="text-sm text-muted-foreground">{agent.role}</p>
        </div>
        <Badge
          className={
            agent.status === 'active'
              ? 'ml-2 bg-emerald-600/20 text-emerald-400 border-emerald-600/30 hover:bg-emerald-600/20'
              : 'ml-2 bg-muted text-muted-foreground'
          }
          variant={agent.status === 'active' ? 'default' : 'secondary'}
        >
          {agent.status}
        </Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="tools">MCP Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Role</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold capitalize">{agent.role}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Model</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="font-mono text-xs">{modelDisplayName(agent.model_preference)}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={agent.status === 'active' ? 'default' : 'secondary'}
                  className={
                    agent.status === 'active'
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30 hover:bg-emerald-600/20'
                      : ''
                  }
                >
                  {agent.status}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Max Context Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{(agent.max_context_tokens ?? 200000).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{new Date(agent.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{new Date(agent.updated_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(agentSkills).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">MCP Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(agent.mcp_tools || []).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(agent.groups || []).length}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value);
                  setPromptDirty(true);
                }}
                placeholder="Enter system prompt..."
                className="font-mono text-xs min-h-[300px]"
              />
              <div className="flex justify-end">
                <Button onClick={handleSavePrompt} disabled={!promptDirty}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Global Skills</CardTitle>
              <Badge variant="outline" className="bg-amber-600/20 text-amber-400 border-amber-600/30">
                Always Active
              </Badge>
            </CardHeader>
            <CardContent>
              {globalSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No global skills configured.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {globalSkills.map((skill) => (
                    <Badge key={skill.name} variant="secondary">{skill.name}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Assigned Skills</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
                Manage Skills
              </Button>
            </CardHeader>
            <CardContent>
              {(agentSkills).length === 0 ? (
                <p className="text-sm text-muted-foreground">No library skills assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(agentSkills).map((skill: string) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <SkillAssignDialog
            open={assignOpen}
            onOpenChange={setAssignOpen}
            agentId={agent.id}
            currentSkills={agentSkills}
          />
        </TabsContent>

        <TabsContent value="tools" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">MCP Tools</CardTitle>
            </CardHeader>
            <CardContent>
              {(agent.mcp_tools || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No MCP tools configured.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(agent.mcp_tools || []).map((tool: string) => (
                    <Badge key={tool} variant="outline">{tool}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { Trigger, TriggerType } from '@xandus/shared';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useTriggerStore } from '../stores/triggerStore';
import { useAgentStore } from '../stores/agentStore';

interface TriggerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: Trigger | null;
}

const TRIGGER_TYPES: TriggerType[] = ['cron', 'webhook', 'telegram', 'manual'];

export function TriggerFormDialog({ open, onOpenChange, trigger }: TriggerFormDialogProps) {
  const createTrigger = useTriggerStore((s) => s.createTrigger);
  const updateTriggerData = useTriggerStore((s) => s.updateTriggerData);
  const agents = useAgentStore((s) => s.agents);

  const [name, setName] = useState('');
  const [type, setType] = useState<TriggerType>('cron');
  const [agentId, setAgentId] = useState<string>('');
  const [groupFolder, setGroupFolder] = useState('main');
  const [chatJid, setChatJid] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [contextMode, setContextMode] = useState<'isolated' | 'group'>('isolated');

  // Type-specific config
  const [cronExpression, setCronExpression] = useState('');
  const [cronTimezone, setCronTimezone] = useState('');
  const [webhookPath, setWebhookPath] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookMethod, setWebhookMethod] = useState('');
  const [telegramGroupJid, setTelegramGroupJid] = useState('');
  const [telegramPattern, setTelegramPattern] = useState('');

  const isEdit = !!trigger;

  useEffect(() => {
    if (trigger) {
      setName(trigger.name);
      setType(trigger.type);
      setAgentId(trigger.agent_id || '');
      setGroupFolder(trigger.group_folder);
      setChatJid(trigger.chat_jid);
      setPromptTemplate(trigger.prompt_template);
      setContextMode(trigger.context_mode);
      const config = trigger.config as Record<string, unknown>;
      if (trigger.type === 'cron') {
        setCronExpression((config.expression as string) || '');
        setCronTimezone((config.timezone as string) || '');
      } else if (trigger.type === 'webhook') {
        setWebhookPath((config.path as string) || '');
        setWebhookSecret((config.secret as string) || '');
        setWebhookMethod((config.method as string) || '');
      } else if (trigger.type === 'telegram') {
        setTelegramGroupJid((config.group_jid as string) || '');
        setTelegramPattern((config.pattern as string) || '');
      }
    } else {
      setName('');
      setType('cron');
      setAgentId('');
      setGroupFolder('main');
      setChatJid('');
      setPromptTemplate('');
      setContextMode('isolated');
      setCronExpression('');
      setCronTimezone('');
      setWebhookPath('');
      setWebhookSecret('');
      setWebhookMethod('');
      setTelegramGroupJid('');
      setTelegramPattern('');
    }
  }, [trigger, open]);

  const buildConfig = (): Record<string, unknown> => {
    switch (type) {
      case 'cron':
        return { expression: cronExpression, ...(cronTimezone ? { timezone: cronTimezone } : {}) };
      case 'webhook':
        return { path: webhookPath, ...(webhookSecret ? { secret: webhookSecret } : {}), ...(webhookMethod ? { method: webhookMethod } : {}) };
      case 'telegram':
        return { group_jid: telegramGroupJid, pattern: telegramPattern };
      case 'manual':
      default:
        return {};
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name,
      type,
      agent_id: agentId || null,
      group_folder: groupFolder,
      chat_jid: chatJid,
      prompt_template: promptTemplate,
      config: buildConfig(),
      context_mode: contextMode,
    };

    if (isEdit) {
      updateTriggerData(trigger.id, payload);
    } else {
      createTrigger(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Trigger' : 'Create Trigger'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the trigger configuration.' : 'Configure a new trigger to wake an agent.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trigger-name">Name</Label>
            <Input id="trigger-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Daily report" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TriggerType)}>
              <SelectTrigger id="trigger-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-agent">Agent (optional)</Label>
            <Select value={agentId || '__default__'} onValueChange={(v) => setAgentId(v === '__default__' ? '' : v)}>
              <SelectTrigger id="trigger-agent"><SelectValue placeholder="Default (group agent)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">Default (group agent)</SelectItem>
                {agents.filter((a) => a.status === 'active').map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trigger-group">Group Folder</Label>
              <Input id="trigger-group" value={groupFolder} onChange={(e) => setGroupFolder(e.target.value)} placeholder="main" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trigger-jid">Chat JID</Label>
              <Input id="trigger-jid" value={chatJid} onChange={(e) => setChatJid(e.target.value)} placeholder="chat@telegram" required />
            </div>
          </div>

          {type === 'cron' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cron-expr">Cron Expression</Label>
                <Input id="cron-expr" value={cronExpression} onChange={(e) => setCronExpression(e.target.value)} placeholder="0 9 * * *" required className="font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cron-tz">Timezone</Label>
                <Input id="cron-tz" value={cronTimezone} onChange={(e) => setCronTimezone(e.target.value)} placeholder="America/New_York" />
              </div>
            </div>
          )}

          {type === 'webhook' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="wh-path">Webhook Path</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">/api/hooks/</span>
                  <Input id="wh-path" value={webhookPath} onChange={(e) => setWebhookPath(e.target.value)} placeholder="my-hook" required className="font-mono text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wh-secret">Secret (optional)</Label>
                  <Input id="wh-secret" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="hmac-secret" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wh-method">Method (optional)</Label>
                  <Input id="wh-method" value={webhookMethod} onChange={(e) => setWebhookMethod(e.target.value)} placeholder="POST" />
                </div>
              </div>
            </>
          )}

          {type === 'telegram' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tg-jid">Group JID</Label>
                <Input id="tg-jid" value={telegramGroupJid} onChange={(e) => setTelegramGroupJid(e.target.value)} placeholder="group@telegram" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tg-pattern">Pattern (regex)</Label>
                <Input id="tg-pattern" value={telegramPattern} onChange={(e) => setTelegramPattern(e.target.value)} placeholder="!report.*" required className="font-mono text-xs" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="trigger-prompt">Prompt Template</Label>
            <Textarea
              id="trigger-prompt" value={promptTemplate} onChange={(e) => setPromptTemplate(e.target.value)}
              placeholder="Enter the prompt to send to the agent..."
              className="font-mono text-xs min-h-[100px]" required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-context">Context Mode</Label>
            <Select value={contextMode} onValueChange={(v) => setContextMode(v as 'isolated' | 'group')}>
              <SelectTrigger id="trigger-context"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="isolated">Isolated (fresh session)</SelectItem>
                <SelectItem value="group">Group (continue session)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || !promptTemplate.trim()}>
              {isEdit ? 'Save Changes' : 'Create Trigger'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

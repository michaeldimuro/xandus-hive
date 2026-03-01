/**
 * HiveControlPanel — Live agent interfacing via WebSocket
 * Shows active sessions, queue state, system metrics, agent controls, and cron management.
 */

import { useState } from 'react';
import {
  Wifi,
  WifiOff,
  Play,
  Square,
  Send,
  Terminal,
  Cpu,
  Clock,
  DollarSign,
  Layers,
  CalendarClock,
  Joystick,
} from 'lucide-react';
import * as ws from '@/lib/websocket';
import { useOperationsStore } from '@/stores/operationsStore';
import { useHiveWebSocket } from '@/hooks/useHiveWebSocket';
import { AgentConsole } from './AgentConsole';
import { ActivityFeed } from './ActivityFeed';
import { CronManager } from './CronManager';

type Tab = 'control' | 'crons';

export function HiveControlPanel() {
  const { isConnected } = useHiveWebSocket();
  const queueState = useOperationsStore((s) => s.queueState);
  const systemMetrics = useOperationsStore((s) => s.systemMetrics);
  const mainAgent = useOperationsStore((s) => s.mainAgent);
  const liveFeed = useOperationsStore((s) => s.liveFeed);
  const taskCount = useOperationsStore((s) => s.scheduledTasks.length);

  const [tab, setTab] = useState<Tab>('control');
  const [consoleGroup, setConsoleGroup] = useState<string | null>(null);
  const [triggerJid, setTriggerJid] = useState('');
  const [triggerPrompt, setTriggerPrompt] = useState('');
  const [messageJid, setMessageJid] = useState('');
  const [messageText, setMessageText] = useState('');
  const [cancelJid, setCancelJid] = useState('');

  const handleTrigger = () => {
    if (!triggerJid || !triggerPrompt) {return;}
    ws.send({ type: 'agent.trigger', chatJid: triggerJid, prompt: triggerPrompt });
    setTriggerPrompt('');
  };

  const handleSendMessage = () => {
    if (!messageJid || !messageText) {return;}
    ws.send({ type: 'agent.send_message', chatJid: messageJid, text: messageText });
    setMessageText('');
  };

  const handleCancel = () => {
    if (!cancelJid) {return;}
    ws.send({ type: 'agent.cancel', chatJid: cancelJid });
  };

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <div className="border-b border-[#1e1e3a] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-white">Hive Control</h1>
              <p className="text-xs text-gray-500 mt-0.5">Real-time agent management via WebSocket</p>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg p-0.5">
              <button
                onClick={() => setTab('control')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                  tab === 'control'
                    ? 'bg-[#1a1a3a] text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Joystick size={13} />
                Control
              </button>
              <button
                onClick={() => setTab('crons')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                  tab === 'crons'
                    ? 'bg-[#1a1a3a] text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <CalendarClock size={13} />
                Crons
                {taskCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 font-mono">
                    {taskCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi size={16} className="text-green-400" />
                <span className="text-xs text-green-400">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-red-400" />
                <span className="text-xs text-red-400">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Metrics Row (always visible) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<Clock size={18} className="text-blue-400" />}
            label="Uptime"
            value={systemMetrics ? formatUptime(systemMetrics.uptime) : '--'}
          />
          <MetricCard
            icon={<Cpu size={18} className="text-emerald-400" />}
            label="Active Containers"
            value={queueState ? `${queueState.activeCount} / ${queueState.maxConcurrent}` : (systemMetrics ? String(systemMetrics.containersActive) : '--')}
          />
          <MetricCard
            icon={<Layers size={18} className="text-amber-400" />}
            label="Queue Waiting"
            value={queueState ? String(queueState.waitingCount) : '--'}
          />
          <MetricCard
            icon={<DollarSign size={18} className="text-purple-400" />}
            label="Daily Cost"
            value={systemMetrics ? `$${systemMetrics.dailyCost.toFixed(2)}` : '--'}
          />
        </div>

        {/* Tab Content */}
        {tab === 'control' && (
          <>
            {/* Main Agent Status */}
            {mainAgent && (
              <div className="bg-[#12122a] border border-[#1e1e3a] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${mainAgent.status === 'working' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                    <div>
                      <span className="text-sm font-medium text-white">{mainAgent.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {mainAgent.status === 'working' ? `Working on ${mainAgent.currentTask}` : 'Idle'}
                      </span>
                    </div>
                  </div>
                  {mainAgent.status === 'working' && mainAgent.currentTask && (
                    <button
                      onClick={() => setConsoleGroup(mainAgent.currentTask)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a3a] hover:bg-[#252550] rounded-lg transition-colors text-cyan-400"
                    >
                      <Terminal size={14} />
                      Attach Console
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column — Commands */}
              <div className="space-y-4">
                <CommandCard
                  title="Trigger Agent"
                  icon={<Play size={16} className="text-green-400" />}
                  description="Send a prompt to a group's agent"
                >
                  <input
                    type="text"
                    placeholder="Chat JID (e.g. tg:8498747072)"
                    value={triggerJid}
                    onChange={(e) => setTriggerJid(e.target.value)}
                    className="w-full bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                  />
                  <textarea
                    placeholder="Prompt..."
                    value={triggerPrompt}
                    onChange={(e) => setTriggerPrompt(e.target.value)}
                    rows={3}
                    className="w-full bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none resize-none"
                  />
                  <button
                    onClick={handleTrigger}
                    disabled={!triggerJid || !triggerPrompt || !isConnected}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play size={14} />
                    Trigger
                  </button>
                </CommandCard>

                <CommandCard
                  title="Send Message"
                  icon={<Send size={16} className="text-blue-400" />}
                  description="Send follow-up text to an active agent's stdin"
                >
                  <input
                    type="text"
                    placeholder="Chat JID"
                    value={messageJid}
                    onChange={(e) => setMessageJid(e.target.value)}
                    className="w-full bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Message text..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageJid || !messageText || !isConnected}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </CommandCard>

                <CommandCard
                  title="Cancel Agent"
                  icon={<Square size={16} className="text-red-400" />}
                  description="Kill an active container for a chat"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Chat JID"
                      value={cancelJid}
                      onChange={(e) => setCancelJid(e.target.value)}
                      className="flex-1 bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={handleCancel}
                      disabled={!cancelJid || !isConnected}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Square size={14} />
                      Kill
                    </button>
                  </div>
                </CommandCard>
              </div>

              {/* Right Column — Console + Feed */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Agent Console</h3>
                    {consoleGroup && (
                      <button
                        onClick={() => setConsoleGroup(null)}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Detach
                      </button>
                    )}
                  </div>
                  {!consoleGroup ? (
                    <div className="bg-[#12122a] border border-[#1e1e3a] rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Group folder to attach (e.g. main)"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                              setConsoleGroup((e.target as HTMLInputElement).value);
                            }
                          }}
                          className="flex-1 bg-[#0a0a1a] border border-[#1e1e3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                            if (input?.value) {setConsoleGroup(input.value);}
                          }}
                          className="px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm hover:bg-cyan-600/30 transition-colors"
                        >
                          <Terminal size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <AgentConsole groupFolder={consoleGroup} />
                  )}
                </div>

                <ActivityFeed events={liveFeed} maxItems={15} />
              </div>
            </div>
          </>
        )}

        {tab === 'crons' && <CronManager />}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#12122a] border border-[#1e1e3a] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-lg font-mono font-bold text-white">{value}</span>
    </div>
  );
}

function CommandCard({ title, icon, description, children }: {
  title: string;
  icon: React.ReactNode;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#12122a] border border-[#1e1e3a] rounded-xl">
      <div className="px-4 py-3 border-b border-[#1e1e3a] flex items-center gap-2">
        {icon}
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

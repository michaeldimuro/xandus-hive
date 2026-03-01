import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';
import CallLogTable from '../components/CallLogTable';
import TranscriptViewer from '../components/TranscriptViewer';
import CampaignManager from '../components/CampaignManager';

type TabValue = 'log' | 'campaigns' | 'transcripts';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'log', label: 'Call Log' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'transcripts', label: 'Transcripts' },
];

export default function VoiceCallsPage() {
  const {
    calls,
    campaigns,
    loadingCalls,
    loadingCampaigns,
    fetchCalls,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  } = useVoiceStore();
  const [activeTab, setActiveTab] = useState<TabValue>('log');

  useEffect(() => {
    fetchCalls();
    fetchCampaigns();
  }, [fetchCalls, fetchCampaigns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Voice Calls</h1>
          <p className="text-sm text-gray-400">
            {calls.length} calls -- {campaigns.length} campaigns
          </p>
        </div>
        <div className="w-10 h-10 gradient-accent rounded-xl flex items-center justify-center">
          <Phone size={20} className="text-white" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#2a2a4a]">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.value
                ? 'text-indigo-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.value && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="glass rounded-xl overflow-hidden">
        {activeTab === 'log' && (
          <CallLogTable calls={calls} loading={loadingCalls} />
        )}
        {activeTab === 'campaigns' && (
          <div className="p-5">
            <CampaignManager
              campaigns={campaigns}
              loading={loadingCampaigns}
              onCreate={createCampaign}
              onUpdate={updateCampaign}
              onDelete={deleteCampaign}
            />
          </div>
        )}
        {activeTab === 'transcripts' && (
          <div className="p-5">
            <TranscriptViewer calls={calls} loading={loadingCalls} />
          </div>
        )}
      </div>
    </div>
  );
}

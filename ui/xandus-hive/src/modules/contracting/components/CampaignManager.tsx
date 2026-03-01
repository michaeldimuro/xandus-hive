import { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import type {
  VoiceCampaign,
  CampaignPayload,
  CampaignType,
  CampaignStatus,
} from '../stores/voiceStore';

const STATUS_STYLE: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/20' },
  paused: { label: 'Paused', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  completed: { label: 'Completed', color: 'text-blue-400', bg: 'bg-blue-500/20' },
};

const TYPE_LABELS: Record<CampaignType, string> = {
  outbound_lead: 'Outbound (Leads)',
  outbound_sub: 'Outbound (Subs)',
  inbound: 'Inbound',
};

interface CampaignManagerProps {
  campaigns: VoiceCampaign[];
  loading: boolean;
  onCreate: (payload: CampaignPayload) => Promise<void>;
  onUpdate: (id: string, payload: Partial<CampaignPayload>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CampaignManager({
  campaigns,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: CampaignManagerProps) {
  const [editing, setEditing] = useState<VoiceCampaign | null>(null);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<CampaignType>('outbound_lead');
  const [script, setScript] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('draft');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setName('');
    setType('outbound_lead');
    setScript('');
    setStatus('draft');
  };

  const openEdit = (campaign: VoiceCampaign) => {
    setEditing(campaign);
    setCreating(true);
    setName(campaign.name);
    setType(campaign.type);
    setScript(campaign.script || '');
    setStatus(campaign.status);
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: CampaignPayload = {
        name,
        type,
        script: script || null,
        status,
        call_list: editing?.call_list ?? null,
        schedule: editing?.schedule ?? null,
      };

      if (editing) {
        await onUpdate(editing.id, payload);
      } else {
        await onCreate(payload);
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) {return;}
    await onDelete(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-1.5 text-sm gradient-accent text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus size={16} />
          New Campaign
        </button>
      </div>

      {/* Campaign form */}
      {creating && (
        <div className="bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-white">
              {editing ? 'Edit Campaign' : 'New Campaign'}
            </h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-white p-1">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f0f23] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Campaign name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CampaignType)}
                className="w-full px-3 py-2 bg-[#0f0f23] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                className="w-full px-3 py-2 bg-[#0f0f23] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {Object.entries(STATUS_STYLE).map(([v, s]) => (
                  <option key={v} value={v}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Script</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-[#0f0f23] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none font-mono"
              placeholder="Enter call script..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={closeForm}
              className="px-4 py-2 text-sm text-gray-400 hover:bg-[#2a2a4a] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name || saving}
              className="px-4 py-2 text-sm gradient-accent text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 && !creating ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-3">No campaigns created yet.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm gradient-accent text-white rounded-lg hover:opacity-90 transition"
          >
            <Plus size={16} />
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => {
            const st = STATUS_STYLE[campaign.status] || STATUS_STYLE.draft;
            return (
              <div
                key={campaign.id}
                className="bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg p-4 flex items-center justify-between hover:border-[#3a3a5a] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white truncate">{campaign.name}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.color}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {TYPE_LABELS[campaign.type]} --{' '}
                    {campaign.script
                      ? `${campaign.script.slice(0, 60)}...`
                      : 'No script'}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEdit(campaign)}
                    className="p-2 hover:bg-[#2a2a4a] rounded-lg transition-colors"
                  >
                    <Edit2 size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="p-2 hover:bg-[#2a2a4a] rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

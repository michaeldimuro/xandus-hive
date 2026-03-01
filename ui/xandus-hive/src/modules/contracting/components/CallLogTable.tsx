import React, { useState } from 'react';
import { PhoneIncoming, PhoneOutgoing, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import type { VoiceCall } from '../stores/voiceStore';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  queued: { label: 'Queued', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  ringing: { label: 'Ringing', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  in_progress: { label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/20' },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/20' },
};

const OUTCOME_STYLE: Record<string, { label: string; color: string }> = {
  answered: { label: 'Answered', color: 'text-green-400' },
  voicemail: { label: 'Voicemail', color: 'text-amber-400' },
  no_answer: { label: 'No Answer', color: 'text-gray-400' },
  busy: { label: 'Busy', color: 'text-red-400' },
};

function formatDuration(seconds: number | null): string {
  if (!seconds) {return '-';}
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface CallLogTableProps {
  calls: VoiceCall[];
  loading: boolean;
}

export default function CallLogTable({ calls, loading }: CallLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No calls recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#1a1a3a] border-b border-[#2a2a4a]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Direction</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Outcome</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2a2a4a]">
          {calls.map((call) => {
            const statusStyle = STATUS_STYLE[call.status] || STATUS_STYLE.queued;
            const outcomeStyle = call.outcome ? OUTCOME_STYLE[call.outcome] : null;
            const isExpanded = expandedId === call.id;

            return (
              <React.Fragment key={call.id}>
                <tr className="group hover:bg-[#1a1a3a]/50">
                  <td className="px-4 py-3">
                    {call.direction === 'inbound' ? (
                      <div className="flex items-center gap-1.5 text-sm text-blue-400">
                        <PhoneIncoming size={16} />
                        <span>Inbound</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm text-purple-400">
                        <PhoneOutgoing size={16} />
                        <span>Outbound</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {call.contact_name || 'Unknown'}
                      </p>
                      {call.phone_number && (
                        <p className="text-xs text-gray-400">{call.phone_number}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle.bg} ${statusStyle.color}`}
                    >
                      {statusStyle.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {formatDuration(call.duration_seconds)}
                  </td>
                  <td className="px-4 py-3">
                    {outcomeStyle ? (
                      <span className={`text-sm ${outcomeStyle.color}`}>{outcomeStyle.label}</span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {format(new Date(call.created_at), 'MMM d, h:mm a')}
                  </td>
                  <td className="px-4 py-3">
                    {call.transcript && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : call.id)}
                        className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
                {isExpanded && call.transcript && (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 bg-[#0f0f23]">
                      <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                          Transcript
                        </p>
                        {call.transcript}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

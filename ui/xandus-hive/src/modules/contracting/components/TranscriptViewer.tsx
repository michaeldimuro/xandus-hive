import { useState } from 'react';
import { Search, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { VoiceCall } from '../stores/voiceStore';

interface TranscriptViewerProps {
  calls: VoiceCall[];
  loading: boolean;
}

export default function TranscriptViewer({ calls, loading }: TranscriptViewerProps) {
  const [search, setSearch] = useState('');
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  const callsWithTranscripts = calls.filter((c) => c.transcript);

  const filtered = search
    ? callsWithTranscripts.filter(
        (c) =>
          c.transcript?.toLowerCase().includes(search.toLowerCase()) ||
          c.contact_name?.toLowerCase().includes(search.toLowerCase())
      )
    : callsWithTranscripts;

  const selectedCall = selectedCallId
    ? filtered.find((c) => c.id === selectedCallId) || null
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (callsWithTranscripts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={40} className="text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No transcripts available yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[400px]">
      {/* Left: List */}
      <div className="lg:w-80 flex-shrink-0 space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transcripts..."
            className="bg-transparent outline-none text-sm flex-1 text-white placeholder-gray-500"
          />
        </div>

        {/* Call list */}
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {filtered.map((call) => (
            <button
              key={call.id}
              onClick={() => setSelectedCallId(call.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                selectedCallId === call.id
                  ? 'bg-indigo-600/20 border border-indigo-500/30'
                  : 'hover:bg-[#1a1a3a] border border-transparent'
              }`}
            >
              <p className="text-sm font-medium text-white truncate">
                {call.contact_name || call.phone_number || 'Unknown'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {format(new Date(call.created_at), 'MMM d, yyyy h:mm a')}
              </p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {call.transcript?.slice(0, 80)}...
              </p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No matching transcripts.</p>
          )}
        </div>
      </div>

      {/* Right: Transcript content */}
      <div className="flex-1 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg p-5 overflow-y-auto max-h-[600px]">
        {selectedCall ? (
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2a2a4a]">
              <div>
                <h3 className="font-medium text-white">
                  {selectedCall.contact_name || 'Unknown Contact'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(selectedCall.created_at), 'MMMM d, yyyy h:mm a')} --{' '}
                  {selectedCall.direction === 'inbound' ? 'Inbound' : 'Outbound'} call
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {selectedCall.transcript}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Select a call to view its transcript
          </div>
        )}
      </div>
    </div>
  );
}

import { Calendar, DollarSign, Building2, ChevronRight, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import type { Lead, LeadStage } from '../stores/leadsStore';

const STAGE_ORDER: LeadStage[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  contacted: { label: 'Contacted', color: 'text-violet-400', bg: 'bg-violet-500/20' },
  qualified: { label: 'Qualified', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  proposal: { label: 'Proposal', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  won: { label: 'Won', color: 'text-green-400', bg: 'bg-green-500/20' },
  lost: { label: 'Lost', color: 'text-red-400', bg: 'bg-red-500/20' },
};

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onMoveStage: (id: string, stage: LeadStage) => void;
}

export default function LeadCard({ lead, onEdit, onMoveStage }: LeadCardProps) {
  const stageIdx = STAGE_ORDER.indexOf(lead.stage);
  const prevStage = stageIdx > 0 ? STAGE_ORDER[stageIdx - 1] : null;
  const nextStage = stageIdx < STAGE_ORDER.length - 1 ? STAGE_ORDER[stageIdx + 1] : null;

  return (
    <div
      className="bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg p-4 hover:border-indigo-500/50 transition-all cursor-pointer group"
      onClick={() => onEdit(lead)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-white truncate">{lead.name}</h3>
          {lead.company && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Building2 size={12} />
              <span className="truncate">{lead.company}</span>
            </p>
          )}
        </div>
      </div>

      {lead.estimated_value != null && lead.estimated_value > 0 && (
        <div className="flex items-center gap-1 text-sm text-green-400 mb-2">
          <DollarSign size={14} />
          <span className="font-medium">{lead.estimated_value.toLocaleString()}</span>
        </div>
      )}

      {lead.follow_up_date && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <Calendar size={12} />
          <span>Follow-up: {format(new Date(lead.follow_up_date), 'MMM d, yyyy')}</span>
        </div>
      )}

      {/* Stage move buttons */}
      <div
        className="flex items-center justify-between pt-2 border-t border-[#2a2a4a]"
        onClick={(e) => e.stopPropagation()}
      >
        {prevStage ? (
          <button
            onClick={() => onMoveStage(lead.id, prevStage)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-1 py-0.5 rounded hover:bg-[#2a2a4a]"
            title={`Move to ${STAGE_CONFIG[prevStage].label}`}
          >
            <ChevronLeft size={14} />
            <span>{STAGE_CONFIG[prevStage].label}</span>
          </button>
        ) : (
          <div />
        )}
        {nextStage ? (
          <button
            onClick={() => onMoveStage(lead.id, nextStage)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-1 py-0.5 rounded hover:bg-[#2a2a4a]"
            title={`Move to ${STAGE_CONFIG[nextStage].label}`}
          >
            <span>{STAGE_CONFIG[nextStage].label}</span>
            <ChevronRight size={14} />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

export { STAGE_CONFIG, STAGE_ORDER };

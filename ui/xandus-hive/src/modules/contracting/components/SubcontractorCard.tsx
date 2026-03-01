import { Star, Phone, DollarSign } from 'lucide-react';
import type { Subcontractor } from '../stores/subcontractorsStore';

const AVAILABILITY_STYLE: Record<string, { label: string; dot: string; text: string }> = {
  available: { label: 'Available', dot: 'bg-green-400', text: 'text-green-400' },
  busy: { label: 'Busy', dot: 'bg-yellow-400', text: 'text-yellow-400' },
  unavailable: { label: 'Unavailable', dot: 'bg-red-400', text: 'text-red-400' },
};

interface SubcontractorCardProps {
  sub: Subcontractor;
  onClick: (sub: Subcontractor) => void;
}

export default function SubcontractorCard({ sub, onClick }: SubcontractorCardProps) {
  const avail = AVAILABILITY_STYLE[sub.availability || ''] || AVAILABILITY_STYLE.unavailable;

  const renderStars = (rating: number | null) => {
    const stars = rating ?? 0;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={14}
            className={i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className="bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg p-5 hover:border-indigo-500/50 transition-all cursor-pointer group"
      onClick={() => onClick(sub)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-lg truncate">{sub.name}</h3>
          {sub.company && (
            <p className="text-sm text-gray-400 truncate">{sub.company}</p>
          )}
        </div>
        {/* Availability badge */}
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${avail.dot}`} />
          <span className={`text-xs font-medium ${avail.text}`}>{avail.label}</span>
        </div>
      </div>

      {/* Trade badge */}
      {sub.trade && (
        <div className="mb-3">
          <span className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 font-medium capitalize">
            {sub.trade}
          </span>
        </div>
      )}

      {/* Rating */}
      <div className="mb-3">
        {renderStars(sub.rating)}
      </div>

      {/* Rate */}
      {sub.hourly_rate != null && (
        <div className="flex items-center gap-1.5 text-sm text-gray-300 mb-2">
          <DollarSign size={14} className="text-green-400" />
          <span>${sub.hourly_rate}/hr</span>
        </div>
      )}

      {/* Phone */}
      {sub.phone && (
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <Phone size={14} />
          <span>{sub.phone}</span>
        </div>
      )}
    </div>
  );
}

export { AVAILABILITY_STYLE };

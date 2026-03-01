import { useNavigate } from 'react-router-dom';
import { Home, BedDouble, Bath, Ruler, DollarSign, TrendingUp } from 'lucide-react';
import type { Property, PropertyStrategy, PropertyStage } from '@/stores/propertyStore';

const STRATEGY_CONFIG: Record<PropertyStrategy, { label: string; color: string; bg: string }> = {
  flip: { label: 'Flip', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
  rental: { label: 'Rental', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
  wholesale: { label: 'Wholesale', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)' },
};

const STAGE_CONFIG: Record<PropertyStage, { label: string; color: string; bg: string }> = {
  sourced: { label: 'Sourced', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.2)' },
  analyzing: { label: 'Analyzing', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
  offer_pending: { label: 'Offer Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
  under_contract: { label: 'Under Contract', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)' },
  rehab: { label: 'Rehab', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)' },
  listed: { label: 'Listed', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.2)' },
  sold: { label: 'Sold', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' },
  rented: { label: 'Rented', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' },
};

export { STRATEGY_CONFIG, STAGE_CONFIG };

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const navigate = useNavigate();
  const strategy = STRATEGY_CONFIG[property.strategy];
  const stage = STAGE_CONFIG[property.stage];

  const formatCurrency = (value: number | null) => {
    if (value == null) {return '--';}
    return '$' + value.toLocaleString();
  };

  return (
    <div
      onClick={() => navigate(`/realestate/${property.id}`)}
      className="glass rounded-xl p-4 cursor-pointer hover:border-indigo-500/40 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
            <Home size={16} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
              {property.address}
            </p>
            <p className="text-xs text-gray-500">
              {property.city}, {property.state} {property.zip}
            </p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-3">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: stage.bg, color: stage.color }}
        >
          {stage.label}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: strategy.bg, color: strategy.color }}
        >
          {strategy.label}
        </span>
      </div>

      {/* Property specs */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        {property.beds != null && (
          <span className="flex items-center gap-1">
            <BedDouble size={12} />
            {property.beds}
          </span>
        )}
        {property.baths != null && (
          <span className="flex items-center gap-1">
            <Bath size={12} />
            {property.baths}
          </span>
        )}
        {property.sqft != null && (
          <span className="flex items-center gap-1">
            <Ruler size={12} />
            {property.sqft.toLocaleString()} sqft
          </span>
        )}
      </div>

      {/* Financials */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#2a2a4a]">
        <div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <DollarSign size={10} />
            Purchase
          </p>
          <p className="text-sm font-medium text-white">{formatCurrency(property.purchase_price)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <TrendingUp size={10} />
            ARV
          </p>
          <p className="text-sm font-medium text-emerald-400">{formatCurrency(property.arv_estimate)}</p>
        </div>
      </div>
    </div>
  );
}

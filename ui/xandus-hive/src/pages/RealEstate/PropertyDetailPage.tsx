import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Trash2, Home, BedDouble, Bath, Ruler,
  Calendar, MapPin, FileText, DollarSign, TrendingUp, Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { usePropertyStore } from '@/stores/propertyStore';
import type { Property } from '@/stores/propertyStore';
import { STAGE_CONFIG, STRATEGY_CONFIG } from '@/components/RealEstate/PropertyCard';
import { PropertyFormDialog } from '@/components/RealEstate/PropertyFormDialog';
import { CompsTable } from '@/components/RealEstate/CompsTable';
import { FinancialsTable } from '@/components/RealEstate/FinancialsTable';

type Tab = 'overview' | 'comps' | 'financials' | 'notes';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedProperty: property,
    detailLoading,
    comps,
    financials,
    fetchPropertyDetail,
    updateProperty,
    deleteProperty,
    createComp,
    deleteComp,
    createFinancial,
    deleteFinancial,
    clearDetail,
  } = usePropertyStore();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPropertyDetail(id);
    }
    return () => {
      clearDetail();
    };
  }, [id, fetchPropertyDetail, clearDetail]);

  const handleDelete = async () => {
    if (!property) {return;}
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {return;}
    await deleteProperty(property.id);
    navigate('/realestate');
  };

  const handleUpdate = async (data: Partial<Property>) => {
    if (!property) {return;}
    await updateProperty(property.id, data);
    setIsEditing(false);
  };

  if (detailLoading || !property) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const stage = STAGE_CONFIG[property.stage];
  const strategy = STRATEGY_CONFIG[property.strategy];
  const totalExpenses = financials.reduce((sum, f) => sum + (f.amount || 0), 0);
  const equity = (property.arv_estimate || 0) - (property.purchase_price || 0) - totalExpenses;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'comps', label: 'Comps', count: comps.length },
    { key: 'financials', label: 'Financials', count: financials.length },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/realestate')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back to Properties</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a3a] border border-[#2a2a4a] text-gray-300 rounded-lg hover:text-white hover:border-indigo-500/40 transition"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Property Header */}
      <div className="glass rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Home size={24} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{property.address}</h1>
              <p className="text-gray-400 flex items-center gap-1 mt-1">
                <MapPin size={14} />
                {property.city}, {property.state} {property.zip}
              </p>
              <div className="flex gap-2 mt-2">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: stage.bg, color: stage.color }}
                >
                  {stage.label}
                </span>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: strategy.bg, color: strategy.color }}
                >
                  {strategy.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-500">Purchase</p>
              <p className="text-lg font-bold text-white">
                {property.purchase_price ? '$' + property.purchase_price.toLocaleString() : '--'}
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-500">ARV</p>
              <p className="text-lg font-bold text-emerald-400">
                {property.arv_estimate ? '$' + property.arv_estimate.toLocaleString() : '--'}
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-500">Rehab Budget</p>
              <p className="text-lg font-bold text-amber-400">
                {property.rehab_budget ? '$' + property.rehab_budget.toLocaleString() : '--'}
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-500">Equity Est.</p>
              <p className={`text-lg font-bold ${equity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {equity >= 0 ? '' : '-'}${Math.abs(Math.round(equity)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#12122a] border border-[#2a2a4a] rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition ${
              activeTab === tab.key
                ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1a3a]'
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="text-xs bg-[#2a2a4a] px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property Details */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-indigo-400" />
              Property Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <BedDouble size={14} /> Bedrooms
                </span>
                <span className="text-sm text-white">{property.beds ?? '--'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Bath size={14} /> Bathrooms
                </span>
                <span className="text-sm text-white">{property.baths ?? '--'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Ruler size={14} /> Square Feet
                </span>
                <span className="text-sm text-white">
                  {property.sqft ? property.sqft.toLocaleString() : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
                <span className="text-sm text-gray-400">Lot Size (acres)</span>
                <span className="text-sm text-white">{property.lot_size ?? '--'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Calendar size={14} /> Year Built
                </span>
                <span className="text-sm text-white">{property.year_built ?? '--'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400">Source</span>
                <span className="text-sm text-white">{property.source || '--'}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" />
              Financial Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
                <span className="text-sm text-gray-400">Purchase Price</span>
                <span className="text-sm font-medium text-white">
                  {property.purchase_price ? '$' + property.purchase_price.toLocaleString() : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
                <span className="text-sm text-gray-400">Rehab Budget</span>
                <span className="text-sm font-medium text-amber-400">
                  {property.rehab_budget ? '$' + property.rehab_budget.toLocaleString() : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
                <span className="text-sm text-gray-400">Actual Expenses</span>
                <span className="text-sm font-medium text-red-400">
                  ${totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
                <span className="text-sm text-gray-400">ARV Estimate</span>
                <span className="text-sm font-medium text-emerald-400">
                  {property.arv_estimate ? '$' + property.arv_estimate.toLocaleString() : '--'}
                </span>
              </div>
              {property.rehab_budget != null && totalExpenses > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
                  <span className="text-sm text-gray-400">Budget Remaining</span>
                  <span className={`text-sm font-medium ${
                    property.rehab_budget - totalExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    ${(property.rehab_budget - totalExpenses).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-3 bg-[#1a1a3a] rounded-lg px-3">
                <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <TrendingUp size={14} /> Estimated Equity
                </span>
                <span className={`text-lg font-bold ${equity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {equity >= 0 ? '' : '-'}${Math.abs(Math.round(equity)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass rounded-xl p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              Timeline
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-500">Added: </span>
                <span className="text-gray-300">
                  {format(new Date(property.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              {property.updated_at && property.updated_at !== property.created_at && (
                <div>
                  <span className="text-gray-500">Updated: </span>
                  <span className="text-gray-300">
                    {format(new Date(property.updated_at), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comps' && (
        <CompsTable
          comps={comps}
          propertyId={property.id}
          onAdd={createComp}
          onDelete={deleteComp}
        />
      )}

      {activeTab === 'financials' && (
        <FinancialsTable
          financials={financials}
          propertyId={property.id}
          onAdd={createFinancial}
          onDelete={deleteFinancial}
        />
      )}

      {activeTab === 'notes' && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FileText size={16} className="text-purple-400" />
            Notes
          </h3>
          {property.notes ? (
            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {property.notes}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">No notes for this property</p>
              <p className="text-gray-600 text-xs mt-1">
                Edit the property to add notes
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <PropertyFormDialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleUpdate}
        initialData={property}
      />
    </div>
  );
}

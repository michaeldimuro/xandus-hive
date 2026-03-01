import { useEffect, useState } from 'react';
import { Plus, Search, Building2, Filter } from 'lucide-react';
import { usePropertyStore } from '@/stores/propertyStore';
import type { PropertyStage, PropertyStrategy } from '@/stores/propertyStore';
import { PropertyCard, STAGE_CONFIG } from '@/components/RealEstate/PropertyCard';
import { PropertyFormDialog } from '@/components/RealEstate/PropertyFormDialog';

const STAGES: PropertyStage[] = [
  'sourced', 'analyzing', 'offer_pending', 'under_contract', 'rehab', 'listed', 'sold', 'rented',
];

const PIPELINE_STAGES: PropertyStage[] = [
  'sourced', 'analyzing', 'offer_pending', 'under_contract', 'rehab', 'listed',
];

const CLOSED_STAGES: PropertyStage[] = ['sold', 'rented'];

type ViewMode = 'pipeline' | 'all';

export default function PropertiesPage() {
  const { properties, loading, fetchProperties, createProperty } = usePropertyStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [strategyFilter, setStrategyFilter] = useState<PropertyStrategy | 'all'>('all');
  const [stageFilter, setStageFilter] = useState<PropertyStage | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filtered = properties.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.zip.includes(searchQuery);
    const matchesStrategy = strategyFilter === 'all' || p.strategy === strategyFilter;
    const matchesStage = stageFilter === 'all' || p.stage === stageFilter;
    return matchesSearch && matchesStrategy && matchesStage;
  });

  const propertiesByStage = (stage: PropertyStage) =>
    filtered.filter((p) => p.stage === stage);

  const totalValue = properties.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
  const totalARV = properties.reduce((sum, p) => sum + (p.arv_estimate || 0), 0);
  const activeCount = properties.filter((p) => !CLOSED_STAGES.includes(p.stage)).length;

  const handleSave = async (data: Partial<typeof properties[0]>) => {
    await createProperty(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Properties</h1>
          <p className="text-gray-400 mt-1">Track your real estate pipeline</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus size={20} />
          Add Property
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Properties</p>
          <p className="text-2xl font-bold text-white">{properties.length}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400">Active Pipeline</p>
          <p className="text-2xl font-bold text-indigo-400">{activeCount}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Invested</p>
          <p className="text-2xl font-bold text-amber-400">${totalValue.toLocaleString()}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400">Total ARV</p>
          <p className="text-2xl font-bold text-emerald-400">${totalARV.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 bg-[#12122a] border border-[#2a2a4a] rounded-lg px-3 py-2 flex-1 min-w-0">
          <Search size={18} className="text-gray-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties..."
            className="bg-transparent outline-none text-sm flex-1 text-white placeholder-gray-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value as PropertyStrategy | 'all')}
            className="px-3 py-2 bg-[#12122a] border border-[#2a2a4a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Strategies</option>
            <option value="flip">Flip</option>
            <option value="rental">Rental</option>
            <option value="wholesale">Wholesale</option>
          </select>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as PropertyStage | 'all')}
            className="px-3 py-2 bg-[#12122a] border border-[#2a2a4a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
            ))}
          </select>
          <div className="flex bg-[#12122a] border border-[#2a2a4a] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-2 text-sm transition ${
                viewMode === 'pipeline'
                  ? 'bg-indigo-600/30 text-indigo-300'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Filter size={16} />
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-2 text-sm transition ${
                viewMode === 'all'
                  ? 'bg-indigo-600/30 text-indigo-300'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No properties yet</h3>
          <p className="text-gray-400 mb-4">Start building your real estate pipeline</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition"
          >
            <Plus size={20} />
            Add Property
          </button>
        </div>
      ) : viewMode === 'pipeline' ? (
        /* Pipeline View - Grouped by Stage */
        <div className="space-y-6">
          {/* Active Pipeline */}
          {PIPELINE_STAGES.map((stage) => {
            const stageProps = propertiesByStage(stage);
            if (stageFilter !== 'all' && stageFilter !== stage) {return null;}
            if (stageProps.length === 0 && stageFilter === 'all') {return null;}

            const stageConfig = STAGE_CONFIG[stage];
            return (
              <div key={stage}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: stageConfig.color }}
                  />
                  <h3 className="text-sm font-semibold text-gray-300">
                    {stageConfig.label}
                  </h3>
                  <span className="text-xs text-gray-500">({stageProps.length})</span>
                </div>
                {stageProps.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {stageProps.map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                ) : (
                  <div className="glass rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">No properties in this stage</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Closed */}
          {(stageFilter === 'all' || CLOSED_STAGES.includes(stageFilter)) && (
            <>
              {CLOSED_STAGES.map((stage) => {
                const stageProps = propertiesByStage(stage);
                if (stageFilter !== 'all' && stageFilter !== stage) {return null;}
                if (stageProps.length === 0) {return null;}

                const stageConfig = STAGE_CONFIG[stage];
                return (
                  <div key={stage}>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: stageConfig.color }}
                      />
                      <h3 className="text-sm font-semibold text-gray-300">
                        {stageConfig.label}
                      </h3>
                      <span className="text-xs text-gray-500">({stageProps.length})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {stageProps.map((p) => (
                        <PropertyCard key={p.id} property={p} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : (
        /* Grid View - All properties */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <PropertyFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

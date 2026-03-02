import { useEffect, useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import {
  useSubcontractorsStore,
  type Subcontractor,
  type SubPayload,
  type SubAvailability,
} from '../stores/subcontractorsStore';
import SubcontractorCard from '../components/SubcontractorCard';
import SubcontractorFormDialog from '../components/SubcontractorFormDialog';

const TRADES = [
  'all', 'electrical', 'plumbing', 'hvac', 'carpentry', 'drywall', 'roofing',
  'painting', 'flooring', 'masonry', 'landscaping', 'concrete', 'demolition', 'general',
];

const AVAILABILITY_OPTIONS: Array<{ value: SubAvailability | 'all'; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'unavailable', label: 'Unavailable' },
];

export default function SubcontractorsPage() {
  const { subcontractors, loading, fetchSubcontractors, createSubcontractor, updateSubcontractor, deleteSubcontractor } =
    useSubcontractorsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState<SubAvailability | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcontractor | null>(null);

  useEffect(() => {
    fetchSubcontractors();
  }, [fetchSubcontractors]);

  const filtered = subcontractors.filter((sub) => {
    const matchesSearch =
      !searchQuery ||
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.trade?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTrade = tradeFilter === 'all' || sub.trade?.toLowerCase() === tradeFilter;
    const matchesAvail = availFilter === 'all' || sub.availability === availFilter;

    return matchesSearch && matchesTrade && matchesAvail;
  });

  const handleOpenCreate = () => {
    setEditingSub(null);
    setDialogOpen(true);
  };

  const handleEdit = (sub: Subcontractor) => {
    setEditingSub(sub);
    setDialogOpen(true);
  };

  const handleSave = async (payload: SubPayload) => {
    if (editingSub) {
      await updateSubcontractor(editingSub.id, payload);
    } else {
      await createSubcontractor(payload);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSubcontractor(id);
  };

  // Stats
  const availableCount = subcontractors.filter((s) => s.availability === 'available').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Subcontractors</h1>
          <p className="text-sm text-gray-400">
            {subcontractors.length} total -- {availableCount} available
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition text-sm"
        >
          <Plus size={16} />
          Add Subcontractor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-[#12122a] border border-[#2a2a4a] rounded-lg px-3 py-2 flex-1">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, or trade..."
            className="bg-transparent outline-none text-sm flex-1 text-white placeholder-gray-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400 hidden sm:block" />
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="px-3 py-2 bg-[#12122a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm capitalize"
          >
            {TRADES.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Trades' : t}
              </option>
            ))}
          </select>
          <select
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value as SubAvailability | 'all')}
            className="px-3 py-2 bg-[#12122a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            {AVAILABILITY_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <h3 className="text-lg font-medium text-white mb-2">
            {subcontractors.length === 0 ? 'No subcontractors yet' : 'No matching subcontractors'}
          </h3>
          <p className="text-gray-400 mb-4">
            {subcontractors.length === 0
              ? 'Add your first subcontractor to get started.'
              : 'Try adjusting your filters.'}
          </p>
          {subcontractors.length === 0 && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition text-sm"
            >
              <Plus size={16} />
              Add Subcontractor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sub) => (
            <SubcontractorCard key={sub.id} sub={sub} onClick={handleEdit} />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <SubcontractorFormDialog
        open={dialogOpen}
        sub={editingSub}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

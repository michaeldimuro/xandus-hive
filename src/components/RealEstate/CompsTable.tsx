import React, { useState } from 'react';
import { Plus, Trash2, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';
import type { PropertyComp } from '@/stores/propertyStore';

interface CompsTableProps {
  comps: PropertyComp[];
  propertyId: string;
  onAdd: (data: Partial<PropertyComp>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CompsTable({ comps, propertyId, onAdd, onDelete }: CompsTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    address: '',
    sale_price: '',
    sale_date: '',
    sqft: '',
    beds: '',
    baths: '',
    distance_miles: '',
    source: '',
  });

  const resetForm = () => {
    setForm({
      address: '', sale_price: '', sale_date: '', sqft: '',
      beds: '', baths: '', distance_miles: '', source: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onAdd({
        property_id: propertyId,
        address: form.address,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        sale_date: form.sale_date || null,
        sqft: form.sqft ? parseInt(form.sqft) : null,
        beds: form.beds ? parseInt(form.beds) : null,
        baths: form.baths ? parseFloat(form.baths) : null,
        distance_miles: form.distance_miles ? parseFloat(form.distance_miles) : null,
        source: form.source || null,
      });
      resetForm();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comp?')) {return;}
    await onDelete(id);
  };

  const avgPrice = comps.length
    ? comps.reduce((sum, c) => sum + (c.sale_price || 0), 0) / comps.filter((c) => c.sale_price).length
    : 0;

  const avgPricePerSqft = comps.length
    ? comps
        .filter((c) => c.sale_price && c.sqft)
        .reduce((sum, c) => sum + (c.sale_price! / c.sqft!), 0) /
      comps.filter((c) => c.sale_price && c.sqft).length
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {comps.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-gray-500">Total Comps</p>
            <p className="text-xl font-bold text-white">{comps.length}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-gray-500">Avg Sale Price</p>
            <p className="text-xl font-bold text-emerald-400">
              {avgPrice ? '$' + Math.round(avgPrice).toLocaleString() : '--'}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-gray-500">Avg $/sqft</p>
            <p className="text-xl font-bold text-blue-400">
              {avgPricePerSqft ? '$' + Math.round(avgPricePerSqft).toLocaleString() : '--'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Comparable Sales</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm gradient-accent text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus size={14} />
          Add Comp
        </button>
      </div>

      {/* Add Comp Form */}
      {showForm && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">New Comparable Sale</h4>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Comp address"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={form.sale_price}
                  onChange={(e) => setForm((p) => ({ ...p, sale_price: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Sale price"
                  min="0"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={form.sale_date}
                  onChange={(e) => setForm((p) => ({ ...p, sale_date: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={form.sqft}
                  onChange={(e) => setForm((p) => ({ ...p, sqft: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Sqft"
                  min="0"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.beds}
                  onChange={(e) => setForm((p) => ({ ...p, beds: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Beds"
                  min="0"
                />
                <input
                  type="number"
                  value={form.baths}
                  onChange={(e) => setForm((p) => ({ ...p, baths: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Baths"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={form.distance_miles}
                  onChange={(e) => setForm((p) => ({ ...p, distance_miles: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Distance (mi)"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Source (MLS, Zillow, etc.)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-3 py-1.5 text-sm text-gray-400 hover:bg-[#1a1a3a] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-1.5 text-sm gradient-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add Comp'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comps Table */}
      {comps.length === 0 && !showForm ? (
        <div className="glass rounded-xl p-8 text-center">
          <MapPin size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm">No comparable sales added yet</p>
          <p className="text-gray-600 text-xs mt-1">Add comps to help estimate property value</p>
        </div>
      ) : comps.length > 0 ? (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a3a] border-b border-[#2a2a4a]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Sale Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Sqft</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Bed/Bath</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Distance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">$/sqft</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a4a]">
                {comps.map((comp) => (
                  <tr key={comp.id} className="hover:bg-[#1a1a3a]/50">
                    <td className="px-4 py-3 text-sm text-white">{comp.address}</td>
                    <td className="px-4 py-3 text-sm text-emerald-400 font-medium">
                      {comp.sale_price ? '$' + comp.sale_price.toLocaleString() : '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {comp.sale_date ? format(new Date(comp.sale_date), 'MMM d, yyyy') : '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {comp.sqft ? comp.sqft.toLocaleString() : '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {comp.beds ?? '--'}/{comp.baths ?? '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {comp.distance_miles != null ? comp.distance_miles.toFixed(1) + ' mi' : '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-blue-400">
                      {comp.sale_price && comp.sqft
                        ? '$' + Math.round(comp.sale_price / comp.sqft).toLocaleString()
                        : '--'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(comp.id)}
                        className="p-1 hover:bg-[#2a2a4a] rounded"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

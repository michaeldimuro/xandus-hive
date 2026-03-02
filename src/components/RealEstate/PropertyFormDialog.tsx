import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Property, PropertyStage, PropertyStrategy } from '@/stores/propertyStore';
import { STAGE_CONFIG, STRATEGY_CONFIG } from './PropertyCard';

interface PropertyFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Property>) => Promise<void>;
  initialData?: Property | null;
}

const STAGES: PropertyStage[] = [
  'sourced', 'analyzing', 'offer_pending', 'under_contract', 'rehab', 'listed', 'sold', 'rented',
];
const STRATEGIES: PropertyStrategy[] = ['flip', 'rental', 'wholesale'];

export function PropertyFormDialog({ open, onClose, onSave, initialData }: PropertyFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    beds: '',
    baths: '',
    sqft: '',
    lot_size: '',
    year_built: '',
    stage: 'sourced' as PropertyStage,
    strategy: 'flip' as PropertyStrategy,
    purchase_price: '',
    arv_estimate: '',
    rehab_budget: '',
    source: '',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zip: initialData.zip || '',
        beds: initialData.beds?.toString() || '',
        baths: initialData.baths?.toString() || '',
        sqft: initialData.sqft?.toString() || '',
        lot_size: initialData.lot_size?.toString() || '',
        year_built: initialData.year_built?.toString() || '',
        stage: initialData.stage || 'sourced',
        strategy: initialData.strategy || 'flip',
        purchase_price: initialData.purchase_price?.toString() || '',
        arv_estimate: initialData.arv_estimate?.toString() || '',
        rehab_budget: initialData.rehab_budget?.toString() || '',
        source: initialData.source || '',
        notes: initialData.notes || '',
      });
    } else {
      setForm({
        address: '', city: '', state: '', zip: '',
        beds: '', baths: '', sqft: '', lot_size: '', year_built: '',
        stage: 'sourced', strategy: 'flip',
        purchase_price: '', arv_estimate: '', rehab_budget: '',
        source: '', notes: '',
      });
    }
  }, [initialData, open]);

  if (!open) {return null;}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        beds: form.beds ? parseInt(form.beds) : null,
        baths: form.baths ? parseFloat(form.baths) : null,
        sqft: form.sqft ? parseInt(form.sqft) : null,
        lot_size: form.lot_size ? parseFloat(form.lot_size) : null,
        year_built: form.year_built ? parseInt(form.year_built) : null,
        stage: form.stage,
        strategy: form.strategy,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        arv_estimate: form.arv_estimate ? parseFloat(form.arv_estimate) : null,
        rehab_budget: form.rehab_budget ? parseFloat(form.rehab_budget) : null,
        source: form.source || null,
        notes: form.notes || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#12122a] border border-[#2a2a4a] rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#2a2a4a] flex items-center justify-between sticky top-0 bg-[#12122a] z-10">
          <h2 className="text-lg font-semibold text-white">
            {initialData ? 'Edit Property' : 'Add Property'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Address *</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="123 Main St"
            />
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
                required
                maxLength={2}
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                placeholder="TX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Zip *</label>
              <input
                type="text"
                value={form.zip}
                onChange={(e) => update('zip', e.target.value)}
                required
                maxLength={10}
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="75001"
              />
            </div>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Beds</label>
              <input
                type="number"
                value={form.beds}
                onChange={(e) => update('beds', e.target.value)}
                min="0"
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Baths</label>
              <input
                type="number"
                value={form.baths}
                onChange={(e) => update('baths', e.target.value)}
                min="0"
                step="0.5"
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sqft</label>
              <input
                type="number"
                value={form.sqft}
                onChange={(e) => update('sqft', e.target.value)}
                min="0"
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Lot Size</label>
              <input
                type="number"
                value={form.lot_size}
                onChange={(e) => update('lot_size', e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Year Built</label>
              <input
                type="number"
                value={form.year_built}
                onChange={(e) => update('year_built', e.target.value)}
                min="1800"
                max="2030"
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="2005"
              />
            </div>
          </div>

          {/* Stage & Strategy */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => update('stage', e.target.value)}
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Strategy</label>
              <select
                value={form.strategy}
                onChange={(e) => update('strategy', e.target.value)}
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STRATEGIES.map((s) => (
                  <option key={s} value={s}>{STRATEGY_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Purchase Price</label>
              <input
                type="number"
                value={form.purchase_price}
                onChange={(e) => update('purchase_price', e.target.value)}
                min="0"
                step="1000"
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="150000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">ARV Estimate</label>
              <input
                type="number"
                value={form.arv_estimate}
                onChange={(e) => update('arv_estimate', e.target.value)}
                min="0"
                step="1000"
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="225000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rehab Budget</label>
              <input
                type="number"
                value={form.rehab_budget}
                onChange={(e) => update('rehab_budget', e.target.value)}
                min="0"
                step="500"
                className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="35000"
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
            <input
              type="text"
              value={form.source}
              onChange={(e) => update('source', e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="MLS, Wholesaler, Driving for Dollars, etc."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Additional notes about this property..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2a4a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:bg-[#1a1a3a] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : initialData ? 'Save Changes' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

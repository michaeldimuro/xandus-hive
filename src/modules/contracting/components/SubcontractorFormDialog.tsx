import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Subcontractor, SubPayload, SubAvailability } from '../stores/subcontractorsStore';

const TRADES = [
  'Electrical', 'Plumbing', 'HVAC', 'Carpentry', 'Drywall', 'Roofing',
  'Painting', 'Flooring', 'Masonry', 'Landscaping', 'Concrete', 'Demolition',
  'General', 'Other',
];

const AVAILABILITY_OPTIONS: { value: SubAvailability; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'unavailable', label: 'Unavailable' },
];

interface SubcontractorFormDialogProps {
  open: boolean;
  sub: Subcontractor | null;
  onClose: () => void;
  onSave: (payload: SubPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function SubcontractorFormDialog({
  open,
  sub,
  onClose,
  onSave,
  onDelete,
}: SubcontractorFormDialogProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [trade, setTrade] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [rating, setRating] = useState('3');
  const [availability, setAvailability] = useState<SubAvailability>('available');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sub) {
      setName(sub.name || '');
      setCompany(sub.company || '');
      setTrade(sub.trade || '');
      setPhone(sub.phone || '');
      setEmail(sub.email || '');
      setHourlyRate(sub.hourly_rate?.toString() || '');
      setRating(sub.rating?.toString() || '3');
      setAvailability(sub.availability || 'available');
      setNotes(sub.notes || '');
    } else {
      setName('');
      setCompany('');
      setTrade('');
      setPhone('');
      setEmail('');
      setHourlyRate('');
      setRating('3');
      setAvailability('available');
      setNotes('');
    }
  }, [sub, open]);

  if (!open) {return null;}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name,
        company: company || null,
        trade: trade || null,
        phone: phone || null,
        email: email || null,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        rating: rating ? parseInt(rating, 10) : null,
        availability,
        notes: notes || null,
        work_history: sub?.work_history ?? null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sub || !onDelete) {return;}
    if (!confirm('Delete this subcontractor? This cannot be undone.')) {return;}
    await onDelete(sub.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#12122a] border border-[#2a2a4a] rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#2a2a4a] flex items-center justify-between sticky top-0 bg-[#12122a] z-10">
          <h2 className="text-lg font-semibold text-white">
            {sub ? 'Edit Subcontractor' : 'New Subcontractor'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Full name"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Company name"
              />
            </div>

            {/* Trade */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Trade</label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">Select trade...</option>
                {TRADES.map((t) => (
                  <option key={t} value={t.toLowerCase()}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="(555) 123-4567"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="email@example.com"
              />
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Hourly Rate ($)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Rating (1-5)</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>
                    {r} Star{r > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as SubAvailability)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#2a2a4a]">
            <div>
              {sub && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:bg-[#1a1a3a] rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm gradient-accent text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : sub ? 'Save Changes' : 'Add Subcontractor'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

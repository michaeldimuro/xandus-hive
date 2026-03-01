import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Lead, LeadStage, LeadPayload } from '../stores/leadsStore';

const STAGES: { value: LeadStage; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const SOURCES = ['Website', 'Referral', 'ANGI', 'Cold Call', 'Social Media', 'Google Ads', 'Other'];

interface LeadFormDialogProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSave: (payload: LeadPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function LeadFormDialog({ open, lead, onClose, onSave, onDelete }: LeadFormDialogProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [stage, setStage] = useState<LeadStage>('new');
  const [source, setSource] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setCompany(lead.company || '');
      setEmail(lead.email || '');
      setPhone(lead.phone || '');
      setAddress(lead.address || '');
      setStage(lead.stage);
      setSource(lead.source || '');
      setScopeOfWork(lead.scope_of_work || '');
      setEstimatedValue(lead.estimated_value?.toString() || '');
      setFollowUpDate(lead.follow_up_date ? lead.follow_up_date.split('T')[0] : '');
      setNotes(lead.notes || '');
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setAddress('');
      setStage('new');
      setSource('');
      setScopeOfWork('');
      setEstimatedValue('');
      setFollowUpDate('');
      setNotes('');
    }
  }, [lead, open]);

  if (!open) {return null;}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        stage,
        source: source || null,
        scope_of_work: scopeOfWork || null,
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
        follow_up_date: followUpDate || null,
        notes: notes || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lead || !onDelete) {return;}
    if (!confirm('Delete this lead? This cannot be undone.')) {return;}
    await onDelete(lead.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#12122a] border border-[#2a2a4a] rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#2a2a4a] flex items-center justify-between sticky top-0 bg-[#12122a] z-10">
          <h2 className="text-lg font-semibold text-white">
            {lead ? 'Edit Lead' : 'New Lead'}
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
                placeholder="Lead name"
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

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="123 Main St"
              />
            </div>

            {/* Stage */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as LeadStage)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">Select source...</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Value */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Estimated Value ($)</label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Scope of Work */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Scope of Work</label>
              <textarea
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                placeholder="Describe the scope of work..."
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#2a2a4a]">
            <div>
              {lead && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete Lead
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
                {saving ? 'Saving...' : lead ? 'Save Changes' : 'Create Lead'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Plus, Trash2, Receipt, X } from 'lucide-react';
import { format } from 'date-fns';
import type { PropertyFinancial } from '@/stores/propertyStore';

const EXPENSE_TYPES = [
  'Acquisition',
  'Closing Costs',
  'Inspection',
  'Appraisal',
  'Rehab - Demo',
  'Rehab - Electrical',
  'Rehab - Plumbing',
  'Rehab - HVAC',
  'Rehab - Flooring',
  'Rehab - Paint',
  'Rehab - Kitchen',
  'Rehab - Bathroom',
  'Rehab - Roofing',
  'Rehab - Landscaping',
  'Rehab - Other',
  'Holding - Insurance',
  'Holding - Taxes',
  'Holding - Utilities',
  'Holding - HOA',
  'Holding - Other',
  'Marketing',
  'Agent Commission',
  'Other',
];

interface FinancialsTableProps {
  financials: PropertyFinancial[];
  propertyId: string;
  onAdd: (data: Partial<PropertyFinancial>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FinancialsTable({ financials, propertyId, onAdd, onDelete }: FinancialsTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    expense_type: 'Acquisition',
    amount: '',
    paid_to: '',
    date: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({ expense_type: 'Acquisition', amount: '', paid_to: '', date: '', notes: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onAdd({
        property_id: propertyId,
        expense_type: form.expense_type,
        amount: parseFloat(form.amount),
        paid_to: form.paid_to || null,
        date: form.date || null,
        notes: form.notes || null,
      });
      resetForm();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) {return;}
    await onDelete(id);
  };

  const totalExpenses = financials.reduce((sum, f) => sum + (f.amount || 0), 0);

  // Group by category prefix
  const rehabTotal = financials
    .filter((f) => f.expense_type.startsWith('Rehab'))
    .reduce((sum, f) => sum + f.amount, 0);
  const holdingTotal = financials
    .filter((f) => f.expense_type.startsWith('Holding'))
    .reduce((sum, f) => sum + f.amount, 0);
  const otherTotal = totalExpenses - rehabTotal - holdingTotal;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {financials.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-gray-500">Total Expenses</p>
            <p className="text-xl font-bold text-red-400">${totalExpenses.toLocaleString()}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-gray-500">Rehab Costs</p>
            <p className="text-xl font-bold text-amber-400">${rehabTotal.toLocaleString()}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-gray-500">Holding Costs</p>
            <p className="text-xl font-bold text-blue-400">${holdingTotal.toLocaleString()}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-gray-500">Other Costs</p>
            <p className="text-xl font-bold text-gray-300">${otherTotal.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Expenses & Financials</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm gradient-accent text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus size={14} />
          Add Expense
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">New Expense</h4>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <select
                  value={form.expense_type}
                  onChange={(e) => setForm((p) => ({ ...p, expense_type: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {EXPENSE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Amount"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={form.paid_to}
                  onChange={(e) => setForm((p) => ({ ...p, paid_to: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Paid to"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Notes"
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
                {saving ? 'Saving...' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Financials Table */}
      {financials.length === 0 && !showForm ? (
        <div className="glass rounded-xl p-8 text-center">
          <Receipt size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm">No expenses recorded yet</p>
          <p className="text-gray-600 text-xs mt-1">Track rehab costs, holding expenses, and more</p>
        </div>
      ) : financials.length > 0 ? (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a3a] border-b border-[#2a2a4a]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Paid To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Notes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a4a]">
                {financials.map((fin) => (
                  <tr key={fin.id} className="hover:bg-[#1a1a3a]/50">
                    <td className="px-4 py-3">
                      <span className="text-sm text-white">{fin.expense_type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-red-400">
                      ${fin.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{fin.paid_to || '--'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {fin.date ? format(new Date(fin.date), 'MMM d, yyyy') : '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[200px]">
                      {fin.notes || '--'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(fin.id)}
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

import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Home, DollarSign } from 'lucide-react';
import type { Property } from '@/stores/propertyStore';

interface DealCalculatorProps {
  properties: Property[];
}

export function DealCalculator({ properties }: DealCalculatorProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [inputs, setInputs] = useState({
    purchasePrice: '',
    rehabBudget: '',
    holdingMonths: '6',
    holdingCostsPerMonth: '800',
    closingCostsPct: '3',
    arv: '',
    monthlyRent: '1500',
  });

  const handlePropertySelect = (id: string) => {
    setSelectedPropertyId(id);
    if (id) {
      const p = properties.find((prop) => prop.id === id);
      if (p) {
        setInputs((prev) => ({
          ...prev,
          purchasePrice: p.purchase_price?.toString() || prev.purchasePrice,
          rehabBudget: p.rehab_budget?.toString() || prev.rehabBudget,
          arv: p.arv_estimate?.toString() || prev.arv,
        }));
      }
    }
  };

  const update = (field: string, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const calc = useMemo(() => {
    const purchase = parseFloat(inputs.purchasePrice) || 0;
    const rehab = parseFloat(inputs.rehabBudget) || 0;
    const months = parseFloat(inputs.holdingMonths) || 0;
    const holdingPerMonth = parseFloat(inputs.holdingCostsPerMonth) || 0;
    const closingPct = parseFloat(inputs.closingCostsPct) || 0;
    const arv = parseFloat(inputs.arv) || 0;
    const monthlyRent = parseFloat(inputs.monthlyRent) || 0;

    const holdingTotal = months * holdingPerMonth;
    const buyClosing = purchase * (closingPct / 100);
    const sellClosing = arv * (closingPct / 100);
    const totalInvestment = purchase + rehab + holdingTotal + buyClosing;

    // Flip scenario
    const flipProfit = arv - totalInvestment - sellClosing;
    const flipROI = totalInvestment > 0 ? (flipProfit / totalInvestment) * 100 : 0;

    // Rental scenario
    const annualRent = monthlyRent * 12;
    const annualExpenses = holdingPerMonth * 12; // Using holding costs as proxy for ongoing expenses
    const annualNOI = annualRent - annualExpenses;
    const cashOnCash = totalInvestment > 0 ? (annualNOI / totalInvestment) * 100 : 0;
    const capRate = arv > 0 ? (annualNOI / arv) * 100 : 0;

    return {
      purchase,
      rehab,
      holdingTotal,
      buyClosing,
      sellClosing,
      totalInvestment,
      flipProfit,
      flipROI,
      annualRent,
      annualExpenses,
      annualNOI,
      cashOnCash,
      capRate,
      monthlyRent,
    };
  }, [inputs]);

  const formatCurrency = (n: number) => {
    const sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(Math.round(n)).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Property Selector */}
      {properties.length > 0 && (
        <div className="glass rounded-xl p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pre-fill from property (optional)
          </label>
          <select
            value={selectedPropertyId}
            onChange={(e) => handlePropertySelect(e.target.value)}
            className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Select a property --</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}, {p.city} {p.state}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Inputs */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Calculator size={16} className="text-indigo-400" />
          Deal Inputs
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Purchase Price</label>
            <input
              type="number"
              value={inputs.purchasePrice}
              onChange={(e) => update('purchasePrice', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="150000"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Rehab Budget</label>
            <input
              type="number"
              value={inputs.rehabBudget}
              onChange={(e) => update('rehabBudget', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="35000"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Holding Months</label>
            <input
              type="number"
              value={inputs.holdingMonths}
              onChange={(e) => update('holdingMonths', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="6"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Holding Cost/mo</label>
            <input
              type="number"
              value={inputs.holdingCostsPerMonth}
              onChange={(e) => update('holdingCostsPerMonth', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="800"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Closing Costs %</label>
            <input
              type="number"
              value={inputs.closingCostsPct}
              onChange={(e) => update('closingCostsPct', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="3"
              min="0"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">ARV (After Repair Value)</label>
            <input
              type="number"
              value={inputs.arv}
              onChange={(e) => update('arv', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="225000"
              min="0"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Monthly Rent (for rental scenario)</label>
            <input
              type="number"
              value={inputs.monthlyRent}
              onChange={(e) => update('monthlyRent', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="1500"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Investment Summary */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign size={16} className="text-emerald-400" />
          Investment Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Purchase</p>
            <p className="text-lg font-bold text-white">{formatCurrency(calc.purchase)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Rehab</p>
            <p className="text-lg font-bold text-white">{formatCurrency(calc.rehab)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Holding Costs</p>
            <p className="text-lg font-bold text-white">{formatCurrency(calc.holdingTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Closing Costs (buy)</p>
            <p className="text-lg font-bold text-white">{formatCurrency(calc.buyClosing)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#2a2a4a]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-300">Total Investment</p>
            <p className="text-2xl font-bold text-indigo-400">{formatCurrency(calc.totalInvestment)}</p>
          </div>
        </div>
      </div>

      {/* Side by Side Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Flip Scenario */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-400" />
            Flip Scenario
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
              <span className="text-sm text-gray-400">ARV (Sale Price)</span>
              <span className="text-sm font-medium text-white">{formatCurrency(parseFloat(inputs.arv) || 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
              <span className="text-sm text-gray-400">Total Investment</span>
              <span className="text-sm font-medium text-white">{formatCurrency(calc.totalInvestment)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
              <span className="text-sm text-gray-400">Sell Closing Costs</span>
              <span className="text-sm font-medium text-white">{formatCurrency(calc.sellClosing)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-semibold text-gray-200">Projected Profit</span>
              <span className={`text-xl font-bold ${calc.flipProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(calc.flipProfit)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 bg-[#1a1a3a] rounded-lg px-3">
              <span className="text-sm font-medium text-gray-300">ROI</span>
              <span className={`text-lg font-bold ${calc.flipROI >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {calc.flipROI.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Rental Scenario */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Home size={16} className="text-blue-400" />
            Rental Scenario
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
              <span className="text-sm text-gray-400">Monthly Rent</span>
              <span className="text-sm font-medium text-white">{formatCurrency(calc.monthlyRent)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
              <span className="text-sm text-gray-400">Annual Gross Rent</span>
              <span className="text-sm font-medium text-white">{formatCurrency(calc.annualRent)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#2a2a4a]">
              <span className="text-sm text-gray-400">Annual Expenses (est.)</span>
              <span className="text-sm font-medium text-white">{formatCurrency(calc.annualExpenses)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-semibold text-gray-200">Annual NOI</span>
              <span className={`text-xl font-bold ${calc.annualNOI >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(calc.annualNOI)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 bg-[#1a1a3a] rounded-lg px-3">
              <span className="text-sm font-medium text-gray-300">Cash-on-Cash</span>
              <span className={`text-lg font-bold ${calc.cashOnCash >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {calc.cashOnCash.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between py-2 bg-[#1a1a3a] rounded-lg px-3">
              <span className="text-sm font-medium text-gray-300">Cap Rate</span>
              <span className={`text-lg font-bold ${calc.capRate >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {calc.capRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

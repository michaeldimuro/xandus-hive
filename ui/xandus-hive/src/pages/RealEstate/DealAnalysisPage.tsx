import { useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { usePropertyStore } from '@/stores/propertyStore';
import { DealCalculator } from '@/components/RealEstate/DealCalculator';

export default function DealAnalysisPage() {
  const { properties, fetchProperties } = usePropertyStore();

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Calculator size={28} className="text-indigo-400" />
          Deal Analysis
        </h1>
        <p className="text-gray-400 mt-1">
          Calculate ROI, cash-on-cash returns, and compare flip vs. rental scenarios
        </p>
      </div>

      {/* Calculator */}
      <DealCalculator properties={properties} />
    </div>
  );
}

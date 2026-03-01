import { useState } from 'react';
import { Search, MapPin, BarChart3, Users, TrendingUp, Clock, Database } from 'lucide-react';

export default function MarketDataPage() {
  const [zipCode, setZipCode] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipCode.trim()) {
      setSearched(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 size={28} className="text-indigo-400" />
          Market Data
        </h1>
        <p className="text-gray-400 mt-1">
          Research market statistics, demographics, and trends by zip code
        </p>
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-5">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex items-center gap-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg px-4 py-2 flex-1 max-w-md">
            <MapPin size={18} className="text-gray-500 shrink-0" />
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter zip code (e.g. 75001)"
              maxLength={10}
              className="bg-transparent outline-none text-sm flex-1 text-white placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition"
          >
            <Search size={16} />
            Search
          </button>
        </form>
      </div>

      {searched ? (
        /* Placeholder Data Sections */
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="glass rounded-xl p-4 border-l-4 border-indigo-500">
            <div className="flex items-start gap-3">
              <Database size={20} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Market data integration coming in Phase 9</p>
                <p className="text-xs text-gray-400 mt-1">
                  API Explorer will connect to data sources like Zillow, Census, and ATTOM for live market data.
                  The sections below show the data layout that will be populated automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Demographics Placeholder */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              Demographics - {zipCode}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Population', value: '--' },
                { label: 'Median Age', value: '--' },
                { label: 'Median Income', value: '--' },
                { label: 'Owner Occupied', value: '--' },
              ].map((item) => (
                <div key={item.label} className="bg-[#1a1a3a] rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-lg font-bold text-gray-600 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Market Stats Placeholder */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              Market Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Median Home Price', value: '--' },
                { label: 'Avg Days on Market', value: '--' },
                { label: 'Price/Sqft', value: '--' },
                { label: 'YoY Appreciation', value: '--' },
                { label: 'Inventory', value: '--' },
                { label: 'Sale-to-List Ratio', value: '--' },
                { label: 'Avg Rent (3BR)', value: '--' },
                { label: 'Rent/Price Ratio', value: '--' },
              ].map((item) => (
                <div key={item.label} className="bg-[#1a1a3a] rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-lg font-bold text-gray-600 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Data Freshness */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              Data Freshness
            </h3>
            <div className="bg-[#1a1a3a] rounded-lg p-4 text-center">
              <Clock size={24} className="mx-auto text-gray-600 mb-2" />
              <p className="text-sm text-gray-400">No data pulls configured for this zip code</p>
              <p className="text-xs text-gray-600 mt-1">
                Configure API data pulls in Phase 9 to keep market data fresh
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass rounded-xl p-12 text-center">
          <BarChart3 size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Market Research</h3>
          <p className="text-gray-400 mb-2 max-w-md mx-auto">
            Enter a zip code above to see market data, demographics, and real estate trends.
          </p>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Live market data integration will be available in Phase 9 (API Explorer).
            For now, this page shows the data layout that will be populated with real data from
            sources like Zillow, ATTOM, and Census APIs.
          </p>
        </div>
      )}
    </div>
  );
}

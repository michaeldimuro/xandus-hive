/**
 * EndpointBrowser — Table of API endpoints for a selected source.
 * Supports method filtering and select/deselect toggling.
 */

import React, { useState } from 'react';
import { Search, Filter, Lock, Unlock } from 'lucide-react';
import { useApiExplorerStore } from '@/stores/apiExplorerStore';
import type { ApiEndpoint } from '@/stores/apiExplorerStore';
import { EndpointActions } from './EndpointActions';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-yellow-500/20 text-yellow-400',
  PATCH: 'bg-orange-500/20 text-orange-400',
  DELETE: 'bg-red-500/20 text-red-400',
};

const ALL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const EndpointBrowser: React.FC = () => {
  const endpoints = useApiExplorerStore((s) => s.endpoints);
  const loadingEndpoints = useApiExplorerStore((s) => s.loadingEndpoints);
  const selectedSourceId = useApiExplorerStore((s) => s.selectedSourceId);
  const sources = useApiExplorerStore((s) => s.sources);
  const toggleEndpointSelected = useApiExplorerStore((s) => s.toggleEndpointSelected);

  const [methodFilter, setMethodFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedSource = sources.find((s) => s.id === selectedSourceId);

  if (!selectedSourceId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Select an API source to browse its endpoints</p>
      </div>
    );
  }

  const filteredEndpoints = endpoints.filter((ep) => {
    if (methodFilter && ep.method !== methodFilter) {return false;}
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ep.path.toLowerCase().includes(q) ||
        (ep.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // Count methods for filter badges
  const methodCounts: Record<string, number> = {};
  for (const ep of endpoints) {
    methodCounts[ep.method] = (methodCounts[ep.method] || 0) + 1;
  }

  return (
    <div className="space-y-4">
      {/* Source Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">
          {selectedSource?.name ?? 'Endpoints'}
        </h2>
        {selectedSource?.base_url && (
          <p className="text-sm text-gray-500 font-mono mt-1">
            {selectedSource.base_url}
          </p>
        )}
      </div>

      {/* Loading state */}
      {loadingEndpoints && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      )}

      {/* Empty state */}
      {!loadingEndpoints && endpoints.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <h3 className="text-lg font-medium text-white mb-2">
            No endpoints found
          </h3>
          <p className="text-gray-400">
            {selectedSource?.status === 'crawled'
              ? 'The crawl completed but no endpoints were discovered. You can re-crawl or add endpoints manually in the future.'
              : selectedSource?.status === 'crawling'
                ? 'Crawl is in progress. Endpoints will appear once the crawl completes.'
                : 'Trigger a documentation crawl to discover endpoints automatically.'}
          </p>
        </div>
      )}

      {/* Filters + Search */}
      {!loadingEndpoints && endpoints.length > 0 && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search endpoints..."
                className="w-full pl-9 pr-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Method filters */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500 shrink-0" />
              <button
                onClick={() => setMethodFilter(null)}
                className={`px-2.5 py-1 text-xs rounded-lg transition ${
                  methodFilter === null
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-gray-400 hover:bg-[#1a1a3a] border border-transparent'
                }`}
              >
                All ({endpoints.length})
              </button>
              {ALL_METHODS.filter((m) => methodCounts[m]).map((method) => (
                <button
                  key={method}
                  onClick={() =>
                    setMethodFilter(methodFilter === method ? null : method)
                  }
                  className={`px-2.5 py-1 text-xs rounded-lg transition ${
                    methodFilter === method
                      ? `${METHOD_COLORS[method]} border border-current/30`
                      : 'text-gray-400 hover:bg-[#1a1a3a] border border-transparent'
                  }`}
                >
                  {method} ({methodCounts[method]})
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a4a] text-gray-400 text-left">
                  <th className="px-4 py-3 w-10">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-4 py-3 w-20">Method</th>
                  <th className="px-4 py-3">Path</th>
                  <th className="px-4 py-3 hidden lg:table-cell">
                    Description
                  </th>
                  <th className="px-4 py-3 w-10">Auth</th>
                  <th className="px-4 py-3 w-48 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEndpoints.map((ep) => (
                  <EndpointRow
                    key={ep.id}
                    endpoint={ep}
                    onToggleSelected={toggleEndpointSelected}
                  />
                ))}
              </tbody>
            </table>

            {filteredEndpoints.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                No endpoints match the current filters
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Row                                                                */
/* ------------------------------------------------------------------ */

interface RowProps {
  endpoint: ApiEndpoint;
  onToggleSelected: (id: string, selected: boolean) => Promise<void>;
}

const EndpointRow: React.FC<RowProps> = ({ endpoint, onToggleSelected }) => {
  const colorClass = METHOD_COLORS[endpoint.method] ?? 'bg-gray-500/20 text-gray-400';

  return (
    <tr className="border-b border-[#2a2a4a]/50 hover:bg-[#1a1a3a]/50 transition">
      {/* Checkbox */}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={endpoint.selected}
          onChange={(e) => onToggleSelected(endpoint.id, e.target.checked)}
          className="rounded border-[#2a2a4a] bg-[#12122a] text-indigo-500 focus:ring-indigo-500"
        />
      </td>

      {/* Method badge */}
      <td className="px-4 py-3">
        <span
          className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${colorClass}`}
        >
          {endpoint.method}
        </span>
      </td>

      {/* Path */}
      <td className="px-4 py-3 font-mono text-white text-xs">
        {endpoint.path}
      </td>

      {/* Description */}
      <td className="px-4 py-3 text-gray-400 hidden lg:table-cell max-w-xs truncate">
        {endpoint.description ?? '--'}
      </td>

      {/* Auth */}
      <td className="px-4 py-3">
        {endpoint.auth_required ? (
          <Lock size={14} className="text-yellow-400" />
        ) : (
          <Unlock size={14} className="text-gray-600" />
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <EndpointActions endpoint={endpoint} />
      </td>
    </tr>
  );
};

/**
 * ApiExplorerPage — Split-panel layout for managing API sources and endpoints.
 *
 * Left (1/3): API source list with status badges + "Add API" button.
 * Right (2/3): EndpointBrowser for the selected source.
 */

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Globe,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useApiExplorerStore } from '@/stores/apiExplorerStore';
import type { ApiSource } from '@/stores/apiExplorerStore';
import { ApiSourceForm } from './ApiSourceForm';
import { EndpointBrowser } from './EndpointBrowser';

/* ------------------------------------------------------------------ */
/*  Status badge helpers                                               */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<ApiSource['status'], string> = {
  pending: 'bg-gray-500/20 text-gray-400',
  crawling: 'bg-yellow-500/20 text-yellow-400 animate-pulse',
  crawled: 'bg-green-500/20 text-green-400',
  error: 'bg-red-500/20 text-red-400',
};

const STATUS_LABELS: Record<ApiSource['status'], string> = {
  pending: 'Pending',
  crawling: 'Crawling...',
  crawled: 'Crawled',
  error: 'Error',
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export const ApiExplorerPage: React.FC = () => {
  const sources = useApiExplorerStore((s) => s.sources);
  const loadingSources = useApiExplorerStore((s) => s.loadingSources);
  const selectedSourceId = useApiExplorerStore((s) => s.selectedSourceId);
  const fetchSources = useApiExplorerStore((s) => s.fetchSources);
  const setSelectedSource = useApiExplorerStore((s) => s.setSelectedSource);
  const deleteSource = useApiExplorerStore((s) => s.deleteSource);
  const triggerCrawl = useApiExplorerStore((s) => s.triggerCrawl);

  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Poll for crawling sources to pick up status changes
  useEffect(() => {
    const hasCrawling = sources.some((s) => s.status === 'crawling');
    if (!hasCrawling) {return;}

    const interval = setInterval(() => {
      fetchSources();
    }, 3000);

    return () => clearInterval(interval);
  }, [sources, fetchSources]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API source and all its endpoints?')) {return;}
    await deleteSource(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">API Explorer</h1>
          <p className="text-gray-400 mt-1">
            Manage API sources, browse endpoints, and configure data pulls
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus size={20} />
          Add API
        </button>
      </div>

      {/* Main split layout */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-14rem)]">
        {/* Left panel — source list (1/3) */}
        <div className="lg:w-1/3 space-y-3">
          {loadingSources ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : sources.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <Globe size={40} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-2">
                No API sources
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Add your first API to start exploring endpoints
              </p>
              <button
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition"
              >
                <Plus size={20} />
                Add API
              </button>
            </div>
          ) : (
            sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                isSelected={source.id === selectedSourceId}
                onSelect={() => setSelectedSource(source.id)}
                onDelete={() => handleDelete(source.id)}
                onCrawl={() => triggerCrawl(source.id)}
              />
            ))
          )}
        </div>

        {/* Right panel — endpoint browser (2/3) */}
        <div className="lg:w-2/3 glass rounded-xl p-6">
          <EndpointBrowser />
        </div>
      </div>

      {/* Add Source dialog */}
      <ApiSourceForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Source Card                                                        */
/* ------------------------------------------------------------------ */

interface SourceCardProps {
  source: ApiSource;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onCrawl: () => void;
}

const SourceCard: React.FC<SourceCardProps> = ({
  source,
  isSelected,
  onSelect,
  onDelete,
  onCrawl,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`glass rounded-xl p-4 cursor-pointer transition border ${
        isSelected
          ? 'border-indigo-500/50 bg-indigo-500/5'
          : 'border-transparent hover:border-[#2a2a4a]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white truncate">{source.name}</h3>
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[source.status]}`}
            >
              {STATUS_LABELS[source.status]}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-mono truncate">
            {source.base_url}
          </p>
          {source.last_crawled_at && (
            <p className="text-xs text-gray-600 mt-1">
              Crawled{' '}
              {new Date(source.last_crawled_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>

      {/* Action row */}
      <div
        className="flex items-center gap-2 mt-3 pt-3 border-t border-[#2a2a4a]/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCrawl}
          disabled={source.status === 'crawling'}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition disabled:opacity-40"
          title="Crawl documentation"
        >
          <RefreshCw
            size={13}
            className={source.status === 'crawling' ? 'animate-spin' : ''}
          />
          Crawl
        </button>
        {source.docs_url && (
          <a
            href={source.docs_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-400 hover:bg-[#1a1a3a] rounded-lg transition"
            title="Open docs"
          >
            <ExternalLink size={13} />
            Docs
          </a>
        )}
        <div className="flex-1" />
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition"
          title="Delete source"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

export default ApiExplorerPage;

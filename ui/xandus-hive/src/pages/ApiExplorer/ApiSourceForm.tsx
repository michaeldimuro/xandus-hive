/**
 * ApiSourceForm — Dialog for creating / editing an API source.
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApiExplorerStore } from '@/stores/apiExplorerStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

type AuthType = 'none' | 'api_key' | 'bearer' | 'oauth';

export const ApiSourceForm: React.FC<Props> = ({ open, onClose }) => {
  const createSource = useApiExplorerStore((s) => s.createSource);
  const triggerCrawl = useApiExplorerStore((s) => s.triggerCrawl);

  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [docsUrl, setDocsUrl] = useState('');
  const [authType, setAuthType] = useState<AuthType>('none');
  const [authValue, setAuthValue] = useState('');
  const [crawlAfterCreate, setCrawlAfterCreate] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!open) {return null;}

  const reset = () => {
    setName('');
    setBaseUrl('');
    setDocsUrl('');
    setAuthType('none');
    setAuthValue('');
    setCrawlAfterCreate(true);
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const authConfig: Record<string, unknown> =
      authType === 'none' ? {} : { type: authType, value: authValue };

    const source = await createSource({
      name,
      base_url: baseUrl,
      docs_url: docsUrl,
      auth_config: authConfig,
    });

    if (source && crawlAfterCreate) {
      triggerCrawl(source.id);
    }

    setSubmitting(false);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#12122a] border border-[#2a2a4a] rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2a4a] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add API Source</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Stripe API"
            />
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Base URL *
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://api.example.com/v1"
            />
          </div>

          {/* Docs URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Documentation URL *
            </label>
            <input
              type="url"
              value={docsUrl}
              onChange={(e) => setDocsUrl(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://docs.example.com/api"
            />
          </div>

          {/* Auth Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Authentication
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as AuthType)}
              className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="none">None</option>
              <option value="api_key">API Key</option>
              <option value="bearer">Bearer Token</option>
              <option value="oauth">OAuth</option>
            </select>
          </div>

          {/* Auth Value (shown when auth type is not none) */}
          {authType !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {authType === 'api_key'
                  ? 'API Key'
                  : authType === 'bearer'
                    ? 'Bearer Token'
                    : 'OAuth Config (JSON)'}
              </label>
              {authType === 'oauth' ? (
                <textarea
                  value={authValue}
                  onChange={(e) => setAuthValue(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  placeholder='{"client_id": "...", "client_secret": "...", "token_url": "..."}'
                />
              ) : (
                <input
                  type="text"
                  value={authValue}
                  onChange={(e) => setAuthValue(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  placeholder="sk-..."
                />
              )}
            </div>
          )}

          {/* Crawl checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={crawlAfterCreate}
              onChange={(e) => setCrawlAfterCreate(e.target.checked)}
              className="rounded border-[#2a2a4a] bg-[#12122a] text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-300">
              Start crawling documentation immediately
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="px-4 py-2 text-gray-400 hover:bg-[#1a1a3a] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

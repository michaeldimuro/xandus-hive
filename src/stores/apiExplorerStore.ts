/**
 * API Explorer Store
 * Zustand store backed by Supabase for api_sources, api_endpoints, api_data_pulls
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase, getAuthHeaders } from '@/lib/supabase';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ApiSource {
  id: string;
  name: string;
  base_url: string;
  docs_url: string;
  auth_config: Record<string, unknown> | null;
  status: 'pending' | 'crawling' | 'crawled' | 'error';
  last_crawled_at: string | null;
  created_at: string;
}

export interface ApiEndpoint {
  id: string;
  source_id: string;
  method: string;
  path: string;
  description: string | null;
  parameters: Record<string, unknown> | null;
  request_body: Record<string, unknown> | null;
  response_schema: Record<string, unknown> | null;
  auth_required: boolean;
  selected: boolean;
  created_at: string;
}

export interface ApiDataPull {
  id: string;
  endpoint_id: string;
  trigger_id: string | null;
  transform_config: Record<string, unknown> | null;
  destination_table: string | null;
  last_pull_at: string | null;
  last_result: Record<string, unknown> | null;
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface ApiExplorerState {
  // Data
  sources: ApiSource[];
  endpoints: ApiEndpoint[];
  dataPulls: ApiDataPull[];
  selectedSourceId: string | null;

  // Loading flags
  loadingSources: boolean;
  loadingEndpoints: boolean;

  // Source CRUD
  fetchSources: () => Promise<void>;
  createSource: (source: Omit<ApiSource, 'id' | 'status' | 'last_crawled_at' | 'created_at'>) => Promise<ApiSource | null>;
  updateSource: (id: string, updates: Partial<ApiSource>) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;

  // Endpoints
  fetchEndpoints: (sourceId: string) => Promise<void>;
  toggleEndpointSelected: (endpointId: string, selected: boolean) => Promise<void>;

  // Data pulls
  fetchDataPulls: (endpointId: string) => Promise<void>;
  createDataPull: (pull: Omit<ApiDataPull, 'id' | 'last_pull_at' | 'last_result'>) => Promise<ApiDataPull | null>;
  deleteDataPull: (id: string) => Promise<void>;

  // Crawl
  triggerCrawl: (sourceId: string) => Promise<void>;

  // Selection
  setSelectedSource: (sourceId: string | null) => void;
}

export const useApiExplorerStore = create<ApiExplorerState>()(
  devtools(
    (set, get) => ({
      sources: [],
      endpoints: [],
      dataPulls: [],
      selectedSourceId: null,
      loadingSources: true,
      loadingEndpoints: false,

      /* ---- Sources ---- */

      fetchSources: async () => {
        set({ loadingSources: true });
        const { data, error } = await supabase
          .from('api_sources')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching API sources:', error);
          set({ loadingSources: false });
          return;
        }
        set({ sources: data ?? [], loadingSources: false });
      },

      createSource: async (source) => {
        const { data, error } = await supabase
          .from('api_sources')
          .insert({ ...source, status: 'pending' })
          .select()
          .single();

        if (error) {
          console.error('Error creating API source:', error);
          return null;
        }
        // Prepend to list
        set((s) => ({ sources: [data, ...s.sources] }));
        return data;
      },

      updateSource: async (id, updates) => {
        const { error } = await supabase
          .from('api_sources')
          .update(updates)
          .eq('id', id);

        if (error) {
          console.error('Error updating API source:', error);
          return;
        }
        set((s) => ({
          sources: s.sources.map((src) => (src.id === id ? { ...src, ...updates } : src)),
        }));
      },

      deleteSource: async (id) => {
        const { error } = await supabase
          .from('api_sources')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting API source:', error);
          return;
        }
        set((s) => ({
          sources: s.sources.filter((src) => src.id !== id),
          selectedSourceId: s.selectedSourceId === id ? null : s.selectedSourceId,
          endpoints: s.selectedSourceId === id ? [] : s.endpoints,
        }));
      },

      /* ---- Endpoints ---- */

      fetchEndpoints: async (sourceId) => {
        set({ loadingEndpoints: true });
        const { data, error } = await supabase
          .from('api_endpoints')
          .select('*')
          .eq('source_id', sourceId)
          .order('path', { ascending: true });

        if (error) {
          console.error('Error fetching endpoints:', error);
          set({ loadingEndpoints: false });
          return;
        }
        set({ endpoints: data ?? [], loadingEndpoints: false });
      },

      toggleEndpointSelected: async (endpointId, selected) => {
        const { error } = await supabase
          .from('api_endpoints')
          .update({ selected })
          .eq('id', endpointId);

        if (error) {
          console.error('Error toggling endpoint:', error);
          return;
        }
        set((s) => ({
          endpoints: s.endpoints.map((ep) =>
            ep.id === endpointId ? { ...ep, selected } : ep
          ),
        }));
      },

      /* ---- Data Pulls ---- */

      fetchDataPulls: async (endpointId) => {
        const { data, error } = await supabase
          .from('api_data_pulls')
          .select('*')
          .eq('endpoint_id', endpointId);

        if (error) {
          console.error('Error fetching data pulls:', error);
          return;
        }
        set({ dataPulls: data ?? [] });
      },

      createDataPull: async (pull) => {
        const { data, error } = await supabase
          .from('api_data_pulls')
          .insert(pull)
          .select()
          .single();

        if (error) {
          console.error('Error creating data pull:', error);
          return null;
        }
        set((s) => ({ dataPulls: [...s.dataPulls, data] }));
        return data;
      },

      deleteDataPull: async (id) => {
        const { error } = await supabase
          .from('api_data_pulls')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting data pull:', error);
          return;
        }
        set((s) => ({ dataPulls: s.dataPulls.filter((dp) => dp.id !== id) }));
      },

      /* ---- Crawl ---- */

      triggerCrawl: async (sourceId) => {
        // Optimistically set crawling
        set((s) => ({
          sources: s.sources.map((src) =>
            src.id === sourceId ? { ...src, status: 'crawling' as const } : src
          ),
        }));

        try {
          const headers = await getAuthHeaders();
          const res = await fetch('/api/api-sources/crawl', {
            method: 'POST',
            headers: headers ?? { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceId }),
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            console.error('Crawl request failed:', body);
            // Revert optimistic update
            get().fetchSources();
          }
        } catch (err) {
          console.error('Crawl request error:', err);
          get().fetchSources();
        }
      },

      /* ---- Selection ---- */

      setSelectedSource: (sourceId) => {
        set({ selectedSourceId: sourceId, endpoints: [], loadingEndpoints: false });
        if (sourceId) {
          get().fetchEndpoints(sourceId);
        }
      },
    }),
    { name: 'api-explorer-store', enabled: import.meta.env.DEV }
  )
);

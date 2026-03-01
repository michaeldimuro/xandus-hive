/**
 * Property Store
 * Zustand store for real estate properties CRUD via Supabase
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export type PropertyStage =
  | 'sourced'
  | 'analyzing'
  | 'offer_pending'
  | 'under_contract'
  | 'rehab'
  | 'listed'
  | 'sold'
  | 'rented';

export type PropertyStrategy = 'flip' | 'rental' | 'wholesale';

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lot_size: number | null;
  year_built: number | null;
  stage: PropertyStage;
  strategy: PropertyStrategy;
  purchase_price: number | null;
  arv_estimate: number | null;
  rehab_budget: number | null;
  source: string | null;
  notes: string | null;
  photos: string[] | null;
  documents: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyComp {
  id: string;
  property_id: string;
  address: string;
  sale_price: number | null;
  sale_date: string | null;
  sqft: number | null;
  beds: number | null;
  baths: number | null;
  distance_miles: number | null;
  source: string | null;
  created_at: string;
}

export interface PropertyFinancial {
  id: string;
  property_id: string;
  expense_type: string;
  amount: number;
  paid_to: string | null;
  subcontractor_id: string | null;
  date: string | null;
  notes: string | null;
  created_at: string;
}

interface PropertyStoreState {
  properties: Property[];
  loading: boolean;
  selectedProperty: Property | null;
  comps: PropertyComp[];
  financials: PropertyFinancial[];
  detailLoading: boolean;

  fetchProperties: () => Promise<void>;
  createProperty: (data: Partial<Property>) => Promise<Property | null>;
  updateProperty: (id: string, data: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;

  fetchPropertyDetail: (id: string) => Promise<void>;
  clearDetail: () => void;

  fetchComps: (propertyId: string) => Promise<void>;
  createComp: (data: Partial<PropertyComp>) => Promise<void>;
  deleteComp: (id: string) => Promise<void>;

  fetchFinancials: (propertyId: string) => Promise<void>;
  createFinancial: (data: Partial<PropertyFinancial>) => Promise<void>;
  deleteFinancial: (id: string) => Promise<void>;
}

export const usePropertyStore = create<PropertyStoreState>()(
  devtools(
    (set, get) => ({
      properties: [],
      loading: true,
      selectedProperty: null,
      comps: [],
      financials: [],
      detailLoading: false,

      fetchProperties: async () => {
        set({ loading: true });
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching properties:', error);
          set({ loading: false });
          return;
        }
        set({ properties: data || [], loading: false });
      },

      createProperty: async (data) => {
        const { data: created, error } = await supabase
          .from('properties')
          .insert(data)
          .select()
          .single();
        if (error) {
          console.error('Error creating property:', error);
          return null;
        }
        set((state) => ({ properties: [created, ...state.properties] }));
        return created;
      },

      updateProperty: async (id, data) => {
        const { error } = await supabase
          .from('properties')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) {
          console.error('Error updating property:', error);
          return;
        }
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
          ),
          selectedProperty:
            state.selectedProperty?.id === id
              ? { ...state.selectedProperty, ...data, updated_at: new Date().toISOString() }
              : state.selectedProperty,
        }));
      },

      deleteProperty: async (id) => {
        const { error } = await supabase.from('properties').delete().eq('id', id);
        if (error) {
          console.error('Error deleting property:', error);
          return;
        }
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
        }));
      },

      fetchPropertyDetail: async (id) => {
        set({ detailLoading: true });
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          console.error('Error fetching property detail:', error);
          set({ detailLoading: false });
          return;
        }
        set({ selectedProperty: data, detailLoading: false });
        // Also fetch comps and financials
        get().fetchComps(id);
        get().fetchFinancials(id);
      },

      clearDetail: () => {
        set({ selectedProperty: null, comps: [], financials: [] });
      },

      fetchComps: async (propertyId) => {
        const { data, error } = await supabase
          .from('property_comps')
          .select('*')
          .eq('property_id', propertyId)
          .order('sale_date', { ascending: false });
        if (error) {
          console.error('Error fetching comps:', error);
          return;
        }
        set({ comps: data || [] });
      },

      createComp: async (data) => {
        const { data: created, error } = await supabase
          .from('property_comps')
          .insert(data)
          .select()
          .single();
        if (error) {
          console.error('Error creating comp:', error);
          return;
        }
        set((state) => ({ comps: [created, ...state.comps] }));
      },

      deleteComp: async (id) => {
        const { error } = await supabase.from('property_comps').delete().eq('id', id);
        if (error) {
          console.error('Error deleting comp:', error);
          return;
        }
        set((state) => ({ comps: state.comps.filter((c) => c.id !== id) }));
      },

      fetchFinancials: async (propertyId) => {
        const { data, error } = await supabase
          .from('property_financials')
          .select('*')
          .eq('property_id', propertyId)
          .order('date', { ascending: false });
        if (error) {
          console.error('Error fetching financials:', error);
          return;
        }
        set({ financials: data || [] });
      },

      createFinancial: async (data) => {
        const { data: created, error } = await supabase
          .from('property_financials')
          .insert(data)
          .select()
          .single();
        if (error) {
          console.error('Error creating financial:', error);
          return;
        }
        set((state) => ({ financials: [created, ...state.financials] }));
      },

      deleteFinancial: async (id) => {
        const { error } = await supabase
          .from('property_financials')
          .delete()
          .eq('id', id);
        if (error) {
          console.error('Error deleting financial:', error);
          return;
        }
        set((state) => ({
          financials: state.financials.filter((f) => f.id !== id),
        }));
      },
    }),
    { name: 'property-store', enabled: import.meta.env.DEV }
  )
);

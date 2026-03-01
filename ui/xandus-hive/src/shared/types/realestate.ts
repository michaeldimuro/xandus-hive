export type PropertyStage = 'sourced' | 'analyzing' | 'offer_pending' | 'under_contract' | 'rehab' | 'listed' | 'sold' | 'rented';
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
  strategy: PropertyStrategy | null;
  purchase_price: number | null;
  arv_estimate: number | null;
  rehab_budget: number | null;
  source: string | null;
  notes: string | null;
  photos: string[];
  documents: string[];
  created_at: string;
  updated_at: string;
}

export interface PropertyCreate {
  address: string;
  city: string;
  state: string;
  zip: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  lot_size?: number;
  year_built?: number;
  stage?: PropertyStage;
  strategy?: PropertyStrategy;
  purchase_price?: number;
  arv_estimate?: number;
  rehab_budget?: number;
  source?: string;
  notes?: string;
}

export interface PropertyUpdate extends Partial<PropertyCreate> {}

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

export interface PropertyCompCreate {
  property_id: string;
  address: string;
  sale_price?: number;
  sale_date?: string;
  sqft?: number;
  beds?: number;
  baths?: number;
  distance_miles?: number;
  source?: string;
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

export interface PropertyFinancialCreate {
  property_id: string;
  expense_type: string;
  amount: number;
  paid_to?: string;
  subcontractor_id?: string;
  date?: string;
  notes?: string;
}

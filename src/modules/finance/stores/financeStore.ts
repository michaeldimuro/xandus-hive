import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment';

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  last_four: string | null;
  current_balance: number;
  business: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransaction {
  id: string;
  account_id: string;
  date: string;
  amount: number;
  description: string;
  category: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  imported_from: 'csv' | 'ofx' | 'plaid' | 'manual' | null;
  created_at: string;
}

export type PlanType = 'budget' | 'savings_goal' | 'debt_payoff';
export type PlanStatus = 'active' | 'completed' | 'archived';

export interface FinancialPlan {
  id: string;
  name: string;
  type: PlanType;
  config: Record<string, unknown>;
  status: PlanStatus;
  created_at: string;
  updated_at: string;
}

interface FinanceStoreState {
  // Data
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
  plans: FinancialPlan[];
  loading: boolean;
  transactionsLoading: boolean;
  plansLoading: boolean;

  // Account CRUD
  fetchAccounts: () => Promise<void>;
  createAccount: (account: Omit<FinancialAccount, 'id' | 'created_at' | 'updated_at'>) => Promise<FinancialAccount | null>;
  updateAccount: (id: string, updates: Partial<FinancialAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Transaction CRUD
  fetchTransactions: (filters?: {
    account_id?: string;
    category?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  createTransaction: (tx: Omit<FinancialTransaction, 'id' | 'created_at'>) => Promise<FinancialTransaction | null>;
  bulkCreateTransactions: (txs: Omit<FinancialTransaction, 'id' | 'created_at'>[]) => Promise<number>;
  deleteTransaction: (id: string) => Promise<void>;

  // Plan CRUD
  fetchPlans: () => Promise<void>;
  createPlan: (plan: Omit<FinancialPlan, 'id' | 'created_at' | 'updated_at'>) => Promise<FinancialPlan | null>;
  updatePlan: (id: string, updates: Partial<FinancialPlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;

  // Computed
  totalBalance: () => number;
  balanceByType: () => Record<AccountType, number>;
}

export const useFinanceStore = create<FinanceStoreState>((set, get) => ({
  accounts: [],
  transactions: [],
  plans: [],
  loading: true,
  transactionsLoading: true,
  plansLoading: true,

  // ── Account CRUD ─────────────────────────────────────────────────────────

  fetchAccounts: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('financial_accounts')
      .select('*')
      .order('name');
    if (data) {set({ accounts: data as FinancialAccount[], loading: false });}
    else {set({ loading: false });}
  },

  createAccount: async (account) => {
    const { data, error } = await supabase
      .from('financial_accounts')
      .insert(account)
      .select()
      .single();
    if (error || !data) {return null;}
    const created = data as FinancialAccount;
    set((s) => ({ accounts: [...s.accounts, created] }));
    return created;
  },

  updateAccount: async (id, updates) => {
    const { data } = await supabase
      .from('financial_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (data) {
      const updated = data as FinancialAccount;
      set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? updated : a)) }));
    }
  },

  deleteAccount: async (id) => {
    const { error } = await supabase.from('financial_accounts').delete().eq('id', id);
    if (!error) {
      set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
    }
  },

  // ── Transaction CRUD ─────────────────────────────────────────────────────

  fetchTransactions: async (filters) => {
    set({ transactionsLoading: true });
    let query = supabase
      .from('financial_transactions')
      .select('*')
      .order('date', { ascending: false });

    if (filters?.account_id) {query = query.eq('account_id', filters.account_id);}
    if (filters?.category) {query = query.eq('category', filters.category);}
    if (filters?.date_from) {query = query.gte('date', filters.date_from);}
    if (filters?.date_to) {query = query.lte('date', filters.date_to);}
    if (filters?.limit) {query = query.limit(filters.limit);}
    if (filters?.offset) {query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);}

    const { data } = await query;
    if (data) {set({ transactions: data as FinancialTransaction[], transactionsLoading: false });}
    else {set({ transactionsLoading: false });}
  },

  createTransaction: async (tx) => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(tx)
      .select()
      .single();
    if (error || !data) {return null;}
    const created = data as FinancialTransaction;
    set((s) => ({ transactions: [created, ...s.transactions] }));
    return created;
  },

  bulkCreateTransactions: async (txs) => {
    if (txs.length === 0) {return 0;}
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(txs)
      .select();
    if (error || !data) {return 0;}
    const created = data as FinancialTransaction[];
    set((s) => ({ transactions: [...created, ...s.transactions] }));
    return created.length;
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
    if (!error) {
      set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
    }
  },

  // ── Plan CRUD ────────────────────────────────────────────────────────────

  fetchPlans: async () => {
    set({ plansLoading: true });
    const { data } = await supabase
      .from('financial_plans')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {set({ plans: data as FinancialPlan[], plansLoading: false });}
    else {set({ plansLoading: false });}
  },

  createPlan: async (plan) => {
    const { data, error } = await supabase
      .from('financial_plans')
      .insert(plan)
      .select()
      .single();
    if (error || !data) {return null;}
    const created = data as FinancialPlan;
    set((s) => ({ plans: [...s.plans, created] }));
    return created;
  },

  updatePlan: async (id, updates) => {
    const { data } = await supabase
      .from('financial_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (data) {
      const updated = data as FinancialPlan;
      set((s) => ({ plans: s.plans.map((p) => (p.id === id ? updated : p)) }));
    }
  },

  deletePlan: async (id) => {
    const { error } = await supabase.from('financial_plans').delete().eq('id', id);
    if (!error) {
      set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
    }
  },

  // ── Computed ─────────────────────────────────────────────────────────────

  totalBalance: () => {
    const { accounts } = get();
    return accounts.reduce((sum, a) => {
      const bal = Number(a.current_balance) || 0;
      return sum + (a.type === 'credit' ? -bal : bal);
    }, 0);
  },

  balanceByType: () => {
    const { accounts } = get();
    const result: Record<AccountType, number> = {
      checking: 0,
      savings: 0,
      credit: 0,
      investment: 0,
    };
    for (const a of accounts) {
      const bal = Number(a.current_balance) || 0;
      result[a.type] += bal;
    }
    return result;
  },
}));

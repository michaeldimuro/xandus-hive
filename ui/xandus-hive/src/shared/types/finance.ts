export type AccountType = 'checking' | 'savings' | 'credit' | 'investment';
export type ImportSource = 'csv' | 'ofx' | 'plaid' | 'manual';
export type PlanType = 'budget' | 'savings_goal' | 'debt_payoff';
export type PlanStatus = 'active' | 'completed' | 'archived';

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

export interface FinancialAccountCreate {
  name: string;
  type: AccountType;
  institution?: string;
  last_four?: string;
  current_balance?: number;
  business?: string;
}

export interface FinancialAccountUpdate extends Partial<FinancialAccountCreate> {}

export interface FinancialTransaction {
  id: string;
  account_id: string;
  date: string;
  amount: number;
  description: string | null;
  category: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  imported_from: ImportSource | null;
  created_at: string;
}

export interface FinancialTransactionCreate {
  account_id: string;
  date: string;
  amount: number;
  description?: string;
  category?: string;
  linked_entity_type?: string;
  linked_entity_id?: string;
  imported_from?: ImportSource;
}

export interface FinancialPlan {
  id: string;
  name: string;
  type: PlanType;
  config: Record<string, unknown>;
  status: PlanStatus;
  created_at: string;
  updated_at: string;
}

export interface FinancialPlanCreate {
  name: string;
  type: PlanType;
  config: Record<string, unknown>;
}

export interface FinancialPlanUpdate extends Partial<FinancialPlanCreate> {
  status?: PlanStatus;
}

import { useState, useEffect, useMemo } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import type { FinancialPlan } from '../stores/financeStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Plus, Trash2, Save } from 'lucide-react';

interface BudgetCategory {
  name: string;
  budgeted: number;
  type: 'income' | 'expense';
}

interface BudgetConfig {
  month: string; // YYYY-MM
  categories: BudgetCategory[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function BudgetEditor() {
  const plans = useFinanceStore((s) => s.plans);
  const transactions = useFinanceStore((s) => s.transactions);
  const createPlan = useFinanceStore((s) => s.createPlan);
  const updatePlan = useFinanceStore((s) => s.updatePlan);
  const fetchTransactions = useFinanceStore((s) => s.fetchTransactions);
  const fetchPlans = useFinanceStore((s) => s.fetchPlans);

  const [month, setMonth] = useState(getCurrentMonth);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [saving, setSaving] = useState(false);

  // Find existing budget plan
  const budgetPlan = useMemo(() => {
    return plans.find(
      (p): p is FinancialPlan & { config: BudgetConfig } =>
        p.type === 'budget' && (p.config as unknown as BudgetConfig).month === month
    );
  }, [plans, month]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Fetch transactions for the selected month
  useEffect(() => {
    const startDate = `${month}-01`;
    const [y, m] = month.split('-').map(Number);
    const endDate = new Date(y, m, 0); // last day of month
    const endStr = `${y}-${String(m).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    fetchTransactions({ date_from: startDate, date_to: endStr, limit: 1000 });
  }, [month, fetchTransactions]);

  // Load categories from plan
  useEffect(() => {
    if (budgetPlan) {
      setCategories((budgetPlan.config as BudgetConfig).categories || []);
    } else {
      // Default categories
      setCategories([
        { name: 'Salary', budgeted: 0, type: 'income' },
        { name: 'Housing', budgeted: 0, type: 'expense' },
        { name: 'Groceries', budgeted: 0, type: 'expense' },
        { name: 'Utilities', budgeted: 0, type: 'expense' },
        { name: 'Transport', budgeted: 0, type: 'expense' },
        { name: 'Dining', budgeted: 0, type: 'expense' },
      ]);
    }
  }, [budgetPlan]);

  // Compute actual amounts from transactions by category
  const actualByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      const cat = (tx.category || 'Uncategorized').toLowerCase();
      map[cat] = (map[cat] || 0) + (Number(tx.amount) || 0);
    }
    return map;
  }, [transactions]);

  const getActual = (catName: string): number => {
    return actualByCategory[catName.toLowerCase()] || 0;
  };

  const addCategory = (type: 'income' | 'expense') => {
    setCategories([...categories, { name: '', budgeted: 0, type }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: keyof BudgetCategory, value: string | number) => {
    const next = [...categories];
    next[index] = { ...next[index], [field]: value };
    setCategories(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const config = { month, categories } as unknown as Record<string, unknown>;
      if (budgetPlan) {
        await updatePlan(budgetPlan.id, { config, status: 'active' });
      } else {
        await createPlan({
          name: `Budget ${month}`,
          type: 'budget',
          config,
          status: 'active',
        });
      }
      await fetchPlans();
    } finally {
      setSaving(false);
    }
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const totalBudgetedIncome = incomeCategories.reduce((s, c) => s + (c.budgeted || 0), 0);
  const totalBudgetedExpense = expenseCategories.reduce((s, c) => s + (c.budgeted || 0), 0);
  const totalActualIncome = incomeCategories.reduce((s, c) => s + getActual(c.name), 0);
  const totalActualExpense = expenseCategories.reduce((s, c) => s + Math.abs(getActual(c.name)), 0);

  const renderSection = (title: string, items: BudgetCategory[], type: 'income' | 'expense') => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
        <Button variant="ghost" size="sm" onClick={() => addCategory(type)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="w-[140px]">Budgeted</TableHead>
              <TableHead className="w-[140px]">Actual</TableHead>
              <TableHead className="w-[140px]">Difference</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((cat) => {
              const globalIndex = categories.indexOf(cat);
              const actual = type === 'income' ? getActual(cat.name) : Math.abs(getActual(cat.name));
              const diff = type === 'income' ? actual - cat.budgeted : cat.budgeted - actual;
              return (
                <TableRow key={globalIndex}>
                  <TableCell>
                    <Input
                      value={cat.name}
                      onChange={(e) => updateCategory(globalIndex, 'name', e.target.value)}
                      placeholder="Category name"
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={cat.budgeted || ''}
                      onChange={(e) => updateCategory(globalIndex, 'budgeted', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-8 text-sm tabular-nums"
                    />
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{formatCurrency(actual)}</TableCell>
                  <TableCell className={`text-sm tabular-nums font-medium ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                      onClick={() => removeCategory(globalIndex)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="font-semibold tabular-nums">
                {formatCurrency(type === 'income' ? totalBudgetedIncome : totalBudgetedExpense)}
              </TableCell>
              <TableCell className="font-semibold tabular-nums">
                {formatCurrency(type === 'income' ? totalActualIncome : totalActualExpense)}
              </TableCell>
              <TableCell className={`font-semibold tabular-nums ${
                (type === 'income' ? totalActualIncome - totalBudgetedIncome : totalBudgetedExpense - totalActualExpense) >= 0
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}>
                {formatCurrency(
                  Math.abs(type === 'income' ? totalActualIncome - totalBudgetedIncome : totalBudgetedExpense - totalActualExpense)
                )}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-48"
          />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Budget'}
        </Button>
      </div>

      {renderSection('Income', incomeCategories, 'income')}
      {renderSection('Expenses', expenseCategories, 'expense')}

      {/* Net Summary */}
      <div className="rounded-md border p-4 flex items-center justify-between">
        <span className="font-semibold">Net (Income - Expenses)</span>
        <div className="flex gap-8 tabular-nums">
          <div>
            <span className="text-xs text-muted-foreground mr-2">Budgeted:</span>
            <span className="font-medium">{formatCurrency(totalBudgetedIncome - totalBudgetedExpense)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground mr-2">Actual:</span>
            <span className={`font-medium ${totalActualIncome - totalActualExpense >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(totalActualIncome - totalActualExpense)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import type { FinancialAccount } from '../stores/financeStore';
import { TransactionTable } from '../components/TransactionTable';
import { TransactionFormDialog } from '../components/TransactionFormDialog';
import { CsvImportDialog } from '../components/CsvImportDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Upload, ArrowDownToLine, Receipt } from 'lucide-react';

const PAGE_SIZE = 50;

export default function TransactionsPage() {
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const transactionsLoading = useFinanceStore((s) => s.transactionsLoading);
  const fetchAccounts = useFinanceStore((s) => s.fetchAccounts);
  const fetchTransactions = useFinanceStore((s) => s.fetchTransactions);

  const [filterAccount, setFilterAccount] = useState('__all__');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadTransactions = useCallback(() => {
    fetchTransactions({
      account_id: filterAccount !== '__all__' ? filterAccount : undefined,
      category: filterCategory || undefined,
      date_from: filterDateFrom || undefined,
      date_to: filterDateTo || undefined,
      limit: PAGE_SIZE,
      offset,
    });
  }, [fetchTransactions, filterAccount, filterCategory, filterDateFrom, filterDateTo, offset]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    setOffset(0);
  }, [filterAccount, filterCategory, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Collect unique categories from loaded transactions
  const categories = Array.from(new Set(transactions.map((t) => t.category).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            View and manage financial transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCsvDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Account</label>
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All accounts</SelectItem>
              {accounts.map((a: FinancialAccount) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Category</label>
          <Select value={filterCategory || '__all__'} onValueChange={(v) => setFilterCategory(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="w-40"
          />
        </div>

        {(filterAccount !== '__all__' || filterCategory || filterDateFrom || filterDateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterAccount('__all__');
              setFilterCategory('');
              setFilterDateFrom('');
              setFilterDateTo('');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      {transactionsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            <span className="text-sm text-muted-foreground">Loading transactions...</span>
          </div>
        </div>
      ) : transactions.length === 0 && offset === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No transactions</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Add transactions manually or import from CSV.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCsvDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
      ) : (
        <>
          <TransactionTable
            transactions={transactions}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              {offset > 0 && ` (offset ${offset})`}
            </p>
            <div className="flex gap-2">
              {offset > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  Previous
                </Button>
              )}
              {transactions.length === PAGE_SIZE && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  <ArrowDownToLine className="h-3.5 w-3.5 mr-1" />
                  Load More
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      <TransactionFormDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <CsvImportDialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen} />
    </div>
  );
}

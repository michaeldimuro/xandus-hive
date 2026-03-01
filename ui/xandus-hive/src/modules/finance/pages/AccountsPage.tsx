import { useEffect, useState } from 'react';
import type { FinancialAccount, AccountType } from '../stores/financeStore';
import { useFinanceStore } from '../stores/financeStore';
import { AccountCard } from '../components/AccountCard';
import { AccountFormDialog } from '../components/AccountFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Wallet, Landmark, PiggyBank, CreditCard, TrendingUp } from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

const TYPE_ICONS: Record<AccountType, typeof Landmark> = {
  checking: Landmark,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
};

const TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit',
  investment: 'Investment',
};

export default function AccountsPage() {
  const accounts = useFinanceStore((s) => s.accounts);
  const loading = useFinanceStore((s) => s.loading);
  const fetchAccounts = useFinanceStore((s) => s.fetchAccounts);
  const totalBalance = useFinanceStore((s) => s.totalBalance);
  const balanceByType = useFinanceStore((s) => s.balanceByType);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreate = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const handleEdit = (account: FinancialAccount) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const byType = balanceByType();
  const net = totalBalance();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground text-sm">
            Track your financial accounts and balances.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20">
                <Wallet className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Net Worth</p>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${net < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatCurrency(net)}
            </p>
          </CardContent>
        </Card>
        {(Object.keys(TYPE_ICONS) as AccountType[]).map((type) => {
          const Icon = TYPE_ICONS[type];
          const val = byType[type];
          return (
            <Card key={type}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{TYPE_LABELS[type]}</p>
                </div>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(val)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Account Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            <span className="text-sm text-muted-foreground">Loading accounts...</span>
          </div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No accounts added</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Add your first financial account to start tracking.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} onClick={handleEdit} />
          ))}
        </div>
      )}

      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editingAccount}
      />
    </div>
  );
}

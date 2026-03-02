import type { FinancialAccount, AccountType } from '../stores/financeStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, CreditCard, Landmark, TrendingUp } from 'lucide-react';

interface AccountCardProps {
  account: FinancialAccount;
  onClick: (account: FinancialAccount) => void;
}

const TYPE_CONFIG: Record<AccountType, { label: string; color: string; icon: typeof Landmark }> = {
  checking: {
    label: 'Checking',
    color: 'bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/20',
    icon: Landmark,
  },
  savings: {
    label: 'Savings',
    color: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30 hover:bg-emerald-600/20',
    icon: Building2,
  },
  credit: {
    label: 'Credit',
    color: 'bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/20',
    icon: CreditCard,
  },
  investment: {
    label: 'Investment',
    color: 'bg-purple-600/20 text-purple-400 border-purple-600/30 hover:bg-purple-600/20',
    icon: TrendingUp,
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const config = TYPE_CONFIG[account.type];
  const Icon = config.icon;
  const balance = Number(account.current_balance) || 0;

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-muted-foreground/40"
      onClick={() => onClick(account)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold leading-none">{account.name}</p>
            {account.institution && (
              <p className="text-xs text-muted-foreground">{account.institution}</p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className={config.color}>
          {config.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className={`text-2xl font-bold tabular-nums ${balance < 0 ? 'text-red-400' : ''}`}>
              {formatCurrency(balance)}
            </p>
          </div>
          {account.last_four && (
            <p className="text-xs text-muted-foreground font-mono">
              ****{account.last_four}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

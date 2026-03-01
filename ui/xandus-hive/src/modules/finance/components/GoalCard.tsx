import type { FinancialPlan } from '../stores/financeStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Target } from 'lucide-react';
import { useFinanceStore } from '../stores/financeStore';

interface GoalConfig {
  target_amount: number;
  current_amount: number;
  deadline?: string;
}

interface GoalCardProps {
  plan: FinancialPlan;
  onEdit: (plan: FinancialPlan) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function GoalCard({ plan, onEdit }: GoalCardProps) {
  const deletePlan = useFinanceStore((s) => s.deletePlan);
  const config = plan.config as unknown as GoalConfig;
  const target = config.target_amount || 0;
  const current = config.current_amount || 0;
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20">
              <Target className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold leading-none">{plan.name}</p>
              {config.deadline && (
                <p className="text-xs text-muted-foreground mt-1">
                  Target: {config.deadline}
                </p>
              )}
            </div>
          </div>
          <Badge
            variant="secondary"
            className={
              plan.status === 'completed'
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30'
                : plan.status === 'archived'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-blue-600/20 text-blue-400 border-blue-600/30'
            }
          >
            {plan.status}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{formatCurrency(current)}</span>
            <span className="font-medium">{formatCurrency(target)}</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {pct.toFixed(1)}% complete
          </p>
        </div>

        <div className="flex items-center justify-end gap-1 pt-1 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onEdit(plan)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hover:text-red-400"
            onClick={() => deletePlan(plan.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

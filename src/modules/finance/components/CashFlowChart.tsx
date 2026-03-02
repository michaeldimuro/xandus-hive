import { useEffect, useMemo } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthData {
  label: string;
  month: string; // YYYY-MM
  income: number;
  expenses: number;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(0)}`;
}

function getLast12Months(): { label: string; month: string }[] {
  const months: { label: string; month: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    months.push({ label, month });
  }
  return months;
}

export function CashFlowChart() {
  const transactions = useFinanceStore((s) => s.transactions);
  const fetchTransactions = useFinanceStore((s) => s.fetchTransactions);

  // Fetch last 12 months of transactions
  useEffect(() => {
    const months = getLast12Months();
    const firstMonth = months[0].month;
    fetchTransactions({ date_from: `${firstMonth}-01`, limit: 5000 });
  }, [fetchTransactions]);

  const data: MonthData[] = useMemo(() => {
    const months = getLast12Months();
    const map: Record<string, { income: number; expenses: number }> = {};

    for (const m of months) {
      map[m.month] = { income: 0, expenses: 0 };
    }

    for (const tx of transactions) {
      const txMonth = tx.date.substring(0, 7); // YYYY-MM
      if (map[txMonth]) {
        const amount = Number(tx.amount) || 0;
        if (amount >= 0) {
          map[txMonth].income += amount;
        } else {
          map[txMonth].expenses += Math.abs(amount);
        }
      }
    }

    return months.map((m) => ({
      label: m.label,
      month: m.month,
      income: map[m.month].income,
      expenses: map[m.month].expenses,
    }));
  }, [transactions]);

  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expenses)), 1);
  const chartHeight = 200;
  const barWidth = 16;
  const groupGap = 4;
  const groupWidth = barWidth * 2 + groupGap;
  const chartWidth = data.length * (groupWidth + 24);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Monthly Cash Flow (Last 12 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500" />
            Expenses
          </span>
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth + 40} ${chartHeight + 60}`}
            className="w-full min-w-[600px]"
            style={{ maxHeight: 300 }}
          >
            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = chartHeight - pct * chartHeight + 20;
              const val = pct * maxVal;
              return (
                <g key={pct}>
                  <line
                    x1={40}
                    x2={chartWidth + 40}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity={0.1}
                  />
                  <text
                    x={36}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground"
                    fontSize={10}
                  >
                    {formatCurrency(val)}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((d, i) => {
              const x = 40 + i * (groupWidth + 24) + 12;
              const incomeH = maxVal > 0 ? (d.income / maxVal) * chartHeight : 0;
              const expenseH = maxVal > 0 ? (d.expenses / maxVal) * chartHeight : 0;

              return (
                <g key={d.month}>
                  {/* Income bar */}
                  <rect
                    x={x}
                    y={chartHeight + 20 - incomeH}
                    width={barWidth}
                    height={incomeH}
                    rx={2}
                    className="fill-emerald-500"
                    opacity={0.85}
                  >
                    <title>Income: ${d.income.toFixed(2)}</title>
                  </rect>
                  {/* Expense bar */}
                  <rect
                    x={x + barWidth + groupGap}
                    y={chartHeight + 20 - expenseH}
                    width={barWidth}
                    height={expenseH}
                    rx={2}
                    className="fill-red-500"
                    opacity={0.85}
                  >
                    <title>Expenses: ${d.expenses.toFixed(2)}</title>
                  </rect>
                  {/* Month label */}
                  <text
                    x={x + (groupWidth / 2)}
                    y={chartHeight + 40}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize={10}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Summary row */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border text-sm">
          <div>
            <span className="text-muted-foreground">Total Income:</span>{' '}
            <span className="font-medium text-emerald-400 tabular-nums">
              ${data.reduce((s, d) => s + d.income, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Expenses:</span>{' '}
            <span className="font-medium text-red-400 tabular-nums">
              ${data.reduce((s, d) => s + d.expenses, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Net:</span>{' '}
            <span className={`font-medium tabular-nums ${
              data.reduce((s, d) => s + d.income - d.expenses, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              ${data.reduce((s, d) => s + d.income - d.expenses, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

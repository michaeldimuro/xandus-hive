import type { FinancialTransaction, FinancialAccount } from '../stores/financeStore';
import { useFinanceStore } from '../stores/financeStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TransactionTableProps {
  transactions: FinancialTransaction[];
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

function SortHeader({
  label,
  field,
  currentField,
  currentDir,
  onSort,
}: {
  label: string;
  field: string;
  currentField: string;
  currentDir: 'asc' | 'desc';
  onSort: (field: string) => void;
}) {
  const active = currentField === field;
  return (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      {label}
      {active && (
        <span className="ml-1 text-xs">{currentDir === 'asc' ? '\u2191' : '\u2193'}</span>
      )}
    </TableHead>
  );
}

export function TransactionTable({ transactions, sortField, sortDir, onSort }: TransactionTableProps) {
  const accounts = useFinanceStore((s) => s.accounts);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);

  const accountMap = new Map<string, FinancialAccount>();
  for (const a of accounts) {accountMap.set(a.id, a);}

  const sorted = [...transactions].toSorted((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'date':
        cmp = a.date.localeCompare(b.date);
        break;
      case 'amount':
        cmp = (Number(a.amount) || 0) - (Number(b.amount) || 0);
        break;
      case 'description':
        cmp = (a.description || '').localeCompare(b.description || '');
        break;
      case 'category':
        cmp = (a.category || '').localeCompare(b.category || '');
        break;
      default:
        cmp = a.date.localeCompare(b.date);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader label="Date" field="date" currentField={sortField} currentDir={sortDir} onSort={onSort} />
            <SortHeader label="Description" field="description" currentField={sortField} currentDir={sortDir} onSort={onSort} />
            <SortHeader label="Amount" field="amount" currentField={sortField} currentDir={sortDir} onSort={onSort} />
            <SortHeader label="Category" field="category" currentField={sortField} currentDir={sortDir} onSort={onSort} />
            <TableHead>Account</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((tx) => {
            const amount = Number(tx.amount) || 0;
            const account = accountMap.get(tx.account_id);
            let dateStr: string;
            try {
              dateStr = format(parseISO(tx.date), 'MMM d, yyyy');
            } catch {
              dateStr = tx.date;
            }

            return (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap text-sm">{dateStr}</TableCell>
                <TableCell className="text-sm max-w-[300px] truncate">{tx.description}</TableCell>
                <TableCell className={`text-sm font-medium tabular-nums whitespace-nowrap ${amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {amount >= 0 ? '+' : '-'}{formatCurrency(amount)}
                </TableCell>
                <TableCell>
                  {tx.category ? (
                    <Badge variant="outline" className="text-xs">
                      {tx.category}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {account?.name || '--'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                    onClick={() => deleteTransaction(tx.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

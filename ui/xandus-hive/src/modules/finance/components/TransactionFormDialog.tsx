import { useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import type { FinancialAccount } from '../stores/financeStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionFormDialog({ open, onOpenChange }: TransactionFormDialogProps) {
  const accounts = useFinanceStore((s) => s.accounts);
  const createTransaction = useFinanceStore((s) => s.createTransaction);

  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !amount || !description) {return;}
    setSaving(true);
    try {
      await createTransaction({
        account_id: accountId,
        date,
        amount: parseFloat(amount),
        description,
        category: category || null,
        linked_entity_type: null,
        linked_entity_id: null,
        imported_from: 'manual',
      });
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Manually add a new transaction.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tx-account">Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="tx-account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a: FinancialAccount) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Amount</Label>
              <Input
                id="tx-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="-50.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-description">Description</Label>
            <Input
              id="tx-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Grocery store"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-category">Category</Label>
            <Input
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Groceries, Dining, Utilities"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!accountId || !amount || !description.trim() || saving}>
              {saving ? 'Saving...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from 'react';
import type { FinancialAccount, AccountType } from '../stores/financeStore';
import { useFinanceStore } from '../stores/financeStore';
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

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: FinancialAccount | null;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit' },
  { value: 'investment', label: 'Investment' },
];

export function AccountFormDialog({ open, onOpenChange, account }: AccountFormDialogProps) {
  const createAccount = useFinanceStore((s) => s.createAccount);
  const updateAccount = useFinanceStore((s) => s.updateAccount);
  const deleteAccount = useFinanceStore((s) => s.deleteAccount);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [institution, setInstitution] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [balance, setBalance] = useState('0');
  const [business, setBusiness] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!account;

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setInstitution(account.institution || '');
      setLastFour(account.last_four || '');
      setBalance(String(account.current_balance));
      setBusiness(account.business || '');
    } else {
      setName('');
      setType('checking');
      setInstitution('');
      setLastFour('');
      setBalance('0');
      setBusiness('');
    }
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        type,
        institution: institution || null,
        last_four: lastFour || null,
        current_balance: parseFloat(balance) || 0,
        business: business || null,
      };

      if (isEdit) {
        await updateAccount(account.id, payload);
      } else {
        await createAccount(payload);
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!account) {return;}
    setSaving(true);
    try {
      await deleteAccount(account.id);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Account' : 'Add Account'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update account details.' : 'Add a new financial account to track.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acct-name">Account Name</Label>
            <Input
              id="acct-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chase Checking"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acct-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                <SelectTrigger id="acct-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="acct-last-four">Last 4 Digits</Label>
              <Input
                id="acct-last-four"
                value={lastFour}
                onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acct-institution">Institution</Label>
            <Input
              id="acct-institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Chase, Bank of America"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acct-balance">Current Balance</Label>
            <Input
              id="acct-balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acct-business">Business</Label>
            <Input
              id="acct-business"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder="Optional business name"
            />
          </div>

          <DialogFooter className="gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

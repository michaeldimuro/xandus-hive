import { useEffect, useState } from 'react';
import type { FinancialPlan, PlanStatus } from '../stores/financeStore';
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

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: FinancialPlan | null;
}

interface GoalConfig {
  target_amount: number;
  current_amount: number;
  deadline?: string;
}

export function GoalFormDialog({ open, onOpenChange, plan }: GoalFormDialogProps) {
  const createPlan = useFinanceStore((s) => s.createPlan);
  const updatePlan = useFinanceStore((s) => s.updatePlan);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<PlanStatus>('active');
  const [saving, setSaving] = useState(false);

  const isEdit = !!plan;

  useEffect(() => {
    if (plan) {
      const config = plan.config as unknown as GoalConfig;
      setName(plan.name);
      setTargetAmount(String(config.target_amount || ''));
      setCurrentAmount(String(config.current_amount || ''));
      setDeadline(config.deadline || '');
      setStatus(plan.status);
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setDeadline('');
      setStatus('active');
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const config = {
        target_amount: parseFloat(targetAmount) || 0,
        current_amount: parseFloat(currentAmount) || 0,
        deadline: deadline || undefined,
      } as unknown as Record<string, unknown>;

      if (isEdit) {
        await updatePlan(plan.id, { name, config, status });
      } else {
        await createPlan({
          name,
          type: 'savings_goal',
          config,
          status: 'active',
        });
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Goal' : 'Create Savings Goal'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update your savings goal.' : 'Set a target and track your progress.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Goal Name</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-target">Target Amount</Label>
              <Input
                id="goal-target"
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="10000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-current">Current Amount</Label>
              <Input
                id="goal-current"
                type="number"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-deadline">Target Date (optional)</Label>
            <Input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="goal-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PlanStatus)}>
                <SelectTrigger id="goal-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !targetAmount || saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

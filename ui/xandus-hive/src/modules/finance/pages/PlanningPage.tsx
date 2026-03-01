import { useEffect, useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import type { FinancialPlan } from '../stores/financeStore';
import { BudgetEditor } from '../components/BudgetEditor';
import { CashFlowChart } from '../components/CashFlowChart';
import { GoalCard } from '../components/GoalCard';
import { GoalFormDialog } from '../components/GoalFormDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';

export default function PlanningPage() {
  const plans = useFinanceStore((s) => s.plans);
  const plansLoading = useFinanceStore((s) => s.plansLoading);
  const fetchPlans = useFinanceStore((s) => s.fetchPlans);
  const fetchAccounts = useFinanceStore((s) => s.fetchAccounts);

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialPlan | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchAccounts();
  }, [fetchPlans, fetchAccounts]);

  const goals = plans.filter((p) => p.type === 'savings_goal');

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setGoalDialogOpen(true);
  };

  const handleEditGoal = (plan: FinancialPlan) => {
    setEditingGoal(plan);
    setGoalDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planning</h1>
        <p className="text-muted-foreground text-sm">
          Budget, savings goals, and cash flow analysis.
        </p>
      </div>

      <Tabs defaultValue="budget" className="space-y-6">
        <TabsList>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        {/* Budget Tab */}
        <TabsContent value="budget">
          <BudgetEditor />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <div className="space-y-6">
            <div className="flex items-center justify-end">
              <Button onClick={handleCreateGoal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </div>

            {plansLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                  <span className="text-sm text-muted-foreground">Loading goals...</span>
                </div>
              </div>
            ) : goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium">No savings goals</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Create your first savings goal to start tracking.
                </p>
                <Button onClick={handleCreateGoal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal) => (
                  <GoalCard key={goal.id} plan={goal} onEdit={handleEditGoal} />
                ))}
              </div>
            )}

            <GoalFormDialog
              open={goalDialogOpen}
              onOpenChange={setGoalDialogOpen}
              plan={editingGoal}
            />
          </div>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow">
          <CashFlowChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, X, Loader2, Calendar, DollarSign, Trash2, CheckCircle2 } from 'lucide-react';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { calculateGoalProgress, GoalProgress } from '@/lib/savingsGoals';
import { useCurrency } from '@/lib/currencyContext';
import type { SavingsGoal, ExpenseItem, UserSettings } from '@/lib/types';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  expenses: ExpenseItem[];
  settings: UserSettings;
  isLoading: boolean;
}

interface GoalWithProgress extends SavingsGoal {
  progress: GoalProgress;
}

export default function SavingsGoals({ goals, expenses, settings, isLoading }: SavingsGoalsProps) {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  const goalsWithProgress = useMemo((): GoalWithProgress[] => {
    if (!settings.monthlyIncome) return [];
    
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const currentSavings = settings.monthlyIncome - totalSpent;

    return goals.map((goal) => ({
      ...goal,
      progress: calculateGoalProgress({
        goal,
        currentSavings: Math.max(0, currentSavings),
      }),
    }));
  }, [goals, expenses, settings]);

  const handleAddGoal = async () => {
    if (!newGoalName || !newGoalAmount || !newGoalDate) {
      toast.error('Please fill all fields');
      return;
    }

    const amount = parseFloat(newGoalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await getIdToken(user);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL}/api/budget/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newGoalName,
          targetAmount: amount,
          targetDate: newGoalDate,
        }),
      });

      if (!response.ok) throw new Error('Failed to add goal');

      toast.success('Goal added!');
      setNewGoalName('');
      setNewGoalAmount('');
      setNewGoalDate('');
      setIsAddingGoal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add goal';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setDeletingId(goalId);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await getIdToken(user);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL}/api/budget/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete goal');
      toast.success('Goal deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete goal';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-2xl border border-border p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Savings Goals</h3>
            <p className="text-xs text-muted-foreground">{goals.length} active goal{goals.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddingGoal(true)}
          className="p-2 rounded-lg bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-accent/50 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-3" />
              <div className="h-2 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && goals.length === 0 && !isAddingGoal && (
        <div className="text-center py-8">
          <Target className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No savings goals yet</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddingGoal(true)}
            className="mt-3 text-sm text-[#10B981] font-medium hover:underline"
          >
            Create your first goal
          </motion.button>
        </div>
      )}

      {/* Add goal form */}
      <AnimatePresence>
        {isAddingGoal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">New Goal</h4>
                <button onClick={() => setIsAddingGoal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Goal name (e.g., Emergency Fund)"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newGoalAmount}
                    onChange={(e) => setNewGoalAmount(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={newGoalDate}
                    onChange={(e) => setNewGoalDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAddGoal}
                disabled={isSubmitting}
                className="w-full h-10 rounded-lg bg-[#10B981] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Goal
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals list */}
      {!isLoading && goalsWithProgress.length > 0 && (
        <div className="space-y-3">
          {goalsWithProgress.map((goalWithProgress, index) => {
            const isDeleting = deletingId === goalWithProgress.id;
            const isComplete = goalWithProgress.progress.completionPercent >= 100;
            const daysLeft = Math.ceil((new Date(goalWithProgress.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <motion.div
                key={goalWithProgress.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isDeleting ? 0.5 : 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group p-4 rounded-xl border transition-colors ${
                  isComplete
                    ? 'bg-[#10B981]/5 border-[#10B981]/20'
                    : 'bg-accent/30 border-border hover:border-[#4F6EF7]/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                    ) : (
                      <Target className="w-5 h-5 text-[#4F6EF7]" />
                    )}
                    <h4 className="font-medium text-foreground">{goalWithProgress.name}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goalWithProgress.id)}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent transition-all text-muted-foreground hover:text-[#DC3545]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {formatCurrency(goalWithProgress.targetAmount - goalWithProgress.progress.remainingAmount)} of {formatCurrency(goalWithProgress.targetAmount)}
                    </span>
                    <span className={isComplete ? 'text-[#10B981] font-medium' : 'text-foreground'}>
                      {goalWithProgress.progress.completionPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, goalWithProgress.progress.completionPercent)}%` }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                      className={`h-full rounded-full ${isComplete ? 'bg-[#10B981]' : 'bg-[#4F6EF7]'}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {daysLeft > 0 ? `${daysLeft} days left` : isComplete ? 'Goal reached!' : 'Overdue'}
                  </span>
                  {goalWithProgress.progress.monthlyRequiredSaving > 0 && !isComplete && (
                    <span>{formatCurrency(goalWithProgress.progress.monthlyRequiredSaving)}/mo needed</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

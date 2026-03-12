import { SavingsGoal } from './types';

export interface GoalProgress {
  monthlyRequiredSaving: number;
  completionPercent: number;
  estimatedCompletionDate: string | null;
  monthsRemaining: number;
  remainingAmount: number;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function monthDiff(from: Date, to: Date) {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  return years * 12 + months;
}

export function calculateGoalProgress({
  goal,
  currentSavings,
  now = new Date(),
}: {
  goal: SavingsGoal;
  currentSavings: number;
  now?: Date;
}): GoalProgress {
  const targetAmount = Number(goal.targetAmount || 0);
  const safeCurrentSavings = Number(currentSavings || 0);

  const remainingAmount = Math.max(targetAmount - safeCurrentSavings, 0);
  const completionPercent = targetAmount > 0 ? clamp((safeCurrentSavings / targetAmount) * 100) : 0;

  const targetDate = new Date(`${goal.targetDate}T00:00:00`);
  const monthsRemainingRaw = monthDiff(now, targetDate);
  const monthsRemaining = Math.max(monthsRemainingRaw, 1);

  const monthlyRequiredSaving = Number((remainingAmount / monthsRemaining).toFixed(2));

  let estimatedCompletionDate: string | null = null;
  if (remainingAmount <= 0) {
    estimatedCompletionDate = now.toISOString();
  } else if (safeCurrentSavings > 0) {
    const monthsNeeded = Math.ceil(remainingAmount / safeCurrentSavings);
    const projectedDate = new Date(now);
    projectedDate.setMonth(projectedDate.getMonth() + monthsNeeded);
    estimatedCompletionDate = projectedDate.toISOString();
  }

  return {
    monthlyRequiredSaving,
    completionPercent: Number(completionPercent.toFixed(1)),
    estimatedCompletionDate,
    monthsRemaining,
    remainingAmount: Number(remainingAmount.toFixed(2)),
  };
}

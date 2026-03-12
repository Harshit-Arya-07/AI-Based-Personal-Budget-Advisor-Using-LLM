import { ExpenseItem, SavingsGoal } from './types';
import { calculateFinancialHealthScore } from './financialHealth';
import { calculateGoalProgress } from './savingsGoals';

export interface WhatIfInputs {
  monthlyIncome: number;
  savingsTarget: number;
  expenses: ExpenseItem[];
  goals: SavingsGoal[];
  now?: Date;
}

export interface GoalTimelineSnapshot {
  goalId: string;
  goalName: string;
  estimatedCompletionDate: string | null;
  monthlyRequiredSaving: number;
  monthsToGoal: number | null;
}

export interface WhatIfSnapshot {
  totalSpent: number;
  totalSavings: number;
  savingsRatePercent: number;
  safeDailySpend: number;
  financialHealthScore: number;
  goalTimelines: GoalTimelineSnapshot[];
  monthlyDisposableIncome: number;
  yearlyProjectedSavings: number;
  emergencyFundMonths: number;
}

export interface WhatIfSimulationResult {
  before: WhatIfSnapshot;
  after: WhatIfSnapshot;
  scenarioType: ScenarioType;
  scenarioLabel: string;
  inputValue: number;
  actualImpact: number;
}

export type ScenarioType = 
  | 'reduce_category'
  | 'increase_income'
  | 'decrease_income'
  | 'add_expense'
  | 'remove_subscription'
  | 'change_savings_target'
  | 'major_purchase'
  | 'custom';

export interface ScenarioConfig {
  type: ScenarioType;
  label: string;
  description: string;
  icon: string;
  color: string;
  inputLabel: string;
  inputPlaceholder: string;
  secondaryInput?: {
    label: string;
    placeholder: string;
    type: 'category' | 'months' | 'text';
  };
}

export const SCENARIO_CONFIGS: Record<ScenarioType, ScenarioConfig> = {
  reduce_category: {
    type: 'reduce_category',
    label: 'Cut Category Spending',
    description: 'See impact of reducing spending in a category',
    icon: 'scissors',
    color: '#8B5CF6',
    inputLabel: 'Reduction amount',
    inputPlaceholder: '100',
    secondaryInput: {
      label: 'Category',
      placeholder: 'Select category',
      type: 'category',
    },
  },
  increase_income: {
    type: 'increase_income',
    label: 'Income Increase',
    description: 'What if you got a raise or side income?',
    icon: 'trending-up',
    color: '#10B981',
    inputLabel: 'Monthly increase',
    inputPlaceholder: '500',
  },
  decrease_income: {
    type: 'decrease_income',
    label: 'Income Decrease',
    description: 'Plan for potential income reduction',
    icon: 'trending-down',
    color: '#F59E0B',
    inputLabel: 'Monthly decrease',
    inputPlaceholder: '500',
  },
  add_expense: {
    type: 'add_expense',
    label: 'New Recurring Expense',
    description: 'Impact of adding a new monthly expense',
    icon: 'plus-circle',
    color: '#DC3545',
    inputLabel: 'Monthly amount',
    inputPlaceholder: '150',
    secondaryInput: {
      label: 'Category',
      placeholder: 'Select category',
      type: 'category',
    },
  },
  remove_subscription: {
    type: 'remove_subscription',
    label: 'Cancel Subscription',
    description: 'Savings from canceling a subscription',
    icon: 'x-circle',
    color: '#10B981',
    inputLabel: 'Monthly cost',
    inputPlaceholder: '15',
  },
  change_savings_target: {
    type: 'change_savings_target',
    label: 'Adjust Savings Goal',
    description: 'See impact of changing your savings target',
    icon: 'target',
    color: '#4F6EF7',
    inputLabel: 'New target',
    inputPlaceholder: '1500',
  },
  major_purchase: {
    type: 'major_purchase',
    label: 'Major Purchase',
    description: 'Plan for a large one-time expense',
    icon: 'shopping-bag',
    color: '#F59E0B',
    inputLabel: 'Purchase amount',
    inputPlaceholder: '5000',
    secondaryInput: {
      label: 'Save over months',
      placeholder: '6',
      type: 'months',
    },
  },
  custom: {
    type: 'custom',
    label: 'Custom Scenario',
    description: 'Build your own what-if scenario',
    icon: 'sliders',
    color: '#8B5CF6',
    inputLabel: 'Amount',
    inputPlaceholder: '0',
  },
};

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  scenarios: Array<{
    type: ScenarioType;
    value: number;
    secondaryValue?: string | number;
  }>;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'emergency_fund',
    name: 'Build Emergency Fund',
    description: 'Save 3-6 months of expenses',
    icon: '🛡️',
    scenarios: [
      { type: 'reduce_category', value: 100, secondaryValue: 'Entertainment' },
      { type: 'reduce_category', value: 50, secondaryValue: 'Food' },
    ],
  },
  {
    id: 'aggressive_savings',
    name: 'Aggressive Savings Mode',
    description: 'Maximize savings for a goal',
    icon: '🚀',
    scenarios: [
      { type: 'reduce_category', value: 150, secondaryValue: 'Entertainment' },
      { type: 'reduce_category', value: 100, secondaryValue: 'Shopping' },
      { type: 'remove_subscription', value: 50 },
    ],
  },
  {
    id: 'income_boost',
    name: 'Side Hustle Impact',
    description: 'Effect of $500/month extra income',
    icon: '💰',
    scenarios: [{ type: 'increase_income', value: 500 }],
  },
  {
    id: 'job_loss',
    name: 'Job Loss Preparation',
    description: 'Plan for 50% income reduction',
    icon: '⚠️',
    scenarios: [{ type: 'decrease_income', value: 0.5 }], // 50% of current income
  },
  {
    id: 'new_car',
    name: 'New Car Purchase',
    description: 'Save for a $25,000 vehicle',
    icon: '🚗',
    scenarios: [{ type: 'major_purchase', value: 25000, secondaryValue: 24 }],
  },
  {
    id: 'vacation',
    name: 'Dream Vacation',
    description: 'Save $5,000 for travel',
    icon: '✈️',
    scenarios: [{ type: 'major_purchase', value: 5000, secondaryValue: 6 }],
  },
];

function clampNonNegative(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(value, 0);
}

function calculateSafeDailySpend({
  monthlyIncome,
  savingsTarget,
  totalSpent,
  now,
}: {
  monthlyIncome: number;
  savingsTarget: number;
  totalSpent: number;
  now: Date;
}) {
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(totalDaysInMonth - currentDay, 1);

  const availableToSpend = monthlyIncome - savingsTarget - totalSpent;
  return Number((availableToSpend / remainingDays).toFixed(2));
}

function buildSnapshot({
  monthlyIncome,
  savingsTarget,
  expenses,
  goals,
  now,
}: {
  monthlyIncome: number;
  savingsTarget: number;
  expenses: ExpenseItem[];
  goals: SavingsGoal[];
  now: Date;
}): WhatIfSnapshot {
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const roundedTotalSpent = Number(totalSpent.toFixed(2));
  const totalSavings = Number((monthlyIncome - roundedTotalSpent).toFixed(2));
  const savingsRatePercent = monthlyIncome > 0 ? Number(((totalSavings / monthlyIncome) * 100).toFixed(2)) : 0;

  const financialHealth = calculateFinancialHealthScore({
    monthlyIncome,
    savingsTarget,
    totalSpent: roundedTotalSpent,
    totalSavings,
    expenses,
  });

  const goalTimelines = goals.map((goal) => {
    const progress = calculateGoalProgress({ goal, currentSavings: totalSavings, now });
    const remainingAmount = goal.targetAmount - (goal.targetAmount * (progress.completionPercent / 100));
    const monthsToGoal = totalSavings > 0 
      ? Math.ceil(remainingAmount / totalSavings)
      : null;
    return {
      goalId: goal.id,
      goalName: goal.name,
      estimatedCompletionDate: progress.estimatedCompletionDate,
      monthlyRequiredSaving: progress.monthlyRequiredSaving,
      monthsToGoal,
    };
  });

  const monthlyDisposableIncome = monthlyIncome - roundedTotalSpent - savingsTarget;
  const yearlyProjectedSavings = totalSavings * 12;
  const monthlyExpenseAvg = roundedTotalSpent;
  const emergencyFundMonths = monthlyExpenseAvg > 0 
    ? Number((totalSavings / monthlyExpenseAvg).toFixed(1))
    : 0;

  return {
    totalSpent: roundedTotalSpent,
    totalSavings,
    savingsRatePercent,
    safeDailySpend: calculateSafeDailySpend({ monthlyIncome, savingsTarget, totalSpent: roundedTotalSpent, now }),
    financialHealthScore: financialHealth.score,
    goalTimelines,
    monthlyDisposableIncome,
    yearlyProjectedSavings,
    emergencyFundMonths,
  };
}

function applyCategoryReduction(expenses: ExpenseItem[], category: string, reductionAmount: number) {
  let remainingReduction = clampNonNegative(reductionAmount);
  const normalizedCategory = String(category || '').trim();

  const targetIndexes = expenses
    .map((expense, index) => ({ expense, index }))
    .filter(({ expense }) => expense.category === normalizedCategory)
    .sort((left, right) => Number(right.expense.amount || 0) - Number(left.expense.amount || 0));

  const nextExpenses = expenses.map((expense) => ({ ...expense }));

  for (const { index } of targetIndexes) {
    if (remainingReduction <= 0) break;

    const currentAmount = Number(nextExpenses[index].amount || 0);
    const deduction = Math.min(currentAmount, remainingReduction);
    nextExpenses[index].amount = Number((currentAmount - deduction).toFixed(2));
    remainingReduction = Number((remainingReduction - deduction).toFixed(2));
  }

  const filteredExpenses = nextExpenses.filter((expense) => Number(expense.amount || 0) > 0);
  const actualReduction = Number((reductionAmount - remainingReduction).toFixed(2));

  return { expenses: filteredExpenses, actualReduction };
}

// Legacy function for backward compatibility
export function runWhatIfSimulation({
  monthlyIncome,
  savingsTarget,
  expenses,
  goals,
  category,
  reduceAmount,
  now = new Date(),
}: WhatIfInputs & {
  category: string;
  reduceAmount: number;
}): WhatIfSimulationResult {
  return runScenarioSimulation({
    monthlyIncome,
    savingsTarget,
    expenses,
    goals,
    scenarioType: 'reduce_category',
    primaryValue: reduceAmount,
    secondaryValue: category,
    now,
  });
}

// New enhanced simulation function
export function runScenarioSimulation({
  monthlyIncome,
  savingsTarget,
  expenses,
  goals,
  scenarioType,
  primaryValue,
  secondaryValue,
  now = new Date(),
}: WhatIfInputs & {
  scenarioType: ScenarioType;
  primaryValue: number;
  secondaryValue?: string | number;
}): WhatIfSimulationResult {
  const safeValue = clampNonNegative(primaryValue);
  let simulatedExpenses = [...expenses];
  let simulatedIncome = monthlyIncome;
  let simulatedSavingsTarget = savingsTarget;
  let actualImpact = safeValue;
  let scenarioLabel = '';

  switch (scenarioType) {
    case 'reduce_category': {
      const category = String(secondaryValue || 'Other');
      const result = applyCategoryReduction(expenses, category, safeValue);
      simulatedExpenses = result.expenses;
      actualImpact = result.actualReduction;
      scenarioLabel = `Reduce ${category} by $${safeValue}`;
      break;
    }

    case 'increase_income': {
      simulatedIncome = monthlyIncome + safeValue;
      scenarioLabel = `Income +$${safeValue}/mo`;
      break;
    }

    case 'decrease_income': {
      // If value is less than 1, treat as percentage
      const decrease = safeValue < 1 ? monthlyIncome * safeValue : safeValue;
      simulatedIncome = Math.max(0, monthlyIncome - decrease);
      actualImpact = decrease;
      scenarioLabel = safeValue < 1 
        ? `Income -${(safeValue * 100).toFixed(0)}%`
        : `Income -$${safeValue}/mo`;
      break;
    }

    case 'add_expense': {
      const category = String(secondaryValue || 'Other');
      simulatedExpenses = [
        ...expenses,
        {
          id: 'simulated-expense',
          amount: safeValue,
          category,
          date: now.toISOString().slice(0, 10),
          timestamp: now.toISOString(),
        },
      ];
      scenarioLabel = `Add $${safeValue}/mo ${category}`;
      break;
    }

    case 'remove_subscription': {
      // Remove/reduce from "Personal" or "Entertainment" category as approximation
      const result = applyCategoryReduction(expenses, 'Personal', safeValue);
      if (result.actualReduction < safeValue) {
        const remaining = safeValue - result.actualReduction;
        const result2 = applyCategoryReduction(result.expenses, 'Entertainment', remaining);
        simulatedExpenses = result2.expenses;
        actualImpact = result.actualReduction + result2.actualReduction;
      } else {
        simulatedExpenses = result.expenses;
        actualImpact = result.actualReduction;
      }
      scenarioLabel = `Cancel $${safeValue}/mo subscription`;
      break;
    }

    case 'change_savings_target': {
      simulatedSavingsTarget = safeValue;
      scenarioLabel = `Savings target → $${safeValue}`;
      break;
    }

    case 'major_purchase': {
      const months = Number(secondaryValue || 12);
      const monthlyAmount = safeValue / months;
      simulatedSavingsTarget = savingsTarget + monthlyAmount;
      actualImpact = monthlyAmount;
      scenarioLabel = `Save $${safeValue} over ${months}mo`;
      break;
    }

    default: {
      scenarioLabel = 'Custom scenario';
    }
  }

  return {
    before: buildSnapshot({ monthlyIncome, savingsTarget, expenses, goals, now }),
    after: buildSnapshot({
      monthlyIncome: simulatedIncome,
      savingsTarget: simulatedSavingsTarget,
      expenses: simulatedExpenses,
      goals,
      now,
    }),
    scenarioType,
    scenarioLabel,
    inputValue: safeValue,
    actualImpact,
  };
}

// Run multiple scenarios combined
export function runCombinedScenarios({
  monthlyIncome,
  savingsTarget,
  expenses,
  goals,
  scenarios,
  now = new Date(),
}: WhatIfInputs & {
  scenarios: Array<{
    type: ScenarioType;
    value: number;
    secondaryValue?: string | number;
  }>;
}): {
  before: WhatIfSnapshot;
  after: WhatIfSnapshot;
  scenarioLabels: string[];
  totalImpact: number;
} {
  let simulatedExpenses = [...expenses];
  let simulatedIncome = monthlyIncome;
  let simulatedSavingsTarget = savingsTarget;
  const scenarioLabels: string[] = [];
  let totalImpact = 0;

  for (const scenario of scenarios) {
    const safeValue = clampNonNegative(scenario.value);

    switch (scenario.type) {
      case 'reduce_category': {
        const category = String(scenario.secondaryValue || 'Other');
        const result = applyCategoryReduction(simulatedExpenses, category, safeValue);
        simulatedExpenses = result.expenses;
        totalImpact += result.actualReduction;
        scenarioLabels.push(`-$${result.actualReduction} ${category}`);
        break;
      }

      case 'increase_income': {
        simulatedIncome += safeValue;
        totalImpact += safeValue;
        scenarioLabels.push(`+$${safeValue} income`);
        break;
      }

      case 'decrease_income': {
        const decrease = safeValue < 1 ? monthlyIncome * safeValue : safeValue;
        simulatedIncome = Math.max(0, simulatedIncome - decrease);
        totalImpact -= decrease;
        scenarioLabels.push(`-$${decrease.toFixed(0)} income`);
        break;
      }

      case 'remove_subscription': {
        const result = applyCategoryReduction(simulatedExpenses, 'Personal', safeValue);
        simulatedExpenses = result.expenses;
        totalImpact += result.actualReduction;
        scenarioLabels.push(`-$${safeValue} subscription`);
        break;
      }

      case 'major_purchase': {
        const months = Number(scenario.secondaryValue || 12);
        const monthlyAmount = safeValue / months;
        simulatedSavingsTarget += monthlyAmount;
        totalImpact -= monthlyAmount;
        scenarioLabels.push(`$${safeValue}/${months}mo purchase`);
        break;
      }
    }
  }

  return {
    before: buildSnapshot({ monthlyIncome, savingsTarget, expenses, goals, now }),
    after: buildSnapshot({
      monthlyIncome: simulatedIncome,
      savingsTarget: simulatedSavingsTarget,
      expenses: simulatedExpenses,
      goals,
      now,
    }),
    scenarioLabels,
    totalImpact,
  };
}

// Calculate time to reach a goal under different scenarios
export function calculateGoalTimeline({
  targetAmount,
  currentSavings,
  monthlySavings,
}: {
  targetAmount: number;
  currentSavings: number;
  monthlySavings: number;
}): {
  monthsRemaining: number | null;
  targetDate: string | null;
  isAchievable: boolean;
} {
  if (monthlySavings <= 0) {
    return {
      monthsRemaining: null,
      targetDate: null,
      isAchievable: false,
    };
  }

  const remaining = targetAmount - currentSavings;
  if (remaining <= 0) {
    return {
      monthsRemaining: 0,
      targetDate: new Date().toISOString().slice(0, 10),
      isAchievable: true,
    };
  }

  const months = Math.ceil(remaining / monthlySavings);
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);

  return {
    monthsRemaining: months,
    targetDate: targetDate.toISOString().slice(0, 10),
    isAchievable: true,
  };
}

// Generate 12-month projection
export function generate12MonthProjection({
  monthlyIncome,
  monthlySavings,
  currentSavings = 0,
}: {
  monthlyIncome: number;
  monthlySavings: number;
  currentSavings?: number;
}): Array<{
  month: string;
  projectedSavings: number;
  cumulativeSavings: number;
}> {
  const projection: Array<{
    month: string;
    projectedSavings: number;
    cumulativeSavings: number;
  }> = [];

  let cumulative = currentSavings;
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    cumulative += monthlySavings;
    projection.push({
      month: monthLabel,
      projectedSavings: monthlySavings,
      cumulativeSavings: Number(cumulative.toFixed(2)),
    });
  }

  return projection;
}

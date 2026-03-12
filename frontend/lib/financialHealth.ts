import { ExpenseItem } from './types';

export interface FinancialHealthInputs {
  monthlyIncome: number;
  savingsTarget: number;
  totalSpent: number;
  totalSavings: number;
  expenses: ExpenseItem[];
}

export interface FinancialHealthBreakdown {
  savingsRate: number;
  categoryBalance: number;
  overspendingRisk: number;
  spendingConsistency: number;
  emergencyBuffer: number;
}

export interface FinancialHealthResult {
  score: number;
  breakdown: FinancialHealthBreakdown;
  explanation: string;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function scoreSavingsRate(monthlyIncome: number, totalSavings: number) {
  if (monthlyIncome <= 0) return 0;
  const savingsRate = totalSavings / monthlyIncome;
  const targetRate = 0.2;
  return clamp((savingsRate / targetRate) * 100);
}

function scoreCategoryBalance(expenses: ExpenseItem[]) {
  if (expenses.length === 0) return 100;
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  if (totalSpent <= 0) return 100;

  const categoryTotals = new Map<string, number>();
  for (const expense of expenses) {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) || 0) + expense.amount);
  }

  const maxShare = Math.max(...Array.from(categoryTotals.values()).map((value) => value / totalSpent));
  if (maxShare <= 0.4) return 100;
  return clamp(100 - ((maxShare - 0.4) / 0.6) * 100);
}

function scoreOverspendingRisk(monthlyIncome: number, savingsTarget: number, totalSpent: number) {
  const spendingLimit = monthlyIncome - savingsTarget;
  if (spendingLimit <= 0) return totalSpent <= 0 ? 100 : 0;
  if (totalSpent <= spendingLimit) return 100;
  const overrunRatio = (totalSpent - spendingLimit) / spendingLimit;
  return clamp(100 - overrunRatio * 100);
}

function scoreSpendingConsistency(expenses: ExpenseItem[]) {
  if (expenses.length === 0) return 100;

  const dailyTotalsMap = new Map<string, number>();
  for (const expense of expenses) {
    dailyTotalsMap.set(expense.date, (dailyTotalsMap.get(expense.date) || 0) + Number(expense.amount || 0));
  }

  const dailyTotals = Array.from(dailyTotalsMap.values());
  if (dailyTotals.length <= 1) return 100;

  const mean = dailyTotals.reduce((sum, value) => sum + value, 0) / dailyTotals.length;
  if (mean <= 0) return 100;

  const variance = dailyTotals.reduce((sum, value) => sum + (value - mean) ** 2, 0) / dailyTotals.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;

  return clamp(100 - coefficientOfVariation * 50);
}

function scoreEmergencyBuffer(totalSavings: number, monthlyExpense: number) {
  if (monthlyExpense <= 0) return totalSavings > 0 ? 100 : 0;
  const ratio = totalSavings / monthlyExpense;
  const targetRatio = 0.5;
  return clamp((ratio / targetRatio) * 100);
}

function buildHealthExplanation(score: number, breakdown: FinancialHealthBreakdown) {
  const scoredAreas: Array<{ key: keyof FinancialHealthBreakdown; label: string; score: number; hint: string }> = [
    { key: 'savingsRate', label: 'Savings Rate', score: breakdown.savingsRate, hint: 'increase monthly savings toward at least 20% of income' },
    { key: 'categoryBalance', label: 'Category Balance', score: breakdown.categoryBalance, hint: 'reduce dependence on your top spending category when it crosses 40%' },
    { key: 'overspendingRisk', label: 'Overspending Risk', score: breakdown.overspendingRisk, hint: 'keep total monthly spend within income minus savings target' },
    { key: 'spendingConsistency', label: 'Spending Consistency', score: breakdown.spendingConsistency, hint: 'smooth daily spending to avoid high-volatility expense spikes' },
    { key: 'emergencyBuffer', label: 'Emergency Buffer', score: breakdown.emergencyBuffer, hint: 'build savings to at least 50% of one month\'s expenses' },
  ];

  const weakestArea = scoredAreas.sort((left, right) => left.score - right.score)[0];

  if (score >= 80) {
    return `Excellent financial health. Keep your discipline and continue monitoring ${weakestArea.label.toLowerCase()} for long-term stability.`;
  }
  if (score >= 60) {
    return `Good progress overall. The biggest opportunity is ${weakestArea.label.toLowerCase()}; ${weakestArea.hint}.`;
  }
  if (score >= 40) {
    return `Financial health is moderate-risk. Prioritize ${weakestArea.label.toLowerCase()}; ${weakestArea.hint}.`;
  }
  return `Financial health is currently at risk. Start with ${weakestArea.label.toLowerCase()}; ${weakestArea.hint}.`;
}

export function calculateFinancialHealthScore(inputs: FinancialHealthInputs): FinancialHealthResult {
  const savingsRate = scoreSavingsRate(inputs.monthlyIncome, inputs.totalSavings);
  const categoryBalance = scoreCategoryBalance(inputs.expenses);
  const overspendingRisk = scoreOverspendingRisk(inputs.monthlyIncome, inputs.savingsTarget, inputs.totalSpent);
  const spendingConsistency = scoreSpendingConsistency(inputs.expenses);
  const emergencyBuffer = scoreEmergencyBuffer(inputs.totalSavings, inputs.totalSpent);

  const breakdown: FinancialHealthBreakdown = {
    savingsRate,
    categoryBalance,
    overspendingRisk,
    spendingConsistency,
    emergencyBuffer,
  };

  const weightedScore =
    savingsRate * 0.3 +
    categoryBalance * 0.25 +
    overspendingRisk * 0.2 +
    spendingConsistency * 0.15 +
    emergencyBuffer * 0.1;

  const score = clamp(Number(weightedScore.toFixed(1)));

  return {
    score,
    breakdown,
    explanation: buildHealthExplanation(score, breakdown),
  };
}

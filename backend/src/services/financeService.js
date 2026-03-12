// Financial calculation utilities

export function getCurrentMonthId() {
  return new Date().toISOString().slice(0, 7);
}

export function clamp(value, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

// Calculate safe daily spend
export function calculateSafeDailySpend(monthlyIncome, savingsTarget, totalSpent) {
  const now = new Date();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(totalDaysInMonth - currentDay, 1);
  
  const remainingSpendable = monthlyIncome - savingsTarget - totalSpent;
  return Number((remainingSpendable / remainingDays).toFixed(2));
}

// Calculate burn rate projection
export function calculateBurnRateProjection(totalSpent, monthlyIncome, savingsTarget) {
  const now = new Date();
  const daysPassed = Math.max(now.getDate(), 1);
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  const dailyAverage = totalSpent / daysPassed;
  const projectedMonthEndSpend = dailyAverage * totalDaysInMonth;
  const allowedSpending = monthlyIncome - savingsTarget;
  
  return {
    projectedMonthEndSpend: Number(projectedMonthEndSpend.toFixed(2)),
    isOverspending: projectedMonthEndSpend > allowedSpending,
  };
}

// Calculate financial health score
export function calculateFinancialHealthScore(monthlyIncome, savingsTarget, totalSpent, expenses) {
  // Savings rate component (30%)
  const totalSavings = monthlyIncome - totalSpent;
  const savingsRate = monthlyIncome > 0 ? (totalSavings / monthlyIncome) : 0;
  const savingsScore = clamp((savingsRate / 0.2) * 100);

  // Category balance component (25%)
  const categoryTotals = new Map();
  for (const expense of expenses) {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) || 0) + expense.amount);
  }
  const maxShare = totalSpent > 0 
    ? Math.max(...Array.from(categoryTotals.values()).map(v => v / totalSpent))
    : 0;
  const categoryScore = maxShare <= 0.4 ? 100 : clamp(100 - ((maxShare - 0.4) / 0.6) * 100);

  // Overspending risk component (20%)
  const spendingLimit = monthlyIncome - savingsTarget;
  let overspendingScore = 100;
  if (spendingLimit > 0 && totalSpent > spendingLimit) {
    const overrunRatio = (totalSpent - spendingLimit) / spendingLimit;
    overspendingScore = clamp(100 - overrunRatio * 100);
  }

  // Spending consistency component (15%)
  const dailyTotals = new Map();
  for (const expense of expenses) {
    dailyTotals.set(expense.date, (dailyTotals.get(expense.date) || 0) + expense.amount);
  }
  const dailyValues = Array.from(dailyTotals.values());
  let consistencyScore = 100;
  if (dailyValues.length > 1) {
    const mean = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
    if (mean > 0) {
      const variance = dailyValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / dailyValues.length;
      const cv = Math.sqrt(variance) / mean;
      consistencyScore = clamp(100 - cv * 50);
    }
  }

  // Emergency buffer component (10%)
  const emergencyScore = totalSpent > 0 
    ? clamp((totalSavings / totalSpent / 0.5) * 100)
    : (totalSavings > 0 ? 100 : 0);

  // Weighted score
  const score = clamp(
    savingsScore * 0.3 +
    categoryScore * 0.25 +
    overspendingScore * 0.2 +
    consistencyScore * 0.15 +
    emergencyScore * 0.1
  );

  return Number(score.toFixed(1));
}

// Calculate emergency fund months
export function calculateEmergencyFundMonths(totalSavings, monthlyExpense) {
  if (monthlyExpense <= 0) return totalSavings > 0 ? 12 : 0;
  return Number((totalSavings / monthlyExpense).toFixed(1));
}

// Get category breakdown
export function getCategoryBreakdown(expenses) {
  const categoryTotals = new Map();
  
  for (const expense of expenses) {
    categoryTotals.set(
      expense.category,
      Number(((categoryTotals.get(expense.category) || 0) + expense.amount).toFixed(2))
    );
  }

  return Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// Get structured analysis data for AI
export function getStructuredAnalysisData(settings, expenses, goals) {
  const monthlyIncome = Number(settings.monthlyIncome) || 0;
  const savingsTarget = Number(settings.savingsTarget) || 0;
  const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalSavings = monthlyIncome - totalSpent;
  
  const safeDailySpend = calculateSafeDailySpend(monthlyIncome, savingsTarget, totalSpent);
  const burnRate = calculateBurnRateProjection(totalSpent, monthlyIncome, savingsTarget);
  const healthScore = calculateFinancialHealthScore(monthlyIncome, savingsTarget, totalSpent, expenses);
  const emergencyMonths = calculateEmergencyFundMonths(totalSavings, totalSpent);
  const categoryBreakdown = getCategoryBreakdown(expenses);

  return {
    income: monthlyIncome,
    savingsTarget,
    totalSpent: Number(totalSpent.toFixed(2)),
    remainingSpendable: Number((monthlyIncome - savingsTarget - totalSpent).toFixed(2)),
    safeDailySpend,
    projectedMonthEndSpend: burnRate.projectedMonthEndSpend,
    financialHealthScore: healthScore,
    emergencyFundMonths: emergencyMonths,
    categoryBreakdown,
    goals: goals.map(g => ({
      name: g.name,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate,
    })),
  };
}

export default {
  getCurrentMonthId,
  clamp,
  calculateSafeDailySpend,
  calculateBurnRateProjection,
  calculateFinancialHealthScore,
  calculateEmergencyFundMonths,
  getCategoryBreakdown,
  getStructuredAnalysisData,
};

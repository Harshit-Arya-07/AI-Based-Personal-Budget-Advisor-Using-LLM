// Financial Context Aggregator Service
// Builds comprehensive financial summary for AI consumption

import firestoreService from './firestoreService.js';
import financeService from './financeService.js';

/**
 * Aggregate all financial data for a user
 * This is sent to AI before every call
 */
export async function aggregateFinancialContext(uid) {
  const currentMonthId = financeService.getCurrentMonthId();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Fetch all required data in parallel
  const [profile, allExpenses, goals] = await Promise.all([
    firestoreService.getUserProfile(uid),
    firestoreService.getExpenses(uid),
    firestoreService.getGoals(uid),
  ]);

  const settings = profile?.settings || {};
  const monthlyIncome = Number(settings.monthlyIncome) || 0;
  const savingsTarget = Number(settings.savingsTarget) || 0;

  // Filter current month expenses
  const currentMonthExpenses = allExpenses.filter(e => e.date.startsWith(currentMonthId));
  const totalSpentThisMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(currentMonthExpenses, totalSpentThisMonth);

  // Calculate spending trend (last 7 days vs previous 7 days)
  const spendingTrend = calculateSpendingTrend(allExpenses, todayStr);

  // Calculate financial metrics
  const safeDailySpend = financeService.calculateSafeDailySpend(
    monthlyIncome,
    savingsTarget,
    totalSpentThisMonth
  );

  const burnRate = financeService.calculateBurnRateProjection(
    totalSpentThisMonth,
    monthlyIncome,
    savingsTarget
  );

  const healthScore = financeService.calculateFinancialHealthScore(
    monthlyIncome,
    savingsTarget,
    totalSpentThisMonth,
    currentMonthExpenses
  );

  // Calculate emergency fund coverage
  const avgMonthlySpending = totalSpentThisMonth || 1;
  const monthlySavings = monthlyIncome - totalSpentThisMonth;
  const emergencyFundMonths = monthlySavings > 0
    ? Math.max(0, (monthlySavings * 3) / avgMonthlySpending).toFixed(1)
    : '0';

  // Calculate financial mood indicators
  const moodIndicators = calculateMoodIndicators(
    allExpenses,
    goals,
    monthlyIncome,
    savingsTarget,
    totalSpentThisMonth,
    currentMonthId
  );

  // Calculate goal progress
  const goalProgress = goals.map(goal => {
    const daysUntilDeadline = Math.ceil(
      (new Date(goal.targetDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const monthsRemaining = Math.max(1, daysUntilDeadline / 30);
    const requiredMonthlySavings = goal.targetAmount / monthsRemaining;
    const onTrack = monthlySavings >= requiredMonthlySavings;

    return {
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      daysRemaining: Math.max(0, daysUntilDeadline),
      requiredMonthlySavings: Number(requiredMonthlySavings.toFixed(2)),
      onTrack,
    };
  });

  return {
    // Core financial data
    income: monthlyIncome,
    savingsTarget,
    totalSpentThisMonth: Number(totalSpentThisMonth.toFixed(2)),
    remainingBudget: Number((monthlyIncome - savingsTarget - totalSpentThisMonth).toFixed(2)),

    // Calculated metrics
    safeDailySpend,
    projectedMonthEndSpend: burnRate.projectedMonthEndSpend,
    isOverspending: burnRate.isOverspending,
    financialHealthScore: healthScore.overall,

    // Risk indicators
    emergencyFundMonths: Number(emergencyFundMonths),
    savingsRate: monthlyIncome > 0
      ? Number(((monthlyIncome - totalSpentThisMonth) / monthlyIncome * 100).toFixed(1))
      : 0,

    // Breakdowns
    categoryBreakdown,
    spendingTrend,

    // Goals
    goals: goalProgress,
    hasGoals: goals.length > 0,

    // Mood indicators
    moodIndicators,

    // Meta
    currentMonth: currentMonthId,
    expenseCount: currentMonthExpenses.length,
    dataQuality: currentMonthExpenses.length >= 10 ? 'Good' : 'Limited',
  };
}

/**
 * Calculate category spending breakdown
 */
function calculateCategoryBreakdown(expenses, totalSpent) {
  const categoryTotals = new Map();

  for (const expense of expenses) {
    const cat = expense.category || 'Other';
    categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + expense.amount);
  }

  return Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      percentage: totalSpent > 0 ? Number((amount / totalSpent * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate 7-day spending trend
 */
function calculateSpendingTrend(expenses, todayStr) {
  const today = new Date(todayStr);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);

  const last7Days = expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate >= sevenDaysAgo && expDate <= today;
  });

  const previous7Days = expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate >= fourteenDaysAgo && expDate < sevenDaysAgo;
  });

  const last7Total = last7Days.reduce((sum, e) => sum + e.amount, 0);
  const prev7Total = previous7Days.reduce((sum, e) => sum + e.amount, 0);

  let trend = 'stable';
  let percentChange = 0;

  if (prev7Total > 0) {
    percentChange = ((last7Total - prev7Total) / prev7Total) * 100;
    if (percentChange > 15) trend = 'increasing';
    else if (percentChange < -15) trend = 'decreasing';
  }

  return {
    last7DaysSpent: Number(last7Total.toFixed(2)),
    previous7DaysSpent: Number(prev7Total.toFixed(2)),
    percentChange: Number(percentChange.toFixed(1)),
    trend,
    interpretation: trend === 'increasing'
      ? 'Spending has increased compared to last week'
      : trend === 'decreasing'
        ? 'Spending has decreased compared to last week'
        : 'Spending is stable',
  };
}

/**
 * Calculate financial mood indicators
 */
function calculateMoodIndicators(expenses, goals, income, savingsTarget, totalSpent, currentMonthId) {
  // Savings rate trend (compare current to historical)
  const currentSavingsRate = income > 0 ? (income - totalSpent) / income : 0;
  
  // Get last 3 months of spending for volatility
  const monthlySpending = new Map();
  for (const expense of expenses) {
    const month = expense.date.slice(0, 7);
    monthlySpending.set(month, (monthlySpending.get(month) || 0) + expense.amount);
  }

  const monthlyValues = Array.from(monthlySpending.values());
  const volatility = calculateVolatility(monthlyValues);

  // Goal progress gap
  let goalProgressGap = 0;
  if (goals.length > 0 && income > 0) {
    const totalRequired = goals.reduce((sum, g) => {
      const daysRemaining = Math.max(1, Math.ceil(
        (new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ));
      return sum + (g.targetAmount / (daysRemaining / 30));
    }, 0);
    const monthlySavings = income - totalSpent;
    goalProgressGap = monthlySavings >= totalRequired ? 0 : 
      Number(((totalRequired - monthlySavings) / totalRequired * 100).toFixed(1));
  }

  return {
    savingsRateTrend: currentSavingsRate >= 0.2 ? 'healthy' : currentSavingsRate >= 0.1 ? 'moderate' : 'low',
    spendingVolatility: volatility > 40 ? 'high' : volatility > 20 ? 'moderate' : 'low',
    goalProgressGap,
    isOnTrack: currentSavingsRate >= savingsTarget / (income || 1) && goalProgressGap < 20,
  };
}

function calculateVolatility(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return (Math.sqrt(variance) / mean) * 100;
}

export default {
  aggregateFinancialContext,
};

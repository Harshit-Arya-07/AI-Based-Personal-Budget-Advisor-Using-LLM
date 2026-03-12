// Spending Personality Detection Service
// Calculates financial metrics and provides heuristic classification

/**
 * Personality Types:
 * 1. Disciplined Planner - High savings rate, low volatility, balanced categories
 * 2. Impulsive Spender - High volatility, category concentration, overspending
 * 3. Lifestyle Optimizer - Moderate savings, optimized necessities, lifestyle focus
 * 4. Risk Taker - Variable spending, low emergency fund, investment focus
 * 5. Conservative Saver - Very high savings rate, minimal discretionary spending
 * 6. Balanced Manager - Moderate everything, stable and sustainable approach
 */

const PERSONALITY_TYPES = {
  DISCIPLINED_PLANNER: 'Disciplined Planner',
  IMPULSIVE_SPENDER: 'Impulsive Spender',
  LIFESTYLE_OPTIMIZER: 'Lifestyle Optimizer',
  RISK_TAKER: 'Risk Taker',
  CONSERVATIVE_SAVER: 'Conservative Saver',
  BALANCED_MANAGER: 'Balanced Manager',
};

// Category classifications
const ESSENTIAL_CATEGORIES = ['housing', 'utilities', 'groceries', 'healthcare', 'transportation'];
const LIFESTYLE_CATEGORIES = ['dining', 'entertainment', 'shopping', 'travel', 'subscriptions'];
const VARIABLE_CATEGORIES = ['dining', 'entertainment', 'shopping', 'other'];

/**
 * Calculate spending personality metrics from financial data
 */
export function calculatePersonalityMetrics(expenses, monthlyIncome, savingsTarget) {
  if (!expenses || expenses.length === 0 || !monthlyIncome || monthlyIncome <= 0) {
    return null;
  }

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  // 1. Savings Rate = (Income - TotalSpent) / Income
  const savingsRate = (monthlyIncome - totalSpent) / monthlyIncome;
  
  // 2. Category breakdown and concentration
  const categoryTotals = new Map();
  for (const expense of expenses) {
    const cat = expense.category?.toLowerCase() || 'other';
    categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + expense.amount);
  }
  
  // Calculate category concentration (Herfindahl-Hirschman Index style)
  const categoryShares = Array.from(categoryTotals.values()).map(v => v / totalSpent);
  const maxCategoryShare = Math.max(...categoryShares);
  const categoryConcentration = categoryShares.reduce((sum, share) => sum + (share * share), 0);
  
  // 3. Variable vs Fixed expense ratio
  let variableExpenses = 0;
  let essentialExpenses = 0;
  let lifestyleExpenses = 0;
  
  for (const [category, amount] of categoryTotals) {
    if (VARIABLE_CATEGORIES.includes(category)) {
      variableExpenses += amount;
    }
    if (ESSENTIAL_CATEGORIES.includes(category)) {
      essentialExpenses += amount;
    }
    if (LIFESTYLE_CATEGORIES.includes(category)) {
      lifestyleExpenses += amount;
    }
  }
  
  const variableExpenseRatio = totalSpent > 0 ? variableExpenses / totalSpent : 0;
  const essentialRatio = totalSpent > 0 ? essentialExpenses / totalSpent : 0;
  const lifestyleRatio = totalSpent > 0 ? lifestyleExpenses / totalSpent : 0;
  
  // 4. Spending volatility (week-to-week change)
  const weeklyTotals = calculateWeeklyTotals(expenses);
  const spendingVolatility = calculateVolatility(weeklyTotals);
  
  // 5. Emergency fund months calculation
  const avgMonthlySpending = totalSpent;
  const monthlyNet = monthlyIncome - totalSpent;
  const emergencyFundMonths = monthlyNet > 0 
    ? Math.max(0, monthlyNet * 3 / avgMonthlySpending) // Estimate based on savings rate
    : 0;
  
  // 6. Daily spending pattern analysis
  const dailyTotals = calculateDailyTotals(expenses);
  const dailyConsistency = calculateDailyConsistency(dailyTotals);
  
  // Build category breakdown for AI
  const categoryBreakdown = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      percentage: Number(((amount / totalSpent) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    savingsRate: Number(savingsRate.toFixed(4)),
    savingsRatePercent: Number((savingsRate * 100).toFixed(1)),
    variableExpenseRatio: Number(variableExpenseRatio.toFixed(4)),
    variableExpensePercent: Number((variableExpenseRatio * 100).toFixed(1)),
    essentialRatio: Number(essentialRatio.toFixed(4)),
    essentialPercent: Number((essentialRatio * 100).toFixed(1)),
    lifestyleRatio: Number(lifestyleRatio.toFixed(4)),
    lifestylePercent: Number((lifestyleRatio * 100).toFixed(1)),
    categoryConcentration: Number(categoryConcentration.toFixed(4)),
    maxCategoryShare: Number((maxCategoryShare * 100).toFixed(1)),
    spendingVolatility: Number(spendingVolatility.toFixed(2)),
    emergencyFundMonths: Number(emergencyFundMonths.toFixed(1)),
    dailyConsistency: Number(dailyConsistency.toFixed(1)),
    totalSpent: Number(totalSpent.toFixed(2)),
    monthlyIncome,
    savingsTarget,
    categoryBreakdown,
    expenseCount: expenses.length,
  };
}

/**
 * Heuristic-based personality classification
 * Returns likely personality type with confidence
 */
export function classifyPersonalityHeuristic(metrics) {
  if (!metrics) return { type: PERSONALITY_TYPES.BALANCED_MANAGER, confidence: 'Low', reasoning: 'Insufficient data' };

  const {
    savingsRate,
    variableExpenseRatio,
    categoryConcentration,
    spendingVolatility,
    emergencyFundMonths,
    essentialRatio,
    lifestyleRatio,
  } = metrics;

  // Scoring based on heuristic rules
  const scores = {
    [PERSONALITY_TYPES.DISCIPLINED_PLANNER]: 0,
    [PERSONALITY_TYPES.IMPULSIVE_SPENDER]: 0,
    [PERSONALITY_TYPES.LIFESTYLE_OPTIMIZER]: 0,
    [PERSONALITY_TYPES.RISK_TAKER]: 0,
    [PERSONALITY_TYPES.CONSERVATIVE_SAVER]: 0,
    [PERSONALITY_TYPES.BALANCED_MANAGER]: 0,
  };

  // Rule 1: Savings Rate Analysis
  if (savingsRate >= 0.3) {
    scores[PERSONALITY_TYPES.CONSERVATIVE_SAVER] += 3;
    scores[PERSONALITY_TYPES.DISCIPLINED_PLANNER] += 2;
  } else if (savingsRate >= 0.2) {
    scores[PERSONALITY_TYPES.DISCIPLINED_PLANNER] += 2;
    scores[PERSONALITY_TYPES.BALANCED_MANAGER] += 2;
  } else if (savingsRate >= 0.1) {
    scores[PERSONALITY_TYPES.BALANCED_MANAGER] += 2;
    scores[PERSONALITY_TYPES.LIFESTYLE_OPTIMIZER] += 1;
  } else if (savingsRate >= 0) {
    scores[PERSONALITY_TYPES.LIFESTYLE_OPTIMIZER] += 2;
    scores[PERSONALITY_TYPES.RISK_TAKER] += 1;
  } else {
    scores[PERSONALITY_TYPES.IMPULSIVE_SPENDER] += 3;
    scores[PERSONALITY_TYPES.RISK_TAKER] += 1;
  }

  // Rule 2: Spending Volatility Analysis
  if (spendingVolatility > 80) {
    scores[PERSONALITY_TYPES.IMPULSIVE_SPENDER] += 3;
    scores[PERSONALITY_TYPES.RISK_TAKER] += 2;
  } else if (spendingVolatility > 50) {
    scores[PERSONALITY_TYPES.LIFESTYLE_OPTIMIZER] += 1;
    scores[PERSONALITY_TYPES.RISK_TAKER] += 1;
  } else if (spendingVolatility < 30) {
    scores[PERSONALITY_TYPES.DISCIPLINED_PLANNER] += 2;
    scores[PERSONALITY_TYPES.CONSERVATIVE_SAVER] += 2;
  } else {
    scores[PERSONALITY_TYPES.BALANCED_MANAGER] += 2;
  }

  // Rule 3: Category Concentration
  if (categoryConcentration > 0.4) {
    scores[PERSONALITY_TYPES.IMPULSIVE_SPENDER] += 2;
  } else if (categoryConcentration < 0.2) {
    scores[PERSONALITY_TYPES.BALANCED_MANAGER] += 2;
    scores[PERSONALITY_TYPES.DISCIPLINED_PLANNER] += 1;
  }

  // Rule 4: Variable Expense Ratio
  if (variableExpenseRatio > 0.5) {
    scores[PERSONALITY_TYPES.IMPULSIVE_SPENDER] += 2;
    scores[PERSONALITY_TYPES.LIFESTYLE_OPTIMIZER] += 1;
  } else if (variableExpenseRatio < 0.2) {
    scores[PERSONALITY_TYPES.CONSERVATIVE_SAVER] += 2;
    scores[PERSONALITY_TYPES.DISCIPLINED_PLANNER] += 1;
  }

  // Rule 5: Essential vs Lifestyle Spending
  if (lifestyleRatio > 0.4) {
    scores[PERSONALITY_TYPES.LIFESTYLE_OPTIMIZER] += 3;
  } else if (essentialRatio > 0.7) {
    scores[PERSONALITY_TYPES.CONSERVATIVE_SAVER] += 2;
  }

  // Rule 6: Emergency Fund Coverage
  if (emergencyFundMonths < 1) {
    scores[PERSONALITY_TYPES.RISK_TAKER] += 2;
    scores[PERSONALITY_TYPES.IMPULSIVE_SPENDER] += 1;
  } else if (emergencyFundMonths >= 3) {
    scores[PERSONALITY_TYPES.CONSERVATIVE_SAVER] += 2;
    scores[PERSONALITY_TYPES.DISCIPLINED_PLANNER] += 1;
  }

  // Find winning type
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [winnerType, winnerScore] = sortedScores[0];
  const [runnerUp, runnerUpScore] = sortedScores[1];

  // Determine confidence
  let confidence = 'Medium';
  if (winnerScore >= 8 && winnerScore - runnerUpScore >= 3) {
    confidence = 'High';
  } else if (winnerScore <= 4 || winnerScore - runnerUpScore <= 1) {
    confidence = 'Low';
  }

  return {
    type: winnerType,
    confidence,
    scores: sortedScores,
    reasoning: generateHeuristicReasoning(winnerType, metrics),
  };
}

/**
 * Generate reasoning for heuristic classification
 */
function generateHeuristicReasoning(type, metrics) {
  const reasons = [];
  
  switch (type) {
    case PERSONALITY_TYPES.DISCIPLINED_PLANNER:
      reasons.push(`Savings rate of ${metrics.savingsRatePercent}% shows strong financial discipline`);
      if (metrics.spendingVolatility < 40) reasons.push('Consistent spending patterns indicate planning');
      break;
    case PERSONALITY_TYPES.IMPULSIVE_SPENDER:
      if (metrics.savingsRate < 0.1) reasons.push(`Low savings rate (${metrics.savingsRatePercent}%) suggests reactive spending`);
      if (metrics.spendingVolatility > 60) reasons.push('High spending volatility indicates impulsive behavior');
      break;
    case PERSONALITY_TYPES.LIFESTYLE_OPTIMIZER:
      reasons.push(`${metrics.lifestylePercent}% spent on lifestyle categories`);
      if (metrics.savingsRate > 0) reasons.push('Balanced approach to enjoying life while saving');
      break;
    case PERSONALITY_TYPES.RISK_TAKER:
      if (metrics.emergencyFundMonths < 2) reasons.push('Low emergency coverage suggests comfort with risk');
      if (metrics.variableExpenseRatio > 0.3) reasons.push('Higher allocation to variable expenses');
      break;
    case PERSONALITY_TYPES.CONSERVATIVE_SAVER:
      reasons.push(`High savings rate of ${metrics.savingsRatePercent}%`);
      if (metrics.essentialPercent > 50) reasons.push('Focus on essential spending');
      break;
    case PERSONALITY_TYPES.BALANCED_MANAGER:
      reasons.push('Moderate savings and spending across categories');
      reasons.push('Sustainable financial approach');
      break;
  }
  
  return reasons.join('. ');
}

/**
 * Build structured summary for AI analysis
 */
export function buildAISummary(metrics, heuristicResult) {
  return {
    // Core metrics
    monthlyIncome: metrics.monthlyIncome,
    totalSpent: metrics.totalSpent,
    savingsTarget: metrics.savingsTarget,
    
    // Calculated ratios
    savingsRatePercent: metrics.savingsRatePercent,
    variableExpensePercent: metrics.variableExpensePercent,
    essentialSpendingPercent: metrics.essentialPercent,
    lifestyleSpendingPercent: metrics.lifestylePercent,
    
    // Risk indicators
    categoryConcentrationIndex: metrics.categoryConcentration,
    topCategorySharePercent: metrics.maxCategoryShare,
    weeklySpendingVolatility: metrics.spendingVolatility,
    dailyConsistencyScore: metrics.dailyConsistency,
    estimatedEmergencyFundMonths: metrics.emergencyFundMonths,
    
    // Category breakdown
    categoryBreakdown: metrics.categoryBreakdown,
    
    // Heuristic hint (AI can agree or disagree)
    heuristicSuggestion: heuristicResult.type,
    heuristicConfidence: heuristicResult.confidence,
    heuristicReasoning: heuristicResult.reasoning,
    
    // Data quality
    expenseCount: metrics.expenseCount,
  };
}

// Helper functions
function calculateWeeklyTotals(expenses) {
  const weeklyMap = new Map();
  
  for (const expense of expenses) {
    const date = new Date(expense.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + expense.amount);
  }
  
  return Array.from(weeklyMap.values());
}

function calculateDailyTotals(expenses) {
  const dailyMap = new Map();
  for (const expense of expenses) {
    dailyMap.set(expense.date, (dailyMap.get(expense.date) || 0) + expense.amount);
  }
  return Array.from(dailyMap.values());
}

function calculateVolatility(values) {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Coefficient of variation as percentage
  return (stdDev / mean) * 100;
}

function calculateDailyConsistency(dailyValues) {
  if (dailyValues.length < 2) return 100;
  
  const mean = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
  if (mean === 0) return 100;
  
  const variance = dailyValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / dailyValues.length;
  const cv = Math.sqrt(variance) / mean;
  
  // Higher score = more consistent (inverse of volatility)
  return Math.max(0, Math.min(100, 100 - cv * 50));
}

export default {
  calculatePersonalityMetrics,
  classifyPersonalityHeuristic,
  buildAISummary,
  PERSONALITY_TYPES,
};

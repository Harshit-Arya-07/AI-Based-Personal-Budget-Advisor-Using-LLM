// TypeScript type definitions

export interface AiResponse {
  overallAssessment: string;
  riskWarnings: string[];
  savingsGoalAnalysis: string;
  categoryOptimizationAdvice: string[];
  actionPlan: string[];
  financialRiskLevel: 'Low' | 'Medium' | 'High';
  confidenceLevel: 'Low' | 'Medium' | 'High';
}

export interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  date: string;
  timestamp: string | null;
}

export interface UserSettings {
  monthlyIncome: number;
  savingsTarget: number;
}

export interface MonthlyBudget {
  month: string;
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  savingsRate: number;
  savingsTarget: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  createdAt: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  settings?: UserSettings;
  createdAt: string | null;
}

// Spending Personality Types
export type PersonalityType = 
  | 'Disciplined Planner'
  | 'Impulsive Spender'
  | 'Lifestyle Optimizer'
  | 'Risk Taker'
  | 'Conservative Saver'
  | 'Balanced Manager';

export interface SpendingPersonality {
  personalityType: PersonalityType;
  reasoning: string;
  strengths: string[];
  risks: string[];
  improvementFocus: string[];
}

export interface PersonalityMetrics {
  savingsRatePercent: number;
  variableExpensePercent: number;
  essentialPercent: number;
  lifestylePercent: number;
  spendingVolatility: number;
  dailyConsistency: number;
  emergencyFundMonths: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
}

export interface PersonalityResponse {
  personality: SpendingPersonality;
  metrics: PersonalityMetrics;
  heuristic: {
    type: PersonalityType;
    confidence: 'Low' | 'Medium' | 'High';
  };
  dataQuality: {
    expenseCount: number;
    hasEnoughData: boolean;
  };
}

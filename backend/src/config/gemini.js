import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY not set. AI analysis will fail.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Spending Personality Response Schema
const personalityResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    personalityType: {
      type: SchemaType.STRING,
      enum: [
        'Disciplined Planner',
        'Impulsive Spender',
        'Lifestyle Optimizer',
        'Risk Taker',
        'Conservative Saver',
        'Balanced Manager',
      ],
      description: 'The spending personality classification',
    },
    reasoning: {
      type: SchemaType.STRING,
      description: 'Explanation for the personality classification based on the metrics provided',
    },
    strengths: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Financial strengths identified from the data',
    },
    risks: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Financial risks or concerns identified',
    },
    improvementFocus: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Specific areas to focus on for financial improvement',
    },
  },
  required: ['personalityType', 'reasoning', 'strengths', 'risks', 'improvementFocus'],
};

const analysisResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    overallAssessment: { type: SchemaType.STRING, description: 'Brief overall financial assessment' },
    riskWarnings: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of financial risk warnings',
    },
    savingsGoalAnalysis: { type: SchemaType.STRING, description: 'Analysis of savings goal progress' },
    categoryOptimizationAdvice: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Advice for optimizing spending by category',
    },
    actionPlan: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Specific action items for financial improvement',
    },
    financialRiskLevel: {
      type: SchemaType.STRING,
      enum: ['Low', 'Medium', 'High'],
      description: 'Overall financial risk level',
    },
    confidenceLevel: {
      type: SchemaType.STRING,
      enum: ['Low', 'Medium', 'High'],
      description: 'Confidence in the analysis',
    },
  },
  required: [
    'overallAssessment',
    'riskWarnings',
    'savingsGoalAnalysis',
    'categoryOptimizationAdvice',
    'actionPlan',
    'financialRiskLevel',
    'confidenceLevel',
  ],
};

export async function analyzeBudgetWithGemini(financialData) {
  if (!genAI) {
    throw new Error('AI_ANALYSIS_FAILED: Gemini API key not configured');
  }

  const prompt = buildPrompt(financialData);
  const timeout = Number(process.env.GEMINI_TIMEOUT_MS) || 45000;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: analysisResponseSchema,
      temperature: 0.1,
      maxOutputTokens: 700,
    },
  });

  const result = await Promise.race([
    model.generateContent(prompt),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`AI_ANALYSIS_FAILED: Analysis timed out after ${timeout}ms`)), timeout)
    ),
  ]);

  const text = result.response?.text?.() || '';
  
  try {
    const parsed = JSON.parse(text);
    return validateAndNormalize(parsed);
  } catch (parseError) {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return validateAndNormalize(parsed);
    }
    throw new Error('AI_ANALYSIS_FAILED: Model did not return valid JSON');
  }
}

function buildPrompt(data) {
  return `You are a personal finance advisor AI. Analyze this financial data and provide actionable insights.

FINANCIAL DATA:
- Monthly Income: $${data.income}
- Savings Target: $${data.savingsTarget}
- Total Spent This Month: $${data.totalSpent}
- Remaining Spendable: $${data.remainingSpendable}
- Safe Daily Spend: $${data.safeDailySpend}
- Projected Month-End Spend: $${data.projectedMonthEndSpend}
- Financial Health Score: ${data.financialHealthScore}/100
- Emergency Fund Coverage: ${data.emergencyFundMonths} months

SPENDING BY CATEGORY:
${data.categoryBreakdown.map(c => `- ${c.category}: $${c.amount}`).join('\n')}

SAVINGS GOALS:
${data.goals.length ? data.goals.map(g => `- ${g.name}: $${g.targetAmount} by ${g.targetDate}`).join('\n') : 'No goals set'}

Provide a structured JSON analysis with practical advice.`;
}

function validateAndNormalize(data) {
  return {
    overallAssessment: String(data.overallAssessment || 'Unable to generate assessment'),
    riskWarnings: Array.isArray(data.riskWarnings) ? data.riskWarnings.map(String) : [],
    savingsGoalAnalysis: String(data.savingsGoalAnalysis || 'No savings goal analysis available'),
    categoryOptimizationAdvice: Array.isArray(data.categoryOptimizationAdvice) ? data.categoryOptimizationAdvice.map(String) : [],
    actionPlan: Array.isArray(data.actionPlan) ? data.actionPlan.map(String) : [],
    financialRiskLevel: ['Low', 'Medium', 'High'].includes(data.financialRiskLevel) ? data.financialRiskLevel : 'Medium',
    confidenceLevel: ['Low', 'Medium', 'High'].includes(data.confidenceLevel) ? data.confidenceLevel : 'Medium',
  };
}

/**
 * Analyze spending personality using Gemini AI
 */
export async function analyzeSpendingPersonality(summaryData) {
  if (!genAI) {
    throw new Error('AI_ANALYSIS_FAILED: Gemini API key not configured');
  }

  const prompt = buildPersonalityPrompt(summaryData);
  const timeout = Number(process.env.GEMINI_TIMEOUT_MS) || 45000;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: personalityResponseSchema,
      temperature: 0.2,
      maxOutputTokens: 800,
    },
  });

  const result = await Promise.race([
    model.generateContent(prompt),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`AI_ANALYSIS_FAILED: Analysis timed out after ${timeout}ms`)), timeout)
    ),
  ]);

  const text = result.response?.text?.() || '';
  
  try {
    const parsed = JSON.parse(text);
    return validatePersonalityResponse(parsed);
  } catch (parseError) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return validatePersonalityResponse(parsed);
    }
    throw new Error('AI_ANALYSIS_FAILED: Model did not return valid JSON');
  }
}

function buildPersonalityPrompt(data) {
  const validTypes = [
    'Disciplined Planner',
    'Impulsive Spender', 
    'Lifestyle Optimizer',
    'Risk Taker',
    'Conservative Saver',
    'Balanced Manager',
  ];

  return `You are a financial behavior analyst. Classify the user's spending personality based ONLY on the metrics provided below. Do NOT invent or assume any numbers not given.

AVAILABLE PERSONALITY TYPES:
1. Disciplined Planner - High savings rate, low volatility, balanced categories
2. Impulsive Spender - High volatility, category concentration, overspending
3. Lifestyle Optimizer - Moderate savings, lifestyle category focus
4. Risk Taker - Variable spending, low emergency fund
5. Conservative Saver - Very high savings rate, minimal discretionary spending
6. Balanced Manager - Moderate everything, stable approach

FINANCIAL METRICS PROVIDED:
- Monthly Income: $${data.monthlyIncome}
- Total Spent: $${data.totalSpent}
- Savings Target: $${data.savingsTarget}
- Savings Rate: ${data.savingsRatePercent}%
- Variable Expense Ratio: ${data.variableExpensePercent}%
- Essential Spending: ${data.essentialSpendingPercent}%
- Lifestyle Spending: ${data.lifestyleSpendingPercent}%
- Category Concentration Index: ${data.categoryConcentrationIndex}
- Top Category Share: ${data.topCategorySharePercent}%
- Weekly Spending Volatility: ${data.weeklySpendingVolatility}%
- Daily Consistency Score: ${data.dailyConsistencyScore}/100
- Emergency Fund Coverage: ${data.estimatedEmergencyFundMonths} months
- Total Expenses Analyzed: ${data.expenseCount}

SPENDING BY CATEGORY:
${data.categoryBreakdown.map(c => `- ${c.category}: $${c.amount} (${c.percentage}%)`).join('\n')}

HEURISTIC SUGGESTION (you may agree or disagree based on data):
- Suggested Type: ${data.heuristicSuggestion}
- Confidence: ${data.heuristicConfidence}
- Reasoning: ${data.heuristicReasoning}

Based on the metrics above, provide your classification. Reference specific numbers from the data in your reasoning. The personalityType must be exactly one of: ${validTypes.join(', ')}.`;
}

function validatePersonalityResponse(data) {
  const validTypes = [
    'Disciplined Planner',
    'Impulsive Spender',
    'Lifestyle Optimizer',
    'Risk Taker',
    'Conservative Saver',
    'Balanced Manager',
  ];

  const personalityType = validTypes.includes(data.personalityType) 
    ? data.personalityType 
    : 'Balanced Manager';

  return {
    personalityType,
    reasoning: String(data.reasoning || 'Classification based on spending patterns'),
    strengths: Array.isArray(data.strengths) ? data.strengths.map(String).slice(0, 5) : [],
    risks: Array.isArray(data.risks) ? data.risks.map(String).slice(0, 5) : [],
    improvementFocus: Array.isArray(data.improvementFocus) ? data.improvementFocus.map(String).slice(0, 5) : [],
  };
}

export default { analyzeBudgetWithGemini, analyzeSpendingPersonality };

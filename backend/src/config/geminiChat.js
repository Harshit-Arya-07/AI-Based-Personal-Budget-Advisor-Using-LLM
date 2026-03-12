// Gemini Chat Integration
// Handles AI chat with financial context, streaming, and structured responses

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { PERSONALITY_PROMPTS } from '../services/aiChatService.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Chat response schema
const chatResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    reply: {
      type: SchemaType.STRING,
      description: 'The main response message to the user',
    },
    insight: {
      type: SchemaType.STRING,
      description: 'A key financial insight based on the conversation',
    },
    suggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Actionable financial suggestions (2-4 items)',
    },
    riskLevel: {
      type: SchemaType.STRING,
      enum: ['Low', 'Medium', 'High'],
      description: 'Current financial risk assessment',
    },
    quickReplies: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Short follow-up questions user can tap (3-5 items)',
    },
    financialMood: {
      type: SchemaType.STRING,
      enum: ['Stable', 'Improving', 'Risky', 'Declining'],
      description: 'Overall financial mood based on trends',
    },
    moodReason: {
      type: SchemaType.STRING,
      description: 'Brief explanation for the financial mood',
    },
    topRiskFactors: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Top risk factors identified (0-3 items)',
    },
    actionPlan: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Prioritized action items (1-3 items)',
    },
  },
  required: ['reply', 'riskLevel', 'quickReplies', 'financialMood'],
};

// Monthly summary response schema
const monthlySummarySchema = {
  type: SchemaType.OBJECT,
  properties: {
    headline: {
      type: SchemaType.STRING,
      description: 'One-line summary headline',
    },
    overallAssessment: {
      type: SchemaType.STRING,
      description: 'Detailed monthly assessment',
    },
    achievements: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Positive highlights from the month',
    },
    concerns: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Areas of concern',
    },
    nextMonthGoals: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Suggested goals for next month',
    },
    financialMood: {
      type: SchemaType.STRING,
      enum: ['Stable', 'Improving', 'Risky', 'Declining'],
    },
    riskLevel: {
      type: SchemaType.STRING,
      enum: ['Low', 'Medium', 'High'],
    },
  },
  required: ['headline', 'overallAssessment', 'financialMood', 'riskLevel'],
};

/**
 * Build system prompt with personality and financial context
 */
function buildSystemPrompt(personalityMode, financialContext) {
  const personalityPrompt = PERSONALITY_PROMPTS[personalityMode] || PERSONALITY_PROMPTS.friendly;

  return `${personalityPrompt}

You are an AI financial assistant with access to the user's real financial data. 
IMPORTANT: Only reference numbers and data explicitly provided. Never invent statistics.

CURRENT FINANCIAL SNAPSHOT:
- Monthly Income: $${financialContext.income}
- Savings Target: $${financialContext.savingsTarget}
- Spent This Month: $${financialContext.totalSpentThisMonth}
- Remaining Budget: $${financialContext.remainingBudget}
- Safe Daily Spend: $${financialContext.safeDailySpend}
- Projected Month-End Spend: $${financialContext.projectedMonthEndSpend}
- Financial Health Score: ${financialContext.financialHealthScore}/100
- Emergency Fund Coverage: ${financialContext.emergencyFundMonths} months
- Savings Rate: ${financialContext.savingsRate}%
${financialContext.isOverspending ? '⚠️ WARNING: Currently overspending trajectory!' : ''}

SPENDING BY CATEGORY:
${financialContext.categoryBreakdown.slice(0, 5).map(c => `- ${c.category}: $${c.amount} (${c.percentage}%)`).join('\n')}

7-DAY SPENDING TREND:
- Last 7 days: $${financialContext.spendingTrend.last7DaysSpent}
- Previous 7 days: $${financialContext.spendingTrend.previous7DaysSpent}
- Trend: ${financialContext.spendingTrend.trend} (${financialContext.spendingTrend.percentChange}%)

SAVINGS GOALS:
${financialContext.hasGoals 
  ? financialContext.goals.map(g => `- ${g.name}: $${g.targetAmount} by ${g.targetDate} (${g.onTrack ? '✓ On track' : '⚠️ Behind'})`).join('\n')
  : 'No goals set'}

MOOD INDICATORS:
- Savings Rate Trend: ${financialContext.moodIndicators.savingsRateTrend}
- Spending Volatility: ${financialContext.moodIndicators.spendingVolatility}
- Goal Progress Gap: ${financialContext.moodIndicators.goalProgressGap}%

DATA QUALITY: ${financialContext.dataQuality} (${financialContext.expenseCount} expenses this month)

Guidelines:
1. Be concise but helpful
2. Reference specific numbers from the data above
3. Always provide actionable advice
4. Generate relevant quick reply suggestions
5. Assess financial risk honestly
6. Determine financial mood based on the indicators`;
}

/**
 * Generate chat response with structured output
 */
export async function generateChatResponse(
  userMessage,
  chatHistory,
  financialContext,
  personalityMode
) {
  console.log('generateChatResponse called');
  console.log('genAI available:', !!genAI);
  console.log('API key present:', !!GEMINI_API_KEY);
  
  if (!genAI) {
    throw new Error('AI_CHAT_FAILED: Gemini API key not configured');
  }

  const systemPrompt = buildSystemPrompt(personalityMode, financialContext);
  const timeout = Number(process.env.GEMINI_TIMEOUT_MS) || 30000;
  console.log('System prompt length:', systemPrompt.length);

  // Build conversation history for context
  const conversationParts = chatHistory.slice(-8).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.message }],
  }));
  console.log('Conversation parts:', conversationParts.length);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: chatResponseSchema,
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  });

  // Start chat with history
  const chat = model.startChat({
    history: conversationParts,
  });

  console.log('Sending message to Gemini...');
  const result = await Promise.race([
    chat.sendMessage(userMessage),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`AI_CHAT_FAILED: Timed out after ${timeout}ms`)), timeout)
    ),
  ]);

  console.log('Gemini response received');
  const text = result.response?.text?.() || '';
  console.log('Response text length:', text.length);

  try {
    const parsed = JSON.parse(text);
    return validateChatResponse(parsed);
  } catch {
    // Extract JSON if wrapped
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return validateChatResponse(parsed);
    }
    throw new Error('AI_CHAT_FAILED: Invalid response format');
  }
}

/**
 * Generate streaming chat response
 */
export async function* generateChatResponseStream(
  userMessage,
  chatHistory,
  financialContext,
  personalityMode
) {
  if (!genAI) {
    throw new Error('AI_CHAT_FAILED: Gemini API key not configured');
  }

  const systemPrompt = buildSystemPrompt(personalityMode, financialContext);

  const conversationParts = chatHistory.slice(-8).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.message }],
  }));

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  });

  const chat = model.startChat({
    history: conversationParts,
  });

  const streamingPrompt = `${userMessage}

Please respond naturally first, then at the end provide a JSON block with this structure:
{"quickReplies": ["question1", "question2", "question3"], "riskLevel": "Low|Medium|High", "financialMood": "Stable|Improving|Risky|Declining"}`;

  const result = await chat.sendMessageStream(streamingPrompt);

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      yield { type: 'chunk', content: chunkText };
    }
  }

  yield { type: 'done' };
}

/**
 * Generate monthly summary
 */
export async function generateMonthlySummary(financialContext, previousMonthContext = null) {
  if (!genAI) {
    throw new Error('AI_SUMMARY_FAILED: Gemini API key not configured');
  }

  const prompt = `Generate a monthly financial summary for the user.

CURRENT MONTH DATA:
- Income: $${financialContext.income}
- Total Spent: $${financialContext.totalSpentThisMonth}
- Savings Rate: ${financialContext.savingsRate}%
- Health Score: ${financialContext.financialHealthScore}/100
- Emergency Fund: ${financialContext.emergencyFundMonths} months

TOP SPENDING CATEGORIES:
${financialContext.categoryBreakdown.slice(0, 5).map(c => `- ${c.category}: $${c.amount} (${c.percentage}%)`).join('\n')}

GOALS STATUS:
${financialContext.hasGoals 
  ? financialContext.goals.map(g => `- ${g.name}: ${g.onTrack ? 'On track' : 'Behind schedule'}`).join('\n')
  : 'No goals set'}

${previousMonthContext ? `
COMPARISON TO LAST MONTH:
- Last month spent: $${previousMonthContext.totalSpentThisMonth}
- Change: ${((financialContext.totalSpentThisMonth - previousMonthContext.totalSpentThisMonth) / previousMonthContext.totalSpentThisMonth * 100).toFixed(1)}%
` : ''}

Provide a comprehensive monthly summary with achievements, concerns, and goals for next month.`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: monthlySummarySchema,
      temperature: 0.3,
      maxOutputTokens: 800,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response?.text?.() || '';

  try {
    const parsed = JSON.parse(text);
    return validateMonthlySummary(parsed);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return validateMonthlySummary(JSON.parse(jsonMatch[0]));
    }
    throw new Error('AI_SUMMARY_FAILED: Invalid response format');
  }
}

/**
 * Validate and normalize chat response
 */
function validateChatResponse(data) {
  const validRiskLevels = ['Low', 'Medium', 'High'];
  const validMoods = ['Stable', 'Improving', 'Risky', 'Declining'];

  return {
    reply: String(data.reply || 'I apologize, but I couldn\'t generate a response. Please try again.'),
    insight: String(data.insight || ''),
    suggestions: Array.isArray(data.suggestions) ? data.suggestions.map(String).slice(0, 4) : [],
    riskLevel: validRiskLevels.includes(data.riskLevel) ? data.riskLevel : 'Medium',
    quickReplies: Array.isArray(data.quickReplies)
      ? data.quickReplies.map(String).slice(0, 5)
      : ['How am I doing?', 'Where can I save?', 'Review my goals'],
    financialMood: validMoods.includes(data.financialMood) ? data.financialMood : 'Stable',
    moodReason: String(data.moodReason || ''),
    topRiskFactors: Array.isArray(data.topRiskFactors) ? data.topRiskFactors.map(String).slice(0, 3) : [],
    actionPlan: Array.isArray(data.actionPlan) ? data.actionPlan.map(String).slice(0, 3) : [],
  };
}

/**
 * Validate monthly summary response
 */
function validateMonthlySummary(data) {
  const validRiskLevels = ['Low', 'Medium', 'High'];
  const validMoods = ['Stable', 'Improving', 'Risky', 'Declining'];

  return {
    headline: String(data.headline || 'Monthly Financial Summary'),
    overallAssessment: String(data.overallAssessment || 'Unable to generate assessment.'),
    achievements: Array.isArray(data.achievements) ? data.achievements.map(String).slice(0, 5) : [],
    concerns: Array.isArray(data.concerns) ? data.concerns.map(String).slice(0, 5) : [],
    nextMonthGoals: Array.isArray(data.nextMonthGoals) ? data.nextMonthGoals.map(String).slice(0, 4) : [],
    financialMood: validMoods.includes(data.financialMood) ? data.financialMood : 'Stable',
    riskLevel: validRiskLevels.includes(data.riskLevel) ? data.riskLevel : 'Medium',
  };
}

/**
 * Get fallback response for errors
 */
export function getFallbackResponse(error) {
  const isTimeout = error.message?.includes('Timed out');
  const isQuotaExceeded = error.message?.includes('429') || error.message?.includes('quota') || error.status === 429;
  const isApiError = error.message?.includes('API');

  let reply;
  if (isQuotaExceeded) {
    reply = 'I\'ve reached my daily limit for AI responses. This usually resets within a few minutes. In the meantime, you can still view your spending data and goals!';
  } else if (isTimeout) {
    reply = 'I\'m taking longer than usual to respond. Please try again in a moment.';
  } else if (isApiError) {
    reply = 'I\'m having trouble connecting to my thinking service. Please try again.';
  } else {
    reply = 'I encountered an issue processing your request. Please try again.';
  }

  return {
    reply,
    insight: '',
    suggestions: [],
    riskLevel: 'Medium',
    quickReplies: ['Try again', 'Check my spending', 'Review my goals'],
    financialMood: 'Stable',
    moodReason: '',
    topRiskFactors: [],
    actionPlan: [],
    isError: true,
    errorType: isQuotaExceeded ? 'quota_exceeded' : isTimeout ? 'timeout' : 'unknown',
  };
}

export default {
  generateChatResponse,
  generateChatResponseStream,
  generateMonthlySummary,
  getFallbackResponse,
};

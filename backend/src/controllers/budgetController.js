import firestoreService from '../services/firestoreService.js';
import financeService from '../services/financeService.js';
import spendingPersonalityService from '../services/spendingPersonalityService.js';
import { analyzeBudgetWithGemini, analyzeSpendingPersonality } from '../config/gemini.js';

// User profile
export async function getUserProfile(req, res) {
  try {
    const profile = await firestoreService.getUserProfile(req.user.uid);
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createOrUpdateUser(req, res) {
  try {
    const userData = {
      name: req.user.name || req.body.name || '',
      email: req.user.email || req.body.email || '',
      photoURL: req.user.picture || req.body.photoURL || '',
    };
    const profile = await firestoreService.createOrUpdateUser(req.user.uid, userData);
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Settings
export async function updateSettings(req, res) {
  try {
    // Support both body.settings and direct body properties
    const inputSettings = req.body.settings || req.body;
    const settings = {
      monthlyIncome: inputSettings.monthlyIncome,
      savingsTarget: inputSettings.savingsTarget,
    };
    const profile = await firestoreService.updateUserSettings(req.user.uid, settings);
    
    // Update monthly budget
    const monthId = financeService.getCurrentMonthId();
    await firestoreService.updateMonthlyBudget(req.user.uid, `${monthId}-01`);
    
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Expenses
export async function getExpenses(req, res) {
  try {
    const monthId = req.query.month || null;
    const expenses = await firestoreService.getExpenses(req.user.uid, monthId);
    res.json({ expenses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function addExpense(req, res) {
  try {
    const expenseData = {
      category: req.body.category,
      amount: req.body.amount,
      date: req.body.date || new Date().toISOString().slice(0, 10),
    };
    const result = await firestoreService.addExpense(req.user.uid, expenseData);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const result = await firestoreService.deleteExpense(req.user.uid, id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Expense not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

// Goals
export async function getGoals(req, res) {
  try {
    const goals = await firestoreService.getGoals(req.user.uid);
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function addGoal(req, res) {
  try {
    const goalData = {
      name: req.body.name,
      targetAmount: req.body.targetAmount,
      targetDate: req.body.targetDate,
    };
    const result = await firestoreService.addGoal(req.user.uid, goalData);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteGoal(req, res) {
  try {
    const { id } = req.params;
    const result = await firestoreService.deleteGoal(req.user.uid, id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Goal not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

// History
export async function getHistory(req, res) {
  try {
    const history = await firestoreService.getExpenseHistory(req.user.uid);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Budget
export async function getMonthlyBudget(req, res) {
  try {
    const monthId = req.query.month || financeService.getCurrentMonthId();
    const budget = await firestoreService.getMonthlyBudget(req.user.uid, monthId);
    res.json({ budget });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// AI Analysis
export async function analyzeFinances(req, res) {
  try {
    const monthId = req.body.month || financeService.getCurrentMonthId();
    
    // Get user data
    const profile = await firestoreService.getUserProfile(req.user.uid);
    const settings = profile?.settings || { monthlyIncome: 0, savingsTarget: 0 };
    
    // Get expenses and goals
    const expenses = await firestoreService.getExpenses(req.user.uid, monthId);
    const goals = await firestoreService.getGoals(req.user.uid);
    
    // Calculate structured data for AI
    const structuredData = financeService.getStructuredAnalysisData(settings, expenses, goals);
    
    // Get AI analysis
    const aiResponse = await analyzeBudgetWithGemini(structuredData);
    
    res.json({ aiResponse, stats: structuredData });
  } catch (error) {
    const message = error.message || 'Analysis failed';
    
    if (message.startsWith('AI_ANALYSIS_FAILED:')) {
      const cleanError = message.replace('AI_ANALYSIS_FAILED:', '').trim();
      const isTimeout = cleanError.toLowerCase().includes('timed out');
      return res.status(isTimeout ? 504 : 500).json({ error: cleanError });
    }
    
    res.status(500).json({ error: message });
  }
}

// AI Chat
export async function chat(req, res) {
  try {
    const { message, context } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const expenses = context?.expenses || [];
    const monthlyIncome = context?.monthlyIncome || 0;

    // Prepare chat prompt
    const chatPrompt = `You are a helpful financial assistant. Answer the user's question about their finances.

User's financial context:
- Monthly Income: $${monthlyIncome.toLocaleString()}
- Total Expenses: $${expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
- Number of transactions: ${expenses.length}

Recent expenses by category:
${Object.entries(
  expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {})
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`)
  .join('\n')}

User's question: ${message}

Provide a helpful, concise response focused on their finances. Be specific with numbers when relevant.`;

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(chatPrompt);
    const response = result.response.text();

    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
}

// Spending Personality Analysis
export async function getSpendingPersonality(req, res) {
  try {
    const uid = req.user.uid;
    
    // Get user profile and expenses
    const [profile, expenses] = await Promise.all([
      firestoreService.getUserProfile(uid),
      firestoreService.getExpenses(uid),
    ]);

    const settings = profile?.settings || {};
    const monthlyIncome = Number(settings.monthlyIncome) || 0;
    const savingsTarget = Number(settings.savingsTarget) || 0;

    if (!monthlyIncome || monthlyIncome <= 0) {
      return res.status(400).json({ 
        error: 'Monthly income not set. Please configure your financial settings first.' 
      });
    }

    if (!expenses || expenses.length < 5) {
      return res.status(400).json({ 
        error: 'Not enough expense data. Add at least 5 expenses for personality analysis.' 
      });
    }

    // Calculate metrics
    const metrics = spendingPersonalityService.calculatePersonalityMetrics(
      expenses, 
      monthlyIncome, 
      savingsTarget
    );

    if (!metrics) {
      return res.status(400).json({ error: 'Unable to calculate spending metrics' });
    }

    // Get heuristic classification
    const heuristicResult = spendingPersonalityService.classifyPersonalityHeuristic(metrics);

    // Build AI summary
    const aiSummary = spendingPersonalityService.buildAISummary(metrics, heuristicResult);

    // Get AI analysis with fallback
    let aiAnalysis;
    let isAIFallback = false;
    
    try {
      aiAnalysis = await analyzeSpendingPersonality(aiSummary);
    } catch (aiError) {
      console.error('AI personality analysis failed, using heuristic fallback:', aiError.message);
      isAIFallback = true;
      
      // Build fallback personality from heuristic
      const personalityDescriptions = {
        saver: {
          type: 'The Strategic Saver',
          emoji: '🏦',
          description: 'You excel at building financial security through disciplined saving.',
          strengths: ['Strong savings discipline', 'Long-term financial planning', 'Low financial stress'],
          improvements: ['Consider investing for growth', 'Balance saving with enjoyment'],
          tips: ['Your savings habits are excellent - consider diversifying investments', 'Allow yourself occasional treats to maintain balance'],
        },
        mindful: {
          type: 'The Mindful Spender',
          emoji: '⚖️',
          description: 'You maintain a healthy balance between saving and enjoying life.',
          strengths: ['Balanced financial approach', 'Thoughtful purchase decisions', 'Good budget awareness'],
          improvements: ['Track spending more consistently', 'Build emergency fund'],
          tips: ['Keep tracking your expenses to maintain awareness', 'Consider automating your savings'],
        },
        lifestyle: {
          type: 'The Lifestyle Optimizer',
          emoji: '✨',
          description: 'You prioritize experiences and quality of life in your spending.',
          strengths: ['Enjoys life fully', 'Values experiences', 'Flexible with money'],
          improvements: ['Increase savings rate', 'Build budget cushion'],
          tips: ['Try the 50/30/20 budgeting rule', 'Set up automatic savings transfers'],
        },
        spontaneous: {
          type: 'The Spontaneous Spender',
          emoji: '🎲',
          description: 'You prefer flexibility in your finances and make in-the-moment decisions.',
          strengths: ['Adaptable to changes', 'Enjoys spontaneity', 'Low financial anxiety'],
          improvements: ['Create spending limits', 'Track expenses regularly'],
          tips: ['Use a budgeting app to gain visibility', 'Set a weekly spending allowance'],
        },
      };
      
      const fallback = personalityDescriptions[heuristicResult.type] || personalityDescriptions.mindful;
      aiAnalysis = {
        ...fallback,
        confidence: heuristicResult.confidence,
      };
    }

    res.json({
      personality: aiAnalysis,
      metrics: {
        savingsRatePercent: metrics.savingsRatePercent,
        variableExpensePercent: metrics.variableExpensePercent,
        essentialPercent: metrics.essentialPercent,
        lifestylePercent: metrics.lifestylePercent,
        spendingVolatility: metrics.spendingVolatility,
        dailyConsistency: metrics.dailyConsistency,
        emergencyFundMonths: metrics.emergencyFundMonths,
        categoryBreakdown: metrics.categoryBreakdown.slice(0, 5),
      },
      heuristic: {
        type: heuristicResult.type,
        confidence: heuristicResult.confidence,
      },
      dataQuality: {
        expenseCount: metrics.expenseCount,
        hasEnoughData: metrics.expenseCount >= 10,
      },
      isAIFallback, // Flag to indicate if fallback was used
    });
  } catch (error) {
    console.error('Spending personality error:', error.message);
    res.status(500).json({ error: 'Failed to analyze spending personality' });
  }
}

export default {
  getUserProfile,
  createOrUpdateUser,
  updateSettings,
  getExpenses,
  addExpense,
  deleteExpense,
  getGoals,
  addGoal,
  deleteGoal,
  getHistory,
  getMonthlyBudget,
  analyzeFinances,
  chat,
  getSpendingPersonality,
};

// Monthly Summary Service
// Generates and caches monthly financial summaries

import { db } from '../config/firebaseAdmin.js';
import { aggregateFinancialContext } from './financialContextService.js';
import { generateMonthlySummary } from '../config/geminiChat.js';

const SUMMARIES_COLLECTION = 'monthlySummaries';

/**
 * Get or generate monthly summary for a user
 */
export async function getMonthlySummary(uid, forceRefresh = false) {
  if (!uid) throw new Error('User ID required');

  const currentMonth = getCurrentMonthKey();
  const cacheKey = `${uid}_${currentMonth}`;

  // Check cache if not forcing refresh
  if (!forceRefresh) {
    const cached = await getCachedSummary(uid, currentMonth);
    if (cached && !isSummaryStale(cached)) {
      return { summary: cached, fromCache: true };
    }
  }

  // Generate new summary
  const financialContext = await aggregateFinancialContext(uid);

  // Get previous month for comparison
  const previousContext = await getPreviousMonthContext(uid);

  const summary = await generateMonthlySummary(financialContext, previousContext);

  // Cache the summary
  await cacheSummary(uid, currentMonth, {
    ...summary,
    generatedAt: new Date().toISOString(),
    contextSnapshot: {
      income: financialContext.income,
      totalSpent: financialContext.totalSpentThisMonth,
      savingsRate: financialContext.savingsRate,
      healthScore: financialContext.financialHealthScore,
    },
  });

  return { summary, fromCache: false };
}

/**
 * Get cached summary
 */
async function getCachedSummary(uid, monthKey) {
  try {
    const docRef = db.collection(SUMMARIES_COLLECTION).doc(`${uid}_${monthKey}`);
    const doc = await docRef.get();

    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting cached summary:', error);
    return null;
  }
}

/**
 * Cache summary
 */
async function cacheSummary(uid, monthKey, summary) {
  try {
    const docRef = db.collection(SUMMARIES_COLLECTION).doc(`${uid}_${monthKey}`);
    await docRef.set({
      ...summary,
      uid,
      monthKey,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error caching summary:', error);
  }
}

/**
 * Check if summary is stale (older than 24 hours or significant changes)
 */
function isSummaryStale(summary) {
  if (!summary.generatedAt) return true;

  const generatedAt = new Date(summary.generatedAt);
  const now = new Date();
  const hoursSinceGenerated = (now - generatedAt) / (1000 * 60 * 60);

  // Refresh daily
  return hoursSinceGenerated > 24;
}

/**
 * Get current month key (YYYY-MM format)
 */
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get previous month key
 */
function getPreviousMonthKey() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get previous month's cached context for comparison
 */
async function getPreviousMonthContext(uid) {
  try {
    const previousMonthKey = getPreviousMonthKey();
    const cached = await getCachedSummary(uid, previousMonthKey);

    if (cached?.contextSnapshot) {
      return {
        income: cached.contextSnapshot.income,
        totalSpentThisMonth: cached.contextSnapshot.totalSpent,
        savingsRate: cached.contextSnapshot.savingsRate,
        financialHealthScore: cached.contextSnapshot.healthScore,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get all summaries for a user (for history view)
 */
export async function getSummaryHistory(uid, limit = 6) {
  try {
    const snapshot = await db
      .collection(SUMMARIES_COLLECTION)
      .where('uid', '==', uid)
      .orderBy('monthKey', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting summary history:', error);
    return [];
  }
}

/**
 * Schedule end-of-month summary generation
 * Call this from a cron job or scheduled task
 */
export async function generateEndOfMonthSummaries() {
  const now = new Date();
  const isLastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() === now.getDate();

  if (!isLastDayOfMonth) {
    console.log('Not last day of month, skipping summary generation');
    return { generated: 0 };
  }

  // Get all users with recent activity
  // In a real app, you'd want to batch this and use Cloud Functions
  console.log('Generating end-of-month summaries...');

  // This is a simplified version - in production, use Cloud Functions scheduler
  return { scheduled: true };
}

/**
 * Get financial insights based on summary
 */
export function getInsightsFromSummary(summary) {
  const insights = [];

  if (summary.riskLevel === 'High') {
    insights.push({
      type: 'warning',
      message: 'Your financial risk is elevated. Consider reviewing your spending.',
    });
  }

  if (summary.financialMood === 'Improving') {
    insights.push({
      type: 'success',
      message: 'Your financial health is improving. Keep up the good work!',
    });
  } else if (summary.financialMood === 'Declining') {
    insights.push({
      type: 'warning',
      message: 'Your financial health has been declining. Let\'s work on getting back on track.',
    });
  }

  if (summary.achievements?.length > 0) {
    insights.push({
      type: 'achievement',
      message: `This month\'s highlight: ${summary.achievements[0]}`,
    });
  }

  if (summary.concerns?.length > 0) {
    insights.push({
      type: 'concern',
      message: `Area to watch: ${summary.concerns[0]}`,
    });
  }

  return insights;
}

export default {
  getMonthlySummary,
  getSummaryHistory,
  generateEndOfMonthSummaries,
  getInsightsFromSummary,
};

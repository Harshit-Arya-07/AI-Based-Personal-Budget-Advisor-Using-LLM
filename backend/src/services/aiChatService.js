// AI Chat Service
// Handles chat memory, message storage, rate limiting, and monthly summaries

import { db } from '../config/firebaseAdmin.js';
import admin from 'firebase-admin';

const MAX_CHAT_HISTORY = 10;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const MONTHLY_SUMMARY_CACHE_HOURS = 24;

// In-memory rate limiting (production should use Redis)
const rateLimitMap = new Map();

/**
 * AI Personality Modes
 */
export const PERSONALITY_MODES = {
  strict: { id: 'strict', name: 'Strict', description: 'Direct and no-nonsense', icon: '📋' },
  friendly: { id: 'friendly', name: 'Friendly', description: 'Encouraging and supportive', icon: '😊' },
  analytical: { id: 'analytical', name: 'Analytical', description: 'Data-focused insights', icon: '📊' },
};

export const PERSONALITY_PROMPTS = {
  strict: `You are a strict financial advisor. Be direct, critical, and financially disciplined. 
Don't sugarcoat issues. Point out mistakes clearly. Focus on practical actions.
Use firm language like "You must", "This is unacceptable", "Immediately".`,

  friendly: `You are a supportive financial coach. Be encouraging and motivating.
Celebrate small wins. Offer gentle guidance. Focus on progress over perfection.
Use warm language like "Great job", "You're doing well", "Keep it up".`,

  analytical: `You are a data-driven financial analyst. Be precise and metric-focused.
Reference specific numbers. Use percentages and comparisons. Avoid emotional language.
Focus on trends, ratios, and projections. Be objective and thorough.`,
};

/**
 * Get user's AI personality mode
 */
export async function getUserPersonalityMode(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  const data = userDoc.data() || {};
  return data.settings?.aiPersonalityMode || 'friendly';
}

/**
 * Update user's AI personality mode
 */
export async function updateUserPersonalityMode(uid, mode) {
  if (!PERSONALITY_MODES[mode]) {
    throw new Error(`Invalid personality mode: ${mode}`);
  }

  await db.collection('users').doc(uid).set(
    { settings: { aiPersonalityMode: mode } },
    { merge: true }
  );

  return mode;
}

/**
 * Get chat history (last N messages)
 */
export async function getChatHistory(uid, limit = MAX_CHAT_HISTORY) {
  const chatsRef = db.collection('users').doc(uid).collection('aiChats');
  const snapshot = await chatsRef
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const messages = snapshot.docs.map(doc => ({
    id: doc.id,
    role: doc.data().role,
    message: doc.data().message,
    metadata: doc.data().metadata || {},
    timestamp: doc.data().timestamp?.toDate?.()?.toISOString?.() || null,
  }));

  // Return in chronological order
  return messages.reverse();
}

/**
 * Save a chat message
 */
export async function saveChatMessage(uid, role, message, metadata = {}) {
  const chatsRef = db.collection('users').doc(uid).collection('aiChats');

  const docRef = await chatsRef.add({
    role,
    message,
    metadata,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    id: docRef.id,
    role,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Clear all chat history for a user
 */
export async function clearChatHistory(uid) {
  const chatsRef = db.collection('users').doc(uid).collection('aiChats');
  const snapshot = await chatsRef.get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  return { cleared: snapshot.size };
}

/**
 * Rate limiting check
 */
export function checkRateLimit(uid) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(uid) || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - userLimit.windowStart > RATE_LIMIT_WINDOW_MS) {
    userLimit.count = 0;
    userLimit.windowStart = now;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterMs = Math.max(0, RATE_LIMIT_WINDOW_MS - (now - userLimit.windowStart));
    const waitTime = Math.ceil(retryAfterMs / 1000);
    return {
      allowed: false,
      retryAfter: retryAfterMs,
      retryAfterSeconds: waitTime,
      remaining: 0,
      message: `Rate limit exceeded. Please wait ${waitTime} seconds.`,
    };
  }

  // Increment counter
  userLimit.count++;
  rateLimitMap.set(uid, userLimit);

  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - userLimit.count),
  };
}

/**
 * Get or generate monthly summary
 */
export async function getOrGenerateMonthlySummary(uid, monthId, generateFn) {
  const summaryRef = db.collection('users').doc(uid).collection('monthlySummaries').doc(monthId);
  const doc = await summaryRef.get();

  if (doc.exists) {
    const data = doc.data();
    const generatedAt = data.generatedAt?.toDate?.();
    const hoursSinceGenerated = generatedAt
      ? (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60)
      : Infinity;

    // Return cached if still valid
    if (hoursSinceGenerated < MONTHLY_SUMMARY_CACHE_HOURS) {
      return {
        cached: true,
        summary: data.summary,
        generatedAt: generatedAt?.toISOString?.() || null,
      };
    }
  }

  // Generate new summary
  const summary = await generateFn();

  await summaryRef.set({
    monthId,
    summary,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    cached: false,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Check if user needs monthly summary (first login of new month)
 */
export async function checkMonthlySummaryNeeded(uid) {
  const currentMonthId = new Date().toISOString().slice(0, 7);
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) return false;

  const userData = userDoc.data();
  const lastSummaryMonth = userData.lastMonthlySummaryMonth;

  if (lastSummaryMonth !== currentMonthId) {
    // Mark as shown
    await userRef.set(
      { lastMonthlySummaryMonth: currentMonthId },
      { merge: true }
    );
    return true;
  }

  return false;
}

/**
 * Build conversation context for AI
 */
export function buildConversationContext(chatHistory) {
  return chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.message }],
  }));
}

export default {
  PERSONALITY_MODES,
  PERSONALITY_PROMPTS,
  getUserPersonalityMode,
  updateUserPersonalityMode,
  setUserPersonalityMode: updateUserPersonalityMode,
  getChatHistory,
  saveChatMessage,
  clearChatHistory,
  checkRateLimit,
  getOrGenerateMonthlySummary,
  checkMonthlySummaryNeeded,
  buildConversationContext,
};

// Named export alias for setUserPersonalityMode
export { updateUserPersonalityMode as setUserPersonalityMode };

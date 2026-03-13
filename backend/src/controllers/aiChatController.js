// AI Chat Controller
// Handles chat endpoints with memory, personality modes, and financial context

import { aggregateFinancialContext } from '../services/financialContextService.js';
import {
  getChatHistory,
  saveChatMessage,
  clearChatHistory,
  checkRateLimit,
  getUserPersonalityMode,
  setUserPersonalityMode,
  PERSONALITY_MODES,
} from '../services/aiChatService.js';
import {
  generateChatResponse,
  generateChatResponseStream,
  getFallbackResponse,
} from '../config/geminiChat.js';
import {
  getMonthlySummary,
  getSummaryHistory,
  getInsightsFromSummary,
} from '../services/monthlySummaryService.js';

/**
 * Send chat message - POST /api/budget/chat
 */
export async function sendChatMessage(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(uid);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
        message: `Too many requests. Please wait ${Math.ceil(rateLimitResult.retryAfter / 1000)} seconds.`,
      });
    }

    // Get user's personality mode
    const personalityMode = await getUserPersonalityMode(uid);
    console.log('Personality mode:', personalityMode);

    // Get chat history for context
    const chatHistory = await getChatHistory(uid, 10);
    console.log('Chat history length:', chatHistory.length);

    // Get financial context
    let financialContext;
    try {
      financialContext = await aggregateFinancialContext(uid);
      console.log('Financial context aggregated successfully');
    } catch (contextError) {
      console.error('Financial context error:', contextError);
      throw contextError;
    }

    // Save user message
    await saveChatMessage(uid, 'user', message.trim());

    // Generate AI response
    let aiResponse;
    try {
      aiResponse = await generateChatResponse(
        message.trim(),
        chatHistory,
        financialContext,
        personalityMode
      );
    } catch (aiError) {
      console.error('AI generation error:', aiError.message);
      console.error('Full error:', aiError);
      aiResponse = getFallbackResponse(aiError, financialContext, message.trim());
    }

    // Save AI response
    await saveChatMessage(uid, 'assistant', aiResponse.reply, {
      insight: aiResponse.insight,
      suggestions: aiResponse.suggestions,
      riskLevel: aiResponse.riskLevel,
      financialMood: aiResponse.financialMood,
      quickReplies: aiResponse.quickReplies,
    });

    // Return response with metadata
    res.json({
      success: true,
      response: aiResponse,
      personalityMode,
      remainingRequests: rateLimitResult.remaining,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      response: getFallbackResponse(error, null, req.body?.message || ''),
    });
  }
}

/**
 * Send chat message with streaming - POST /api/budget/chat/stream
 */
export async function sendChatMessageStream(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(uid);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    const personalityMode = await getUserPersonalityMode(uid);
    const chatHistory = await getChatHistory(uid, 10);
    const financialContext = await aggregateFinancialContext(uid);

    // Save user message
    await saveChatMessage(uid, 'user', message.trim());

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let fullResponse = '';

    try {
      const stream = generateChatResponseStream(
        message.trim(),
        chatHistory,
        financialContext,
        personalityMode
      );

      for await (const chunk of stream) {
        if (chunk.type === 'chunk') {
          fullResponse += chunk.content;
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        } else if (chunk.type === 'done') {
          // Try to extract metadata from response
          let metadata = {
            quickReplies: ['How am I doing?', 'Where can I save?', 'Review my goals'],
            riskLevel: 'Medium',
            financialMood: 'Stable',
          };

          const jsonMatch = fullResponse.match(/\{[^}]+\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              metadata = { ...metadata, ...parsed };
            } catch {
              // Keep defaults
            }
          }

          res.write(`data: ${JSON.stringify({ type: 'done', metadata })}\n\n`);

          // Save AI response
          await saveChatMessage(uid, 'assistant', fullResponse, metadata);
        }
      }
    } catch (streamError) {
      console.error('Stream error:', streamError);
      res.write(`data: ${JSON.stringify({ type: 'error', error: streamError.message })}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Stream chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream chat message' });
    }
  }
}

/**
 * Get chat history - GET /api/budget/chat/history
 */
export async function getChatHistoryEndpoint(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const history = await getChatHistory(uid, limit);

    res.json({
      success: true,
      messages: history,
      count: history.length,
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
}

/**
 * Clear chat history - DELETE /api/budget/chat/history
 */
export async function clearChatHistoryEndpoint(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await clearChatHistory(uid);

    res.json({
      success: true,
      message: 'Chat history cleared',
    });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
}

/**
 * Get personality mode - GET /api/budget/chat/personality
 */
export async function getPersonalityMode(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const mode = await getUserPersonalityMode(uid);

    res.json({
      success: true,
      personalityMode: mode,
      availableModes: Object.keys(PERSONALITY_MODES).map(key => ({
        id: key,
        ...PERSONALITY_MODES[key],
      })),
    });
  } catch (error) {
    console.error('Get personality mode error:', error);
    res.status(500).json({ error: 'Failed to get personality mode' });
  }
}

/**
 * Set personality mode - PUT /api/budget/chat/personality
 */
export async function setPersonalityModeEndpoint(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { mode } = req.body;
    if (!mode || !PERSONALITY_MODES[mode]) {
      return res.status(400).json({
        error: 'Invalid personality mode',
        validModes: Object.keys(PERSONALITY_MODES),
      });
    }

    await setUserPersonalityMode(uid, mode);

    res.json({
      success: true,
      personalityMode: mode,
      message: `Personality mode set to ${PERSONALITY_MODES[mode].name}`,
    });
  } catch (error) {
    console.error('Set personality mode error:', error);
    res.status(500).json({ error: 'Failed to set personality mode' });
  }
}

/**
 * Get quick suggestions based on context - GET /api/budget/chat/suggestions
 */
export async function getQuickSuggestions(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const financialContext = await aggregateFinancialContext(uid);

    // Generate contextual suggestions
    const suggestions = [];

    if (financialContext.isOverspending) {
      suggestions.push('Why am I overspending?');
      suggestions.push('How can I cut expenses?');
    }

    if (financialContext.financialHealthScore < 60) {
      suggestions.push('How do I improve my financial health?');
    }

    if (!financialContext.hasGoals) {
      suggestions.push('Help me set a savings goal');
    } else {
      const behindGoals = financialContext.goals.filter(g => !g.onTrack);
      if (behindGoals.length > 0) {
        suggestions.push(`How do I catch up on my ${behindGoals[0].name} goal?`);
      }
    }

    // Add default suggestions
    const defaultSuggestions = [
      'How am I doing this month?',
      'Where am I spending the most?',
      'What should I do differently?',
      'Show me my spending breakdown',
      'Am I on track for my goals?',
    ];

    // Fill in remaining spots
    while (suggestions.length < 5) {
      const suggestion = defaultSuggestions.shift();
      if (suggestion && !suggestions.includes(suggestion)) {
        suggestions.push(suggestion);
      } else if (!suggestion) {
        break;
      }
    }

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 5),
      context: {
        isOverspending: financialContext.isOverspending,
        healthScore: financialContext.financialHealthScore,
        hasGoals: financialContext.hasGoals,
      },
    });
  } catch (error) {
    console.error('Get quick suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
}

/**
 * Get monthly summary - GET /api/budget/chat/summary
 */
export async function getMonthlySummaryEndpoint(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const forceRefresh = req.query.refresh === 'true';
    const { summary, fromCache } = await getMonthlySummary(uid, forceRefresh);
    const insights = getInsightsFromSummary(summary);

    res.json({
      success: true,
      summary,
      insights,
      fromCache,
    });
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({ error: 'Failed to get monthly summary' });
  }
}

/**
 * Get summary history - GET /api/budget/chat/summary/history
 */
export async function getSummaryHistoryEndpoint(req, res) {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 6, 12);
    const history = await getSummaryHistory(uid, limit);

    res.json({
      success: true,
      summaries: history,
      count: history.length,
    });
  } catch (error) {
    console.error('Get summary history error:', error);
    res.status(500).json({ error: 'Failed to get summary history' });
  }
}

export default {
  sendChatMessage,
  sendChatMessageStream,
  getChatHistoryEndpoint,
  clearChatHistoryEndpoint,
  getPersonalityMode,
  setPersonalityModeEndpoint,
  getQuickSuggestions,
  getMonthlySummaryEndpoint,
  getSummaryHistoryEndpoint,
};

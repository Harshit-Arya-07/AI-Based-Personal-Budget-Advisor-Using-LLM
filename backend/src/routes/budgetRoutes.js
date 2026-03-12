import { Router } from 'express';
import requireAuth from '../middleware/authMiddleware.js';
import * as controller from '../controllers/budgetController.js';
import * as aiChatController from '../controllers/aiChatController.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// User routes
router.get('/users', controller.getUserProfile);
router.post('/users', controller.createOrUpdateUser);

// Profile routes (alias for frontend consistency)
router.get('/profile', controller.getUserProfile);
router.put('/profile', controller.updateSettings);

// Settings routes
router.post('/settings', controller.updateSettings);

// Expense routes
router.get('/expenses', controller.getExpenses);
router.post('/expenses', controller.addExpense);
router.delete('/expenses/:id', controller.deleteExpense);

// Goals routes
router.get('/goals', controller.getGoals);
router.post('/goals', controller.addGoal);
router.delete('/goals/:id', controller.deleteGoal);

// History routes
router.get('/history', controller.getHistory);

// Budget routes
router.get('/budgets', controller.getMonthlyBudget);

// AI Analysis routes
router.post('/analyze', controller.analyzeFinances);

// AI Chat routes (legacy - keep for backwards compatibility)
router.post('/chat', controller.chat);

// Enhanced AI Chat routes
router.post('/chat/send', aiChatController.sendChatMessage);
router.post('/chat/stream', aiChatController.sendChatMessageStream);
router.get('/chat/history', aiChatController.getChatHistoryEndpoint);
router.delete('/chat/history', aiChatController.clearChatHistoryEndpoint);
router.get('/chat/personality', aiChatController.getPersonalityMode);
router.put('/chat/personality', aiChatController.setPersonalityModeEndpoint);
router.get('/chat/suggestions', aiChatController.getQuickSuggestions);

// Monthly Summary routes
router.get('/chat/summary', aiChatController.getMonthlySummaryEndpoint);
router.get('/chat/summary/history', aiChatController.getSummaryHistoryEndpoint);

// Spending Personality routes
router.get('/personality', controller.getSpendingPersonality);

export default router;

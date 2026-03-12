import { Router } from 'express';
import requireAuth from '../middleware/authMiddleware.js';
import * as settingsController from '../controllers/settingsController.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get all settings
router.get('/', settingsController.getSettings);

// Update individual sections
router.put('/profile', settingsController.updateProfile);
router.put('/financial', settingsController.updateFinancial);
router.put('/ai', settingsController.updateAI);
router.put('/notifications', settingsController.updateNotifications);

// Data management
router.delete('/chat-history', settingsController.clearChatHistory);
router.get('/export', settingsController.exportData);
router.delete('/reset', settingsController.resetAllData);
router.delete('/account', settingsController.deleteAccount);

export default router;

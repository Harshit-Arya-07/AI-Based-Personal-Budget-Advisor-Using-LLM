import express from 'express';
import * as preferencesController from '../controllers/preferencesController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/user/preferences - Get user preferences
router.get('/', preferencesController.getPreferences);

// PUT /api/user/preferences - Update user preferences
router.put('/', preferencesController.updatePreferences);

// GET /api/user/preferences/currencies - Get supported currencies
router.get('/currencies', preferencesController.getSupportedCurrencies);

export default router;

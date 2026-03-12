import * as settingsService from '../services/settingsService.js';

/**
 * GET /api/settings
 * Get all user settings
 */
export async function getSettings(req, res) {
  try {
    const uid = req.user.uid;
    const settings = await settingsService.getCompleteSettings(uid);
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error.message);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

/**
 * PUT /api/settings/profile
 * Update profile settings
 */
export async function updateProfile(req, res) {
  try {
    const uid = req.user.uid;
    const { name, photoURL } = req.body;
    
    const settings = await settingsService.updateProfileSettings(uid, { name, photoURL });
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

/**
 * PUT /api/settings/financial
 * Update financial preferences
 */
export async function updateFinancial(req, res) {
  try {
    const uid = req.user.uid;
    const { monthlyIncome, savingsTarget, currency, monthStartDay } = req.body;

    // Validation
    if (monthlyIncome !== undefined && (isNaN(Number(monthlyIncome)) || Number(monthlyIncome) < 0)) {
      return res.status(400).json({ error: 'Invalid monthly income value' });
    }
    if (savingsTarget !== undefined && (isNaN(Number(savingsTarget)) || Number(savingsTarget) < 0)) {
      return res.status(400).json({ error: 'Invalid savings target value' });
    }
    if (monthStartDay !== undefined && (Number(monthStartDay) < 1 || Number(monthStartDay) > 28)) {
      return res.status(400).json({ error: 'Month start day must be between 1 and 28' });
    }

    const settings = await settingsService.updateFinancialSettings(uid, {
      monthlyIncome,
      savingsTarget,
      currency,
      monthStartDay,
    });
    
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Update financial error:', error.message);
    res.status(500).json({ error: 'Failed to update financial settings' });
  }
}

/**
 * PUT /api/settings/ai
 * Update AI assistant settings
 */
export async function updateAI(req, res) {
  try {
    const uid = req.user.uid;
    const { aiPersonality, enableMoodDetection, enableMonthlyReport, aiDetailLevel } = req.body;

    // Validation
    const validPersonalities = ['strict', 'friendly', 'analytical'];
    if (aiPersonality && !validPersonalities.includes(aiPersonality)) {
      return res.status(400).json({ error: 'Invalid AI personality mode' });
    }

    const validDetailLevels = ['short', 'medium', 'detailed'];
    if (aiDetailLevel && !validDetailLevels.includes(aiDetailLevel)) {
      return res.status(400).json({ error: 'Invalid AI detail level' });
    }

    const settings = await settingsService.updateAISettings(uid, {
      aiPersonality,
      enableMoodDetection,
      enableMonthlyReport,
      aiDetailLevel,
    });
    
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Update AI settings error:', error.message);
    res.status(500).json({ error: 'Failed to update AI settings' });
  }
}

/**
 * PUT /api/settings/notifications
 * Update notification settings
 */
export async function updateNotifications(req, res) {
  try {
    const uid = req.user.uid;
    const { spendingAlerts, goalAlerts, monthlyReminder } = req.body;

    const settings = await settingsService.updateNotificationSettings(uid, {
      spendingAlerts,
      goalAlerts,
      monthlyReminder,
    });
    
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Update notifications error:', error.message);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
}

/**
 * DELETE /api/settings/chat-history
 * Clear all chat history
 */
export async function clearChatHistory(req, res) {
  try {
    const uid = req.user.uid;
    const result = await settingsService.clearChatHistory(uid);
    res.json(result);
  } catch (error) {
    console.error('Clear chat history error:', error.message);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
}

/**
 * GET /api/settings/export
 * Export all user financial data
 */
export async function exportData(req, res) {
  try {
    const uid = req.user.uid;
    const data = await settingsService.exportUserData(uid);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="budgetai-export-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(data);
  } catch (error) {
    console.error('Export data error:', error.message);
    res.status(500).json({ error: 'Failed to export data' });
  }
}

/**
 * DELETE /api/settings/reset
 * Reset all user data
 */
export async function resetAllData(req, res) {
  try {
    const uid = req.user.uid;
    const { confirmReset } = req.body;

    if (confirmReset !== 'RESET_ALL_DATA') {
      return res.status(400).json({ 
        error: 'Please confirm by sending confirmReset: "RESET_ALL_DATA"' 
      });
    }

    const result = await settingsService.resetAllUserData(uid);
    res.json(result);
  } catch (error) {
    console.error('Reset data error:', error.message);
    res.status(500).json({ error: 'Failed to reset data' });
  }
}

/**
 * DELETE /api/settings/account
 * Delete user account
 */
export async function deleteAccount(req, res) {
  try {
    const uid = req.user.uid;
    const { confirmDelete } = req.body;

    if (confirmDelete !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({ 
        error: 'Please confirm by sending confirmDelete: "DELETE_MY_ACCOUNT"' 
      });
    }

    const result = await settingsService.deleteUserAccount(uid);
    res.json(result);
  } catch (error) {
    console.error('Delete account error:', error.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
}

export default {
  getSettings,
  updateProfile,
  updateFinancial,
  updateAI,
  updateNotifications,
  clearChatHistory,
  exportData,
  resetAllData,
  deleteAccount,
};

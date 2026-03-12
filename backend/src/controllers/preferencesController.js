import * as preferencesService from '../services/preferencesService.js';

/**
 * GET /api/user/preferences
 * Get current user preferences
 */
export async function getPreferences(req, res) {
  try {
    const uid = req.uid;
    const preferences = await preferencesService.getUserPreferences(uid);
    
    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences',
    });
  }
}

/**
 * PUT /api/user/preferences
 * Update user preferences
 */
export async function updatePreferences(req, res) {
  try {
    const uid = req.uid;
    const { preferredCurrency } = req.body;

    const result = await preferencesService.updateUserPreferences(uid, {
      preferredCurrency,
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: result.preferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    
    if (error.message.includes('Invalid currency')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
    });
  }
}

/**
 * GET /api/user/preferences/currencies
 * Get list of supported currencies
 */
export async function getSupportedCurrencies(req, res) {
  try {
    const currencies = preferencesService.getSupportedCurrencies();
    
    res.json({
      success: true,
      currencies,
    });
  } catch (error) {
    console.error('Error getting currencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch currencies',
    });
  }
}

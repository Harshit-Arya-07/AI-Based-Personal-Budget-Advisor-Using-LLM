import admin from 'firebase-admin';

const db = admin.firestore();

const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'];

/**
 * Get user preferences
 */
export async function getUserPreferences(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // Return defaults if user doc doesn't exist
      return {
        preferredCurrency: 'USD',
      };
    }

    const data = userDoc.data();
    return {
      preferredCurrency: data.preferredCurrency || 'USD',
    };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(uid, preferences) {
  try {
    const updates = {};

    // Validate and set currency
    if (preferences.preferredCurrency !== undefined) {
      if (!SUPPORTED_CURRENCIES.includes(preferences.preferredCurrency)) {
        throw new Error(`Invalid currency: ${preferences.preferredCurrency}. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`);
      }
      updates.preferredCurrency = preferences.preferredCurrency;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('No valid preferences to update');
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('users').doc(uid).set(updates, { merge: true });

    return {
      success: true,
      preferences: updates,
    };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

/**
 * Get supported currencies
 */
export function getSupportedCurrencies() {
  return SUPPORTED_CURRENCIES;
}

export { SUPPORTED_CURRENCIES };

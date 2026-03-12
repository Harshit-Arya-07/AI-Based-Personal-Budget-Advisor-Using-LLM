import { db } from '../config/firebaseAdmin.js';
import admin from 'firebase-admin';

// Default settings structure
const DEFAULT_USER_SETTINGS = {
  // Financial preferences
  monthlyIncome: 0,
  savingsTarget: 0,
  currency: 'USD',
  monthStartDay: 1,
};

const DEFAULT_APP_SETTINGS = {
  // AI Assistant settings
  aiPersonality: 'friendly', // 'strict', 'friendly', 'analytical'
  enableMoodDetection: true,
  enableMonthlyReport: true,
  aiDetailLevel: 'medium', // 'short', 'medium', 'detailed'
  
  // Notification settings
  spendingAlerts: true,
  goalAlerts: true,
  monthlyReminder: true,
};

/**
 * Get complete user settings including profile and app settings
 */
export async function getCompleteSettings(uid) {
  const [userDoc, settingsDoc] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('users').doc(uid).collection('settings').doc('preferences').get(),
  ]);

  const userData = userDoc.exists ? userDoc.data() : {};
  const appSettings = settingsDoc.exists ? settingsDoc.data() : {};

  return {
    profile: {
      name: userData.name || '',
      email: userData.email || '',
      photoURL: userData.photoURL || '',
      createdAt: userData.createdAt?.toDate?.()?.toISOString?.() || null,
    },
    financial: {
      monthlyIncome: Number(userData.settings?.monthlyIncome) || DEFAULT_USER_SETTINGS.monthlyIncome,
      savingsTarget: Number(userData.settings?.savingsTarget) || DEFAULT_USER_SETTINGS.savingsTarget,
      currency: userData.currency || DEFAULT_USER_SETTINGS.currency,
      monthStartDay: Number(userData.monthStartDay) || DEFAULT_USER_SETTINGS.monthStartDay,
    },
    ai: {
      aiPersonality: appSettings.aiPersonality || DEFAULT_APP_SETTINGS.aiPersonality,
      enableMoodDetection: appSettings.enableMoodDetection ?? DEFAULT_APP_SETTINGS.enableMoodDetection,
      enableMonthlyReport: appSettings.enableMonthlyReport ?? DEFAULT_APP_SETTINGS.enableMonthlyReport,
      aiDetailLevel: appSettings.aiDetailLevel || DEFAULT_APP_SETTINGS.aiDetailLevel,
    },
    notifications: {
      spendingAlerts: appSettings.spendingAlerts ?? DEFAULT_APP_SETTINGS.spendingAlerts,
      goalAlerts: appSettings.goalAlerts ?? DEFAULT_APP_SETTINGS.goalAlerts,
      monthlyReminder: appSettings.monthlyReminder ?? DEFAULT_APP_SETTINGS.monthlyReminder,
    },
  };
}

/**
 * Update profile settings
 */
export async function updateProfileSettings(uid, profileData) {
  const userRef = db.collection('users').doc(uid);
  
  const updateData = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (profileData.name !== undefined) {
    updateData.name = profileData.name;
  }
  if (profileData.photoURL !== undefined) {
    updateData.photoURL = profileData.photoURL;
  }

  await userRef.set(updateData, { merge: true });
  return getCompleteSettings(uid);
}

/**
 * Update financial preferences
 */
export async function updateFinancialSettings(uid, financialData) {
  const userRef = db.collection('users').doc(uid);
  
  const updateData = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (financialData.monthlyIncome !== undefined) {
    updateData['settings.monthlyIncome'] = Number(financialData.monthlyIncome) || 0;
  }
  if (financialData.savingsTarget !== undefined) {
    updateData['settings.savingsTarget'] = Number(financialData.savingsTarget) || 0;
  }
  if (financialData.currency !== undefined) {
    updateData.currency = financialData.currency;
  }
  if (financialData.monthStartDay !== undefined) {
    updateData.monthStartDay = Number(financialData.monthStartDay) || 1;
  }

  await userRef.set(updateData, { merge: true });
  
  // Update monthly budget if income/savings changed
  if (financialData.monthlyIncome !== undefined || financialData.savingsTarget !== undefined) {
    const now = new Date();
    const monthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    const profile = await userRef.get();
    const settings = profile.data()?.settings || {};
    
    const budgetRef = db.collection('users').doc(uid).collection('budgets').doc(monthId.slice(0, 7));
    await budgetRef.set({
      totalIncome: Number(settings.monthlyIncome) || 0,
      savingsTarget: Number(settings.savingsTarget) || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  return getCompleteSettings(uid);
}

/**
 * Update AI assistant settings
 */
export async function updateAISettings(uid, aiData) {
  const settingsRef = db.collection('users').doc(uid).collection('settings').doc('preferences');
  
  const updateData = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (aiData.aiPersonality !== undefined) {
    updateData.aiPersonality = aiData.aiPersonality;
  }
  if (aiData.enableMoodDetection !== undefined) {
    updateData.enableMoodDetection = Boolean(aiData.enableMoodDetection);
  }
  if (aiData.enableMonthlyReport !== undefined) {
    updateData.enableMonthlyReport = Boolean(aiData.enableMonthlyReport);
  }
  if (aiData.aiDetailLevel !== undefined) {
    updateData.aiDetailLevel = aiData.aiDetailLevel;
  }

  await settingsRef.set(updateData, { merge: true });
  return getCompleteSettings(uid);
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(uid, notificationData) {
  const settingsRef = db.collection('users').doc(uid).collection('settings').doc('preferences');
  
  const updateData = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (notificationData.spendingAlerts !== undefined) {
    updateData.spendingAlerts = Boolean(notificationData.spendingAlerts);
  }
  if (notificationData.goalAlerts !== undefined) {
    updateData.goalAlerts = Boolean(notificationData.goalAlerts);
  }
  if (notificationData.monthlyReminder !== undefined) {
    updateData.monthlyReminder = Boolean(notificationData.monthlyReminder);
  }

  await settingsRef.set(updateData, { merge: true });
  return getCompleteSettings(uid);
}

/**
 * Clear chat history for a user
 */
export async function clearChatHistory(uid) {
  const chatsRef = db.collection('users').doc(uid).collection('aiChats');
  const snapshot = await chatsRef.get();
  
  const batch = db.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    
    // Firestore batch limit is 500
    if (count >= 500) {
      await batch.commit();
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  
  return { success: true, deletedCount: snapshot.docs.length };
}

/**
 * Export all user financial data
 */
export async function exportUserData(uid) {
  const [userDoc, expenses, goals, budgets, settings, chatHistory] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('users').doc(uid).collection('expenses').get(),
    db.collection('users').doc(uid).collection('goals').get(),
    db.collection('users').doc(uid).collection('budgets').get(),
    db.collection('users').doc(uid).collection('settings').doc('preferences').get(),
    db.collection('users').doc(uid).collection('aiChats').orderBy('timestamp', 'desc').limit(100).get(),
  ]);

  const userData = userDoc.exists ? userDoc.data() : {};
  
  return {
    exportedAt: new Date().toISOString(),
    profile: {
      name: userData.name || '',
      email: userData.email || '',
      createdAt: userData.createdAt?.toDate?.()?.toISOString?.() || null,
    },
    settings: {
      financial: userData.settings || {},
      currency: userData.currency || 'USD',
      monthStartDay: userData.monthStartDay || 1,
      app: settings.exists ? settings.data() : {},
    },
    expenses: expenses.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString?.() || null,
    })),
    goals: goals.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
    })),
    budgets: budgets.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || null,
    })),
    chatHistory: chatHistory.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString?.() || null,
    })),
  };
}

/**
 * Reset all user data (dangerous operation)
 */
export async function resetAllUserData(uid) {
  const collections = ['expenses', 'goals', 'budgets', 'aiChats', 'monthlySummaries', 'settings'];
  
  for (const collectionName of collections) {
    const collRef = db.collection('users').doc(uid).collection(collectionName);
    const snapshot = await collRef.get();
    
    const batch = db.batch();
    let count = 0;
    
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      count++;
      
      if (count >= 500) {
        await batch.commit();
        count = 0;
      }
    }
    
    if (count > 0) {
      await batch.commit();
    }
  }

  // Reset user settings to defaults
  const userRef = db.collection('users').doc(uid);
  await userRef.set({
    settings: { monthlyIncome: 0, savingsTarget: 0 },
    currency: 'USD',
    monthStartDay: 1,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return { success: true, message: 'All data has been reset' };
}

/**
 * Delete user account completely
 */
export async function deleteUserAccount(uid) {
  // First reset all subcollection data
  await resetAllUserData(uid);
  
  // Then delete the user document
  await db.collection('users').doc(uid).delete();
  
  return { success: true, message: 'Account deleted successfully' };
}

export default {
  getCompleteSettings,
  updateProfileSettings,
  updateFinancialSettings,
  updateAISettings,
  updateNotificationSettings,
  clearChatHistory,
  exportUserData,
  resetAllUserData,
  deleteUserAccount,
};

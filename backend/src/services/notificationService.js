import { db } from '../config/firebaseAdmin.js';
import admin from 'firebase-admin';

// Notification types
export const NOTIFICATION_TYPES = {
  SPENDING_ALERT: 'spending_alert',
  GOAL_ALERT: 'goal_alert',
  MONTHLY_REPORT: 'monthly_report',
  SYSTEM: 'system',
};

/**
 * Create a new notification for a user
 */
export async function createNotification(uid, notification) {
  const notificationsRef = db.collection('users').doc(uid).collection('notifications');
  
  const data = {
    type: notification.type || NOTIFICATION_TYPES.SYSTEM,
    title: notification.title,
    message: notification.message,
    isRead: false,
    data: notification.data || null, // Additional data (e.g., amount, goalId)
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await notificationsRef.add(data);
  
  return {
    id: docRef.id,
    ...data,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(uid, options = {}) {
  const { limit = 50, unreadOnly = false } = options;
  
  let query = db
    .collection('users')
    .doc(uid)
    .collection('notifications')
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (unreadOnly) {
    query = query.where('isRead', '==', false);
  }

  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
  }));
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(uid) {
  const snapshot = await db
    .collection('users')
    .doc(uid)
    .collection('notifications')
    .where('isRead', '==', false)
    .count()
    .get();

  return snapshot.data().count;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(uid, notificationId) {
  const notificationRef = db
    .collection('users')
    .doc(uid)
    .collection('notifications')
    .doc(notificationId);

  await notificationRef.update({
    isRead: true,
    readAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(uid) {
  const snapshot = await db
    .collection('users')
    .doc(uid)
    .collection('notifications')
    .where('isRead', '==', false)
    .get();

  if (snapshot.empty) {
    return { success: true, count: 0 };
  }

  const batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    batch.update(doc.ref, {
      isRead: true,
      readAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    count++;

    // Commit in batches of 500
    if (count % 500 === 0) {
      await batch.commit();
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  return { success: true, count };
}

/**
 * Delete a notification
 */
export async function deleteNotification(uid, notificationId) {
  await db
    .collection('users')
    .doc(uid)
    .collection('notifications')
    .doc(notificationId)
    .delete();

  return { success: true };
}

/**
 * Clear all notifications older than a certain date
 */
export async function clearOldNotifications(uid, daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const snapshot = await db
    .collection('users')
    .doc(uid)
    .collection('notifications')
    .where('createdAt', '<', cutoffDate)
    .get();

  if (snapshot.empty) {
    return { success: true, count: 0 };
  }

  const batch = db.batch();
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();

  return { success: true, count: snapshot.docs.length };
}

// Helper functions to create specific notification types

/**
 * Create spending alert notification
 */
export async function createSpendingAlert(uid, { amount, category, percentOverBudget }) {
  return createNotification(uid, {
    type: NOTIFICATION_TYPES.SPENDING_ALERT,
    title: '⚠️ Spending Alert',
    message: `You've spent $${amount.toFixed(2)} on ${category}. You're ${percentOverBudget}% over your budget for this category.`,
    data: { amount, category, percentOverBudget },
  });
}

/**
 * Create goal milestone notification
 */
export async function createGoalAlert(uid, { goalName, milestone, progress }) {
  return createNotification(uid, {
    type: NOTIFICATION_TYPES.GOAL_ALERT,
    title: '🎯 Goal Milestone Reached!',
    message: `Congratulations! You've reached ${milestone}% of your "${goalName}" savings goal. Keep it up!`,
    data: { goalName, milestone, progress },
  });
}

/**
 * Create monthly report notification
 */
export async function createMonthlyReportAlert(uid, { month, totalSpent, totalSaved, savingsRate }) {
  return createNotification(uid, {
    type: NOTIFICATION_TYPES.MONTHLY_REPORT,
    title: '📊 Monthly Report Ready',
    message: `Your ${month} financial report is ready. You spent $${totalSpent.toFixed(2)} and saved $${totalSaved.toFixed(2)} (${savingsRate.toFixed(1)}% savings rate).`,
    data: { month, totalSpent, totalSaved, savingsRate },
  });
}

export default {
  NOTIFICATION_TYPES,
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearOldNotifications,
  createSpendingAlert,
  createGoalAlert,
  createMonthlyReportAlert,
};

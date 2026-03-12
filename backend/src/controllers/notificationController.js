import * as notificationService from '../services/notificationService.js';

/**
 * GET /api/notifications
 * Get all notifications for the user
 */
export async function getNotifications(req, res) {
  try {
    const uid = req.user.uid;
    const { limit, unreadOnly } = req.query;

    const notifications = await notificationService.getNotifications(uid, {
      limit: limit ? parseInt(limit) : 50,
      unreadOnly: unreadOnly === 'true',
    });

    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
export async function getUnreadCount(req, res) {
  try {
    const uid = req.user.uid;
    const count = await notificationService.getUnreadCount(uid);
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error.message);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
}

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
export async function markAsRead(req, res) {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    await notificationService.markAsRead(uid, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error.message);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
export async function markAllAsRead(req, res) {
  try {
    const uid = req.user.uid;
    const result = await notificationService.markAllAsRead(uid);
    res.json(result);
  } catch (error) {
    console.error('Mark all as read error:', error.message);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export async function deleteNotification(req, res) {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    await notificationService.deleteNotification(uid, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error.message);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
}

/**
 * POST /api/notifications/test
 * Create a test notification (for development)
 */
export async function createTestNotification(req, res) {
  try {
    const uid = req.user.uid;
    const { type } = req.body;

    let notification;
    
    switch (type) {
      case 'spending':
        notification = await notificationService.createSpendingAlert(uid, {
          amount: 150.00,
          category: 'Dining',
          percentOverBudget: 25,
        });
        break;
      case 'goal':
        notification = await notificationService.createGoalAlert(uid, {
          goalName: 'Emergency Fund',
          milestone: 50,
          progress: 2500,
        });
        break;
      case 'report':
        notification = await notificationService.createMonthlyReportAlert(uid, {
          month: 'February 2026',
          totalSpent: 3200.50,
          totalSaved: 1800.00,
          savingsRate: 36,
        });
        break;
      default:
        notification = await notificationService.createNotification(uid, {
          type: 'system',
          title: '🔔 Test Notification',
          message: 'This is a test notification to verify the system is working.',
        });
    }

    res.json({ notification });
  } catch (error) {
    console.error('Create test notification error:', error.message);
    res.status(500).json({ error: 'Failed to create notification' });
  }
}

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createTestNotification,
};

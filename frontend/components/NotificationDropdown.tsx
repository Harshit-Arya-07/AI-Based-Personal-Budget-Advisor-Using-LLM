'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, AlertTriangle, Target, FileText, Info, Trash2, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { authedPut, authedDelete, authedGet } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'spending_alert' | 'goal_alert' | 'monthly_report' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | null;
  data?: Record<string, any>;
}

const NOTIFICATION_ICONS = {
  spending_alert: { icon: AlertTriangle, color: 'text-[#DC3545]', bg: 'bg-[#DC3545]/10' },
  goal_alert: { icon: Target, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
  monthly_report: { icon: FileText, color: 'text-[#4F6EF7]', bg: 'bg-[#4F6EF7]/10' },
  system: { icon: Info, color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10' },
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return unsubscribe;
  }, []);

  // Real-time notifications listener
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(20));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Notification[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          type: doc.data().type || 'system',
          title: doc.data().title || '',
          message: doc.data().message || '',
          isRead: doc.data().isRead || false,
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
          data: doc.data().data || null,
        }));

        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.isRead).length);
        setIsLoading(false);
      },
      (error) => {
        console.error('Notifications listener error:', error);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await authedPut(`/api/notifications/${notificationId}/read`, {});
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await authedPut('/api/notifications/read-all', {});
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  }, []);

  const handleDelete = useCallback(async (notificationId: string) => {
    try {
      await authedDelete(`/api/notifications/${notificationId}`);
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  }, []);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl hover:bg-accent transition-colors relative"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#DC3545] flex items-center justify-center"
            >
              <span className="text-[10px] font-semibold text-white px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#4F6EF7]/10 text-[#4F6EF7] text-xs font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#4F6EF7] hover:text-[#3D5BD9] font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We&apos;ll notify you about important updates
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const IconConfig = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system;
                  const Icon = IconConfig.icon;

                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => {
                        if (!notification.isRead) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                      className={cn(
                        'px-4 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors hover:bg-accent/30',
                        !notification.isRead && 'bg-[#4F6EF7]/5'
                      )}
                    >
                      <div className="flex gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', IconConfig.bg)}>
                          <Icon className={cn('w-5 h-5', IconConfig.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-sm text-foreground line-clamp-1',
                              !notification.isRead && 'font-semibold'
                            )}>
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-[#4F6EF7]" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification.id);
                                }}
                                className="p-1 rounded-lg hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Trash2, MoreVertical, Clock } from 'lucide-react';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/currencyContext';
import type { ExpenseItem } from '@/lib/types';

interface RecentTransactionsProps {
  expenses: ExpenseItem[];
  isLoading: boolean;
  onViewAll?: () => void;
}

const categoryConfig: Record<string, { emoji: string; color: string }> = {
  housing: { emoji: '🏠', color: '#4F6EF7' },
  transportation: { emoji: '🚗', color: '#10B981' },
  food: { emoji: '🍔', color: '#F59E0B' },
  utilities: { emoji: '💡', color: '#8B5CF6' },
  healthcare: { emoji: '🏥', color: '#DC3545' },
  entertainment: { emoji: '🎬', color: '#EC4899' },
  shopping: { emoji: '🛍️', color: '#06B6D4' },
  personal: { emoji: '💅', color: '#F97316' },
  education: { emoji: '📚', color: '#6366F1' },
  savings: { emoji: '💰', color: '#10B981' },
  investments: { emoji: '📈', color: '#22C55E' },
  other: { emoji: '📦', color: '#64748B' },
};

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecentTransactions({ expenses, isLoading, onViewAll }: RecentTransactionsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  const recentExpenses = expenses.slice(0, 5);

  const handleDelete = async (expenseId: string) => {
    setDeletingId(expenseId);
    setMenuOpenId(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await getIdToken(user);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budget/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Expense deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-2xl border border-border p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F6EF7]/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#4F6EF7]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Recent Transactions</h3>
            <p className="text-xs text-muted-foreground">{expenses.length} total</p>
          </div>
        </div>

        {onViewAll && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-[#4F6EF7] font-medium hover:underline"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
              <div className="h-4 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && recentExpenses.length === 0 && (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No transactions yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first expense to get started</p>
        </div>
      )}

      {/* Transactions list */}
      {!isLoading && recentExpenses.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {recentExpenses.map((expense, index) => {
              const config = categoryConfig[expense.category.toLowerCase()] || categoryConfig.other;
              const isDeleting = deletingId === expense.id;
              const isMenuOpen = menuOpenId === expense.id;

              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isDeleting ? 0.5 : 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    <span className="text-lg">{config.emoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground capitalize truncate">{expense.category}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(expense.date)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      -{formatCurrency(expense.amount)}
                    </span>

                    {/* Menu button */}
                    <div className="relative">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMenuOpenId(isMenuOpen ? null : expense.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </motion.button>

                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -5 }}
                            className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20"
                          >
                            <button
                              onClick={() => handleDelete(expense.id)}
                              disabled={isDeleting}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#DC3545] hover:bg-[#DC3545]/10 transition-colors w-full"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* View all on mobile */}
      {!isLoading && expenses.length > 5 && onViewAll && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onViewAll}
          className="w-full mt-4 py-3 rounded-xl border border-border text-sm font-medium text-[#4F6EF7] hover:bg-accent/50 transition-colors"
        >
          View {expenses.length - 5} more transactions
        </motion.button>
      )}
    </motion.div>
  );
}

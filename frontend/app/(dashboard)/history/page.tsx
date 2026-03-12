'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter, Search, Trash2, MoreVertical, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { useDashboard } from '@/lib/dashboardContext';
import type { ExpenseItem } from '@/lib/types';

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

const categories = ['All', 'Housing', 'Transportation', 'Food', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Personal', 'Education', 'Savings', 'Investments', 'Other'];

export default function HistoryPage() {
  const { allExpenses, isLoadingRealtime } = useDashboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const itemsPerPage = 20;

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((expense) => {
      const matchesSearch = searchQuery === '' || 
        expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.date.includes(searchQuery);
      const matchesCategory = selectedCategory === 'All' || 
        expense.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [allExpenses, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = async (expenseId: string) => {
    setDeletingId(expenseId);
    setMenuOpenId(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await getIdToken(user);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budget/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Expense deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Amount'];
    const rows = filteredExpenses.map(e => [e.date, e.category, e.amount.toFixed(2)]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4F6EF7]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#4F6EF7]" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Transaction History</h2>
                <p className="text-xs text-muted-foreground">
                  {filteredExpenses.length} transactions • ${totalAmount.toLocaleString()} total
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </motion.button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-3 mt-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-accent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]"
              />
            </div>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="h-10 px-4 rounded-xl bg-accent border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading state */}
        {isLoadingRealtime && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-accent border-t-[#4F6EF7] animate-spin mx-auto" />
          </div>
        )}

        {/* Empty state */}
        {!isLoadingRealtime && paginatedExpenses.length === 0 && (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}

        {/* Transactions list */}
        {!isLoadingRealtime && paginatedExpenses.length > 0 && (
          <div className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {paginatedExpenses.map((expense, index) => {
                const config = categoryConfig[expense.category.toLowerCase()] || categoryConfig.other;
                const isDeleting = deletingId === expense.id;
                const isMenuOpen = menuOpenId === expense.id;

                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isDeleting ? 0.5 : 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${config.color}15` }}
                    >
                      <span className="text-lg">{config.emoji}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground capitalize">{expense.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">
                        -${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>

                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenId(isMenuOpen ? null : expense.id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>

                        <AnimatePresence>
                          {isMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10"
                            >
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#DC3545] hover:bg-[#DC3545]/10 w-full"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

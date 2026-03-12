'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useDashboard } from '@/lib/dashboardContext';
import ExpenseTracker from '@/components/ExpenseTracker';
import RecentTransactions from '@/components/RecentTransactions';
import CategoryTrendWarnings from '@/components/CategoryTrendWarnings';

export default function ExpensesPage() {
  const { allExpenses, settings, isLoadingRealtime, currentMonthId, setActiveTab } = useDashboard();

  const currentMonthExpenses = useMemo(() => {
    return allExpenses.filter((e) => e.date.startsWith(currentMonthId));
  }, [allExpenses, currentMonthId]);

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = settings.monthlyIncome - totalSpent;
  const percentUsed = settings.monthlyIncome > 0 ? (totalSpent / settings.monthlyIncome) * 100 : 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#4F6EF7]/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#4F6EF7]" />
                </div>
                <span className="text-sm text-muted-foreground">Budget</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${settings.monthlyIncome.toLocaleString()}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl border border-border p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#DC3545]/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-[#DC3545]" />
                </div>
                <span className="text-sm text-muted-foreground">Spent</span>
              </div>
              <p className="text-2xl font-bold text-[#DC3545]">
                ${totalSpent.toLocaleString()}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl border border-border p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#10B981]" />
                </div>
                <span className="text-sm text-muted-foreground">Remaining</span>
              </div>
              <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-[#10B981]' : 'text-[#DC3545]'}`}>
                ${Math.abs(remaining).toLocaleString()}
              </p>
            </motion.div>
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {percentUsed.toFixed(0)}% used
              </span>
            </div>
            <div className="h-4 bg-accent rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, percentUsed)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  percentUsed > 90
                    ? 'bg-[#DC3545]'
                    : percentUsed > 70
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#10B981]'
                }`}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ${totalSpent.toLocaleString()} of ${settings.monthlyIncome.toLocaleString()} budget
            </p>
          </motion.div>

          {/* Recent transactions */}
          <RecentTransactions
            expenses={currentMonthExpenses}
            isLoading={isLoadingRealtime}
            onViewAll={() => setActiveTab('history')}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Category alerts */}
          <CategoryTrendWarnings
            expenses={allExpenses}
            isLoading={isLoadingRealtime}
          />
        </div>
      </div>

      {/* Floating expense tracker */}
      <ExpenseTracker />
    </div>
  );
}

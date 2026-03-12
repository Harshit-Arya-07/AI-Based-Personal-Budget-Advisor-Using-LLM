'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useCurrency } from '@/lib/currencyContext';
import type { MonthlyBudget, UserSettings } from '@/lib/types';

interface BalanceCardProps {
  isLoading: boolean;
  settings: UserSettings;
  monthlyBudget: MonthlyBudget | null;
}

export default function BalanceCard({ isLoading, settings, monthlyBudget }: BalanceCardProps) {
  const { formatCurrency } = useCurrency();
  const income = settings.monthlyIncome || 0;
  const expenses = monthlyBudget?.totalExpense || 0;
  const balance = income - expenses;
  const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : '0.0';
  const isPositive = balance >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, #0B1A3E 0%, #1a2f5a 50%, #4F6EF7 100%)',
      }}
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">Current Balance</p>
              <p className="text-white/50 text-xs">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
              isPositive ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#DC3545]/20 text-[#DC3545]'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {savingsRate}% saved
          </motion.div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 w-48 bg-white/10 animate-pulse rounded-lg" />
            <div className="h-4 w-32 bg-white/10 animate-pulse rounded" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className={`text-4xl font-bold tracking-tight ${isPositive ? 'text-white' : 'text-[#DC3545]'}`}>
              {formatCurrency(balance)}
            </h2>
            <p className="text-white/50 text-sm mt-1">Available to spend</p>
          </motion.div>
        )}

        {/* Income/Expense breakdown */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
            </div>
            <div>
              <p className="text-white/50 text-xs">Income</p>
              <p className="text-white font-semibold">{formatCurrency(income)}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-[#DC3545]/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-[#DC3545]" />
            </div>
            <div>
              <p className="text-white/50 text-xs">Expenses</p>
              <p className="text-white font-semibold">{formatCurrency(expenses)}</p>
            </div>
          </motion.div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-white/50 mb-2">
            <span>Spending Progress</span>
            <span>{income > 0 ? ((expenses / income) * 100).toFixed(0) : 0}% of income</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, income > 0 ? (expenses / income) * 100 : 0)}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                expenses / income > 0.9
                  ? 'bg-[#DC3545]'
                  : expenses / income > 0.7
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#10B981]'
              }`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

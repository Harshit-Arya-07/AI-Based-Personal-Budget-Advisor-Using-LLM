'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import BalanceCard from '@/components/BalanceCard';
import AIInsights from '@/components/AIInsights';
import Analytics from '@/components/Analytics';
import ExpenseTracker from '@/components/ExpenseTracker';
import RecentTransactions from '@/components/RecentTransactions';
import FinancialHealthScore from '@/components/FinancialHealthScore';
import BurnRateProjection from '@/components/BurnRateProjection';
import CategoryTrendWarnings from '@/components/CategoryTrendWarnings';
import SavingsGoals from '@/components/SavingsGoals';
import WhatIfSimulator from '@/components/WhatIfSimulator';
import FinancialSettings from '@/components/FinancialSettings';
import SpendingPersonality from '@/components/SpendingPersonality';
import type { ExpenseItem, MonthlyBudget, SavingsGoal, UserSettings } from '@/lib/types';

interface DashboardContentProps {
  settings: UserSettings;
  allExpenses: ExpenseItem[];
  goals: SavingsGoal[];
  monthlyBudget: MonthlyBudget | null;
  isLoadingRealtime: boolean;
  dashboardError: string | null;
  currentMonthId: string;
  todayDate: string;
  onViewHistory?: () => void;
}

export default function DashboardContent({
  settings,
  allExpenses,
  goals,
  monthlyBudget,
  isLoadingRealtime,
  dashboardError,
  currentMonthId,
  todayDate,
  onViewHistory,
}: DashboardContentProps) {
  // Filter expenses for current month
  const currentMonthExpenses = useMemo(() => {
    return allExpenses.filter((e) => e.date.startsWith(currentMonthId));
  }, [allExpenses, currentMonthId]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
      {/* Error banner */}
      {dashboardError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/20 text-[#DC3545] text-sm"
        >
          {dashboardError}
        </motion.div>
      )}

      {/* Main grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Card */}
          <BalanceCard
            isLoading={isLoadingRealtime}
            settings={settings}
            monthlyBudget={monthlyBudget}
          />

          {/* Financial Health & Burn Rate row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FinancialHealthScore
              settings={settings}
              expenses={currentMonthExpenses}
              isLoading={isLoadingRealtime}
            />
            <BurnRateProjection
              settings={settings}
              expenses={currentMonthExpenses}
              isLoading={isLoadingRealtime}
            />
          </div>

          {/* Analytics */}
          <Analytics
            expenses={allExpenses}
            monthlyIncome={settings.monthlyIncome}
            isLoading={isLoadingRealtime}
          />

          {/* What-If Simulator */}
          <WhatIfSimulator
            expenses={currentMonthExpenses}
            goals={goals}
            settings={settings}
            isLoading={isLoadingRealtime}
          />
        </div>

        {/* Right column - Sidebar content */}
        <div className="space-y-6">
          {/* Financial Settings */}
          <FinancialSettings
            settings={settings}
            isLoading={isLoadingRealtime}
          />

          {/* Spending Personality */}
          <SpendingPersonality
            isLoadingExpenses={isLoadingRealtime}
          />

          {/* AI Insights */}
          <AIInsights
            expenses={currentMonthExpenses}
            monthlyIncome={settings.monthlyIncome}
            isLoadingExpenses={isLoadingRealtime}
          />

          {/* Category Trend Warnings */}
          <CategoryTrendWarnings
            expenses={allExpenses}
            isLoading={isLoadingRealtime}
          />

          {/* Savings Goals */}
          <SavingsGoals
            goals={goals}
            expenses={currentMonthExpenses}
            settings={settings}
            isLoading={isLoadingRealtime}
          />

          {/* Recent Transactions */}
          <RecentTransactions
            expenses={allExpenses}
            isLoading={isLoadingRealtime}
            onViewAll={onViewHistory}
          />
        </div>
      </div>

      {/* Floating expense tracker button */}
      <ExpenseTracker />
    </div>
  );
}

'use client';

import { createContext, useContext } from 'react';
import type { ExpenseItem, MonthlyBudget, SavingsGoal, UserSettings } from '@/lib/types';

export interface DashboardContextValue {
  settings: UserSettings;
  allExpenses: ExpenseItem[];
  goals: SavingsGoal[];
  monthlyBudget: MonthlyBudget | null;
  isLoadingRealtime: boolean;
  dashboardError: string | null;
  currentMonthId: string;
  todayDate: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => Promise<void>;
}

const defaultValue: DashboardContextValue = {
  settings: { monthlyIncome: 0, savingsTarget: 0 },
  allExpenses: [],
  goals: [],
  monthlyBudget: null,
  isLoadingRealtime: true,
  dashboardError: null,
  currentMonthId: new Date().toISOString().slice(0, 7),
  todayDate: new Date().toISOString().slice(0, 10),
  setActiveTab: () => {},
  handleLogout: async () => {},
};

export const DashboardContext = createContext<DashboardContextValue>(defaultValue);

export function useDashboardContext() {
  return useContext(DashboardContext);
}

// Alias for useDashboard used in older components
export function useDashboard() {
  return useContext(DashboardContext);
}

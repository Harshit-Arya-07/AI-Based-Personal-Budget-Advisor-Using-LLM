'use client';

import { useDashboard } from '@/lib/dashboardContext';
import DashboardContent from '@/components/DashboardContent';

export default function DashboardPage() {
  const {
    settings,
    allExpenses,
    goals,
    monthlyBudget,
    isLoadingRealtime,
    dashboardError,
    currentMonthId,
    todayDate,
    setActiveTab,
  } = useDashboard();

  return (
    <DashboardContent
      settings={settings}
      allExpenses={allExpenses}
      goals={goals}
      monthlyBudget={monthlyBudget}
      isLoadingRealtime={isLoadingRealtime}
      dashboardError={dashboardError}
      currentMonthId={currentMonthId}
      todayDate={todayDate}
      onViewHistory={() => setActiveTab('history')}
    />
  );
}

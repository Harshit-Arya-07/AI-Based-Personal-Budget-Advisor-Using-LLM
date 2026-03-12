'use client';

import { useDashboard } from '@/lib/dashboardContext';
import Analytics from '@/components/Analytics';

export default function AnalyticsPage() {
  const { allExpenses, settings, isLoadingRealtime } = useDashboard();

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-6">
      <Analytics
        expenses={allExpenses}
        monthlyIncome={settings.monthlyIncome}
        isLoading={isLoadingRealtime}
      />
    </div>
  );
}

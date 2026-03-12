'use client';

import { useDashboard } from '@/lib/dashboardContext';
import AIChat from '@/components/AIChat';

export default function AIChatPage() {
  const { allExpenses, settings } = useDashboard();

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6">
      <AIChat expenses={allExpenses} monthlyIncome={settings.monthlyIncome} />
    </div>
  );
}

'use client';

import { useDashboard } from '@/lib/dashboardContext';
import SettingsPage from '@/components/SettingsPage';

export default function Settings() {
  const { handleLogout } = useDashboard();

  return <SettingsPage onLogout={handleLogout} />;
}

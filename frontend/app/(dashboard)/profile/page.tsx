'use client';

import { useDashboard } from '@/lib/dashboardContext';
import Profile from '@/components/Profile';

export default function ProfilePage() {
  const { handleLogout } = useDashboard();

  return (
    <div className="px-4 lg:px-8 py-6">
      <Profile onLogout={handleLogout} />
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { LogOut, Shield, Bell } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import UserProfileCard from '@/components/UserProfileCard';
import ThemeToggle from '@/components/ThemeToggle';
import { Card, SectionHeader, ToggleRow, Button } from '@/components/ui/shared';
import { authedPut } from '@/lib/api';

interface ProfileProps {
  onLogout: () => void;
}

export default function Profile({ onLogout }: ProfileProps) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      toast.error('Failed to sign out');
    }
  };

  const handleSaveProfile = async (data: { name: string; photoURL: string }) => {
    try {
      await authedPut('/api/settings/profile', data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Profile Card */}
      <UserProfileCard
        mode="view"
        onSave={handleSaveProfile}
        showBadge={true}
      />

      {/* Preferences */}
      <Card>
        <SectionHeader
          icon={<Bell className="w-5 h-5 text-[#8B5CF6]" />}
          iconBg="bg-[#8B5CF6]/10"
          title="Preferences"
          description="Customize your experience"
        />

        <div className="space-y-4">
          {/* Theme toggle */}
          <ThemeToggle variant="switch" showLabel={true} />

          {/* Notifications */}
          <ToggleRow
            icon={<Bell className="w-5 h-5 text-[#10B981]" />}
            title="Push Notifications"
            description="Get spending alerts"
            checked={true}
            onChange={() => {}}
          />
        </div>
      </Card>

      {/* Security */}
      <Card>
        <SectionHeader
          icon={<Shield className="w-5 h-5 text-[#10B981]" />}
          iconBg="bg-[#10B981]/10"
          title="Security"
          description="Manage your account security"
        />

        <div className="p-4 rounded-xl bg-[#10B981]/5 border border-[#10B981]/20 mb-4">
          <div className="flex items-center gap-2 text-[#10B981] text-sm">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Google Authentication Active</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your account is secured with Google Sign-In
          </p>
        </div>

        <Button
          variant="danger"
          fullWidth
          onClick={handleLogout}
          icon={<LogOut className="w-5 h-5" />}
        >
          Sign Out
        </Button>
      </Card>

      {/* App info */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">BudgetAI v2.0</p>
        <p className="text-xs text-muted-foreground mt-1">Powered by Firebase & Gemini AI</p>
      </div>
    </motion.div>
  );
}

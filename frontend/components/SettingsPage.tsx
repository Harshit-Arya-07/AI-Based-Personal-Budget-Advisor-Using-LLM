'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Camera,
  DollarSign,
  Target,
  Calendar,
  Brain,
  Sparkles,
  FileText,
  Bell,
  AlertTriangle,
  TrendingUp,
  CalendarDays,
  Shield,
  LogOut,
  Trash2,
  Download,
  MessageSquare,
  RefreshCw,
  Save,
  Loader2,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { authedGet, authedPut, authedDelete } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import { Palette } from 'lucide-react';
import { SUPPORTED_CURRENCIES, getCurrencyOptions } from '@/lib/currency';

// Types
interface Settings {
  profile: {
    name: string;
    email: string;
    photoURL: string;
    createdAt: string | null;
  };
  financial: {
    monthlyIncome: number;
    savingsTarget: number;
    currency: string;
    monthStartDay: number;
  };
  ai: {
    aiPersonality: 'strict' | 'friendly' | 'analytical';
    enableMoodDetection: boolean;
    enableMonthlyReport: boolean;
    aiDetailLevel: 'short' | 'medium' | 'detailed';
  };
  notifications: {
    spendingAlerts: boolean;
    goalAlerts: boolean;
    monthlyReminder: boolean;
  };
}

const defaultSettings: Settings = {
  profile: { name: '', email: '', photoURL: '', createdAt: null },
  financial: { monthlyIncome: 0, savingsTarget: 0, currency: 'USD', monthStartDay: 1 },
  ai: { aiPersonality: 'friendly', enableMoodDetection: true, enableMonthlyReport: true, aiDetailLevel: 'medium' },
  notifications: { spendingAlerts: true, goalAlerts: true, monthlyReminder: true },
};

// AI Personality options
const aiPersonalities = [
  { id: 'strict', name: 'Strict Advisor', icon: '📊', description: 'Direct, no-nonsense financial guidance' },
  { id: 'friendly', name: 'Friendly Coach', icon: '🤝', description: 'Supportive and encouraging approach' },
  { id: 'analytical', name: 'Analytical Expert', icon: '🔬', description: 'Data-driven insights and analysis' },
];

// Detail level options
const detailLevels = [
  { id: 'short', name: 'Short', description: 'Brief, concise responses' },
  { id: 'medium', name: 'Medium', description: 'Balanced detail level' },
  { id: 'detailed', name: 'Detailed', description: 'Comprehensive explanations' },
];

interface SettingsPageProps {
  onLogout: () => void;
}

export default function SettingsPage({ onLogout }: SettingsPageProps) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Local form states
  const [profileForm, setProfileForm] = useState({ name: '', photoURL: '' });
  const [financialForm, setFinancialForm] = useState({
    monthlyIncome: '',
    savingsTarget: '',
    currency: 'USD',
    monthStartDay: '1',
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await authedGet('/api/settings');
      setSettings(data);
      
      // Populate form states
      setProfileForm({
        name: data.profile.name || '',
        photoURL: data.profile.photoURL || '',
      });
      setFinancialForm({
        monthlyIncome: data.financial.monthlyIncome?.toString() || '',
        savingsTarget: data.financial.savingsTarget?.toString() || '',
        currency: data.financial.currency || 'USD',
        monthStartDay: data.financial.monthStartDay?.toString() || '1',
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Save profile settings
  const handleSaveProfile = async () => {
    setSavingSection('profile');
    try {
      const result = await authedPut('/api/settings/profile', profileForm);
      setSettings(result.settings);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSavingSection(null);
    }
  };

  // Save financial settings
  const handleSaveFinancial = async () => {
    setSavingSection('financial');
    try {
      const result = await authedPut('/api/settings/financial', {
        monthlyIncome: parseFloat(financialForm.monthlyIncome) || 0,
        savingsTarget: parseFloat(financialForm.savingsTarget) || 0,
        currency: financialForm.currency,
        monthStartDay: parseInt(financialForm.monthStartDay) || 1,
      });
      setSettings(result.settings);
      toast.success('Financial settings updated');
    } catch (error) {
      toast.error('Failed to update financial settings');
    } finally {
      setSavingSection(null);
    }
  };

  // Save AI settings
  const handleSaveAI = async (key: string, value: any) => {
    setSavingSection('ai');
    try {
      const result = await authedPut('/api/settings/ai', { [key]: value });
      setSettings(result.settings);
      toast.success('AI settings updated');
    } catch (error) {
      toast.error('Failed to update AI settings');
    } finally {
      setSavingSection(null);
    }
  };

  // Save notification settings
  const handleSaveNotification = async (key: string, value: boolean) => {
    setSavingSection('notifications');
    try {
      const result = await authedPut('/api/settings/notifications', { [key]: value });
      setSettings(result.settings);
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setSavingSection(null);
    }
  };

  // Clear chat history
  const handleClearChatHistory = async () => {
    try {
      await authedDelete('/api/settings/chat-history');
      toast.success('Chat history cleared');
    } catch (error) {
      toast.error('Failed to clear chat history');
    }
  };

  // Export data
  const handleExportData = async () => {
    try {
      const data = await authedGet('/api/settings/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budgetai-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  // Reset all data
  const handleResetData = async () => {
    if (resetConfirmText !== 'RESET') {
      toast.error('Please type RESET to confirm');
      return;
    }
    try {
      await authedDelete('/api/settings/reset');
      toast.success('All data has been reset');
      setShowResetModal(false);
      setResetConfirmText('');
      fetchSettings();
    } catch (error) {
      toast.error('Failed to reset data');
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    try {
      await authedDelete('/api/settings/account');
      toast.success('Account deleted');
      await signOut(auth);
      onLogout();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6 h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <SettingsCard
        icon={<User className="w-5 h-5 text-[#4F6EF7]" />}
        title="Profile Settings"
        description="Manage your personal information"
        iconBg="bg-[#4F6EF7]/10"
      >
        <div className="space-y-4">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0B1A3E 0%, #4F6EF7 100%)' }}
              >
                {profileForm.photoURL ? (
                  <img src={profileForm.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[#4F6EF7] flex items-center justify-center text-white hover:bg-[#3D5BD9] transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Profile Photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Display Name</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              placeholder="Your name"
              className="w-full h-12 px-4 rounded-xl bg-accent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] transition-all"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={settings.profile.email}
                disabled
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-accent/50 border border-border text-muted-foreground cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Managed by Google Sign-In</p>
          </div>

          <SaveButton onClick={handleSaveProfile} loading={savingSection === 'profile'} />
        </div>
      </SettingsCard>

      {/* Financial Preferences */}
      <SettingsCard
        icon={<DollarSign className="w-5 h-5 text-[#10B981]" />}
        title="Financial Preferences"
        description="Configure your budget parameters"
        iconBg="bg-[#10B981]/10"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Income */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Monthly Income</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  value={financialForm.monthlyIncome}
                  onChange={(e) => setFinancialForm({ ...financialForm, monthlyIncome: e.target.value })}
                  placeholder="5000"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-accent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
                />
              </div>
            </div>

            {/* Savings Target */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Savings Target</label>
              <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  value={financialForm.savingsTarget}
                  onChange={(e) => setFinancialForm({ ...financialForm, savingsTarget: e.target.value })}
                  placeholder="1000"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-accent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Currency */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Preferred Currency</label>
              <Dropdown
                value={financialForm.currency}
                onChange={(value) => setFinancialForm({ ...financialForm, currency: value })}
                options={getCurrencyOptions()}
              />
            </div>

            {/* Month Start Day */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Month Start Date</label>
              <Dropdown
                value={financialForm.monthStartDay}
                onChange={(value) => setFinancialForm({ ...financialForm, monthStartDay: value })}
                options={Array.from({ length: 28 }, (_, i) => ({
                  value: (i + 1).toString(),
                  label: i === 0 ? '1st (Default)' : `${i + 1}${getOrdinalSuffix(i + 1)}`,
                }))}
              />
            </div>
          </div>

          <SaveButton onClick={handleSaveFinancial} loading={savingSection === 'financial'} />
        </div>
      </SettingsCard>

      {/* AI Assistant Settings */}
      <SettingsCard
        icon={<Brain className="w-5 h-5 text-[#8B5CF6]" />}
        title="AI Assistant Settings"
        description="Customize your AI financial advisor"
        iconBg="bg-[#8B5CF6]/10"
      >
        <div className="space-y-6">
          {/* Personality Mode */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Personality Mode</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiPersonalities.map((personality) => (
                <motion.button
                  key={personality.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSaveAI('aiPersonality', personality.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    settings.ai.aiPersonality === personality.id
                      ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                      : 'border-border bg-accent/50 hover:border-[#8B5CF6]/50'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{personality.icon}</span>
                  <p className="font-medium text-foreground text-sm">{personality.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{personality.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* AI Detail Level */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Response Detail Level</label>
            <div className="flex gap-2">
              {detailLevels.map((level) => (
                <motion.button
                  key={level.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSaveAI('aiDetailLevel', level.id)}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors ${
                    settings.ai.aiDetailLevel === level.id
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-accent border border-border text-foreground hover:bg-accent/80'
                  }`}
                >
                  {level.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <ToggleRow
              icon={<Sparkles className="w-5 h-5 text-[#F59E0B]" />}
              title="Financial Mood Detection"
              description="Detect emotional state from messages"
              checked={settings.ai.enableMoodDetection}
              onChange={(checked) => handleSaveAI('enableMoodDetection', checked)}
            />
            <ToggleRow
              icon={<FileText className="w-5 h-5 text-[#10B981]" />}
              title="Monthly Auto-Report"
              description="Generate automatic monthly summaries"
              checked={settings.ai.enableMonthlyReport}
              onChange={(checked) => handleSaveAI('enableMonthlyReport', checked)}
            />
          </div>
        </div>
      </SettingsCard>

      {/* Notification Settings */}
      <SettingsCard
        icon={<Bell className="w-5 h-5 text-[#F59E0B]" />}
        title="Notification Settings"
        description="Manage your alerts and reminders"
        iconBg="bg-[#F59E0B]/10"
      >
        <div className="space-y-3">
          <ToggleRow
            icon={<AlertTriangle className="w-5 h-5 text-[#DC3545]" />}
            title="Spending Alerts"
            description="Get notified when you exceed budget limits"
            checked={settings.notifications.spendingAlerts}
            onChange={(checked) => handleSaveNotification('spendingAlerts', checked)}
          />
          <ToggleRow
            icon={<TrendingUp className="w-5 h-5 text-[#10B981]" />}
            title="Goal Progress Alerts"
            description="Updates on your savings goals"
            checked={settings.notifications.goalAlerts}
            onChange={(checked) => handleSaveNotification('goalAlerts', checked)}
          />
          <ToggleRow
            icon={<CalendarDays className="w-5 h-5 text-[#4F6EF7]" />}
            title="Monthly Summary Reminder"
            description="Reminder to review monthly spending"
            checked={settings.notifications.monthlyReminder}
            onChange={(checked) => handleSaveNotification('monthlyReminder', checked)}
          />
        </div>
      </SettingsCard>

      {/* Appearance Settings */}
      <SettingsCard
        icon={<Palette className="w-5 h-5 text-[#8B5CF6]" />}
        title="Appearance"
        description="Customize the look and feel"
        iconBg="bg-[#8B5CF6]/10"
      >
        <div className="space-y-3">
          <ThemeToggle variant="switch" showLabel={true} />
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Theme preference is synced across all your devices.
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Security Settings */}
      <SettingsCard
        icon={<Shield className="w-5 h-5 text-[#10B981]" />}
        title="Security"
        description="Manage account security"
        iconBg="bg-[#10B981]/10"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#10B981]/5 border border-[#10B981]/20">
            <div className="flex items-center gap-2 text-[#10B981] text-sm">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Google Authentication Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your account is secured with Google Sign-In
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleLogout}
            className="w-full h-12 rounded-xl border border-border text-foreground font-medium flex items-center justify-center gap-2 hover:bg-accent transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowDeleteModal(true)}
            className="w-full h-12 rounded-xl border border-[#DC3545]/30 text-[#DC3545] font-medium flex items-center justify-center gap-2 hover:bg-[#DC3545]/10 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Delete Account
          </motion.button>
        </div>
      </SettingsCard>

      {/* Data & Privacy */}
      <SettingsCard
        icon={<Download className="w-5 h-5 text-[#4F6EF7]" />}
        title="Data & Privacy"
        description="Manage your data"
        iconBg="bg-[#4F6EF7]/10"
      >
        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleClearChatHistory}
            className="w-full h-12 rounded-xl border border-border text-foreground font-medium flex items-center justify-center gap-2 hover:bg-accent transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Clear Chat History
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleExportData}
            className="w-full h-12 rounded-xl border border-border text-foreground font-medium flex items-center justify-center gap-2 hover:bg-accent transition-colors"
          >
            <Download className="w-5 h-5" />
            Export Financial Data
          </motion.button>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium text-[#DC3545] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </p>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowResetModal(true)}
              className="w-full h-12 rounded-xl border border-[#DC3545]/30 text-[#DC3545] font-medium flex items-center justify-center gap-2 hover:bg-[#DC3545]/10 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Reset All Data
            </motion.button>
          </div>
        </div>
      </SettingsCard>

      {/* App Info */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">BudgetAI v2.0</p>
        <p className="text-xs text-muted-foreground mt-1">Powered by Firebase & Gemini AI</p>
      </div>

      {/* Delete Account Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="This action cannot be undone. All your data will be permanently deleted."
        confirmText="DELETE"
        inputValue={deleteConfirmText}
        onInputChange={setDeleteConfirmText}
        buttonText="Delete My Account"
        dangerous
      />

      {/* Reset Data Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setResetConfirmText('');
        }}
        onConfirm={handleResetData}
        title="Reset All Data"
        description="This will delete all your expenses, goals, budgets, and chat history. Your account will remain active."
        confirmText="RESET"
        inputValue={resetConfirmText}
        onInputChange={setResetConfirmText}
        buttonText="Reset All Data"
        dangerous
      />
    </div>
  );
}

// Settings Card Component
function SettingsCard({
  icon,
  title,
  description,
  iconBg,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// Toggle Row Component
function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full p-1 transition-colors ${
          checked ? 'bg-[#4F6EF7]' : 'bg-accent border border-border'
        }`}
      >
        <motion.div
          layout
          className="w-5 h-5 bg-white rounded-full shadow-sm"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
}

// Dropdown Component
function Dropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 px-4 rounded-xl bg-accent border border-border text-foreground flex items-center justify-between hover:bg-accent/80 transition-colors"
      >
        <span>{selectedOption?.label || 'Select...'}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-accent transition-colors ${
                    option.value === value ? 'bg-[#4F6EF7]/10 text-[#4F6EF7]' : 'text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Save Button Component
function SaveButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      disabled={loading}
      className="w-full h-12 rounded-xl font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, #4F6EF7 0%, #8B5CF6 100%)' }}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <Save className="w-5 h-5" />
          Save Changes
        </>
      )}
    </motion.button>
  );
}

// Confirm Modal Component
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  inputValue,
  onInputChange,
  buttonText,
  dangerous,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  buttonText: string;
  dangerous?: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card rounded-2xl border border-border p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${dangerous ? 'bg-[#DC3545]/10' : 'bg-[#F59E0B]/10'} flex items-center justify-center`}>
                <AlertTriangle className={`w-5 h-5 ${dangerous ? 'text-[#DC3545]' : 'text-[#F59E0B]'}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{description}</p>

            <div className="mb-4">
              <label className="text-sm text-foreground mb-2 block">
                Type <span className="font-mono font-medium text-[#DC3545]">{confirmText}</span> to confirm
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={confirmText}
                className="w-full h-12 px-4 rounded-xl bg-accent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DC3545] transition-all"
              />
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border border-border text-foreground font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                disabled={inputValue !== confirmText}
                className={`flex-1 h-12 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  dangerous ? 'bg-[#DC3545] hover:bg-[#C82333]' : 'bg-[#F59E0B] hover:bg-[#D97706]'
                }`}
              >
                {buttonText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helper function for ordinal suffixes
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Target, Save, Loader2 } from 'lucide-react';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import type { UserSettings } from '@/lib/types';

interface FinancialSettingsProps {
  settings: UserSettings;
  isLoading?: boolean;
}

export default function FinancialSettings({ settings, isLoading }: FinancialSettingsProps) {
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMonthlyIncome(settings.monthlyIncome?.toString() || '');
    setSavingsTarget(settings.savingsTarget?.toString() || '');
  }, [settings]);

  const handleSaveSettings = async () => {
    const income = parseFloat(monthlyIncome);
    const target = parseFloat(savingsTarget);

    if (isNaN(income) || income < 0) {
      toast.error('Please enter a valid income');
      return;
    }

    if (isNaN(target) || target < 0) {
      toast.error('Please enter a valid savings target');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');

      const token = await getIdToken(currentUser);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budget/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          settings: {
            monthlyIncome: income,
            savingsTarget: target,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-accent rounded" />
              <div className="h-3 w-48 bg-accent rounded" />
            </div>
          </div>
          <div className="h-12 bg-accent rounded-xl" />
          <div className="h-12 bg-accent rounded-xl" />
          <div className="h-12 bg-accent rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#4F6EF7]/10 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-[#4F6EF7]" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Financial Settings</h3>
          <p className="text-xs text-muted-foreground">Configure your budget parameters</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Monthly Income */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Monthly Income</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="5000"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-accent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] transition-all"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Your net monthly income after taxes</p>
        </div>

        {/* Savings Target */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Monthly Savings Target</label>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="number"
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(e.target.value)}
              placeholder="1000"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-accent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] transition-all"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">How much you want to save each month</p>
        </div>

        {/* Save button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSaveSettings}
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #4F6EF7 0%, #8B5CF6 100%)' }}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

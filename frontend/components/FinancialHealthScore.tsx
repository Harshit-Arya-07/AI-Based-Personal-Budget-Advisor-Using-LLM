'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { calculateFinancialHealthScore, FinancialHealthBreakdown } from '@/lib/financialHealth';
import type { ExpenseItem, UserSettings } from '@/lib/types';

interface FinancialHealthScoreProps {
  settings: UserSettings;
  expenses: ExpenseItem[];
  isLoading: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#4F6EF7';
  if (score >= 40) return '#F59E0B';
  return '#DC3545';
}

function getScoreGrade(score: number): { grade: string; label: string } {
  if (score >= 90) return { grade: 'A+', label: 'Excellent' };
  if (score >= 80) return { grade: 'A', label: 'Great' };
  if (score >= 70) return { grade: 'B', label: 'Good' };
  if (score >= 60) return { grade: 'C', label: 'Fair' };
  if (score >= 50) return { grade: 'D', label: 'Needs Work' };
  return { grade: 'F', label: 'Critical' };
}

const breakdownLabels: Record<keyof FinancialHealthBreakdown, string> = {
  savingsRate: 'Savings Rate',
  categoryBalance: 'Category Balance',
  overspendingRisk: 'Overspending Risk',
  spendingConsistency: 'Spending Consistency',
  emergencyBuffer: 'Emergency Buffer',
};

export default function FinancialHealthScore({
  settings,
  expenses,
  isLoading,
}: FinancialHealthScoreProps) {
  const healthData = useMemo(() => {
    if (!settings.monthlyIncome || expenses.length === 0) {
      return null;
    }

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalSavings = settings.monthlyIncome - totalSpent;

    return calculateFinancialHealthScore({
      monthlyIncome: settings.monthlyIncome,
      savingsTarget: settings.savingsTarget || 0,
      totalSpent,
      totalSavings,
      expenses,
    });
  }, [settings, expenses]);

  const score = healthData?.score || 0;
  const color = getScoreColor(score);
  const { grade, label } = getScoreGrade(score);

  // Circle progress calculation
  const circumference = 2 * Math.PI * 45;
  const progress = (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-card rounded-2xl border border-border p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DC3545]/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-[#DC3545]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Financial Health</h3>
            <p className="text-xs text-muted-foreground">Overall score</p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-24 h-24 rounded-full border-4 border-accent border-t-[#4F6EF7] animate-spin" />
        </div>
      )}

      {/* No data state */}
      {!isLoading && !healthData && (
        <div className="text-center py-8">
          <Info className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Set your income and add expenses</p>
          <p className="text-xs text-muted-foreground mt-1">to calculate your health score</p>
        </div>
      )}

      {/* Score display */}
      {!isLoading && healthData && (
        <div className="space-y-5">
          {/* Circular progress */}
          <div className="flex items-center justify-center gap-6">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - progress }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />
              </svg>
              {/* Score text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold"
                  style={{ color }}
                >
                  {score}
                </motion.span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>

            {/* Grade badge */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: 'spring' }}
                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {grade}
              </motion.div>
              <p className="text-sm font-medium text-foreground mt-2">{label}</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground">Score Breakdown</h4>

            {(Object.keys(healthData.breakdown) as Array<keyof FinancialHealthBreakdown>).map((key, index) => {
              const score = healthData.breakdown[key];
              const label = breakdownLabels[key];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{label}</span>
                      <span className="text-xs font-medium" style={{ color: getScoreColor(score) }}>
                        {score.toFixed(0)}/100
                      </span>
                    </div>
                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: getScoreColor(score) }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Explanation */}
          {healthData.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="p-4 rounded-xl bg-gradient-to-r from-[#4F6EF7]/5 to-[#8B5CF6]/5 border border-[#4F6EF7]/10"
            >
              <p className="text-sm text-foreground leading-relaxed">{healthData.explanation}</p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

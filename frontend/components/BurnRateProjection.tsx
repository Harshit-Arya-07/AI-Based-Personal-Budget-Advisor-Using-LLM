'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, AlertTriangle, CheckCircle } from 'lucide-react';
import { calculateBurnRateProjection } from '@/lib/burnRateProjection';
import { useCurrency } from '@/lib/currencyContext';
import type { ExpenseItem, UserSettings } from '@/lib/types';

interface BurnRateProjectionProps {
  settings: UserSettings;
  expenses: ExpenseItem[];
  isLoading: boolean;
}

function getStatusColor(isOverspending: boolean, daysPassed: number, totalDays: number): string {
  if (isOverspending) return '#DC3545';
  const progress = daysPassed / totalDays;
  if (progress > 0.8) return '#F59E0B';
  return '#10B981';
}

export default function BurnRateProjection({
  settings,
  expenses,
  isLoading,
}: BurnRateProjectionProps) {
  const { formatCurrency } = useCurrency();
  
  const projection = useMemo(() => {
    if (!settings.monthlyIncome || expenses.length === 0) {
      return null;
    }

    const totalSpentThisMonth = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return calculateBurnRateProjection({
      totalSpentThisMonth,
      monthlyIncome: settings.monthlyIncome,
      savingsTarget: settings.savingsTarget || 0,
    });
  }, [settings, expenses]);

  const statusColor = projection
    ? getStatusColor(projection.isOverspendingForecast, projection.daysPassed, projection.totalDaysInMonth)
    : '#64748B';

  const progressPercent = projection
    ? Math.min(100, (projection.projectedMonthEndSpend / projection.allowedSpending) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-2xl border border-border p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Burn Rate</h3>
            <p className="text-xs text-muted-foreground">Spending projection</p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          <div className="h-20 bg-accent/50 animate-pulse rounded-xl" />
          <div className="h-4 bg-accent/50 animate-pulse rounded w-3/4" />
          <div className="h-4 bg-accent/50 animate-pulse rounded w-1/2" />
        </div>
      )}

      {/* No data state */}
      {!isLoading && !projection && (
        <div className="text-center py-8">
          <Flame className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Add income and expenses</p>
          <p className="text-xs text-muted-foreground mt-1">to see your burn rate</p>
        </div>
      )}

      {/* Projection display */}
      {!isLoading && projection && (
        <div className="space-y-5">
          {/* Main metric */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: `${statusColor}10` }}>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${statusColor}20` }}
              >
                <span style={{ color: statusColor }}>
                  {projection.isOverspendingForecast ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {projection.isOverspendingForecast ? 'Projected to exceed budget' : 'On track'}
                </p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold"
                  style={{ color: statusColor }}
                >
                  {formatCurrency(Math.abs(projection.differenceFromAllowed))}
                  <span className="text-sm font-normal ml-1">
                    {projection.isOverspendingForecast ? 'over' : 'buffer'}
                  </span>
                </motion.p>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-accent/50">
              <p className="text-xs text-muted-foreground mb-1">Daily Average</p>
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(projection.dailyAverageSpend)}
              </p>
              <p className="text-xs text-muted-foreground">per day</p>
            </div>

            <div className="p-3 rounded-xl bg-accent/50">
              <p className="text-xs text-muted-foreground mb-1">Month-End Projection</p>
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(projection.projectedMonthEndSpend)}
              </p>
              <p className="text-xs text-muted-foreground">at current rate</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Budget usage projection</span>
              <span>{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-accent rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progressPercent)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  progressPercent > 100
                    ? 'bg-[#DC3545]'
                    : progressPercent > 80
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#10B981]'
                }`}
              />
            </div>
            {progressPercent > 100 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-[#DC3545] mt-1 flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                Projected to exceed allowed spending
              </motion.p>
            )}
          </div>

          {/* Progress info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Day {projection.daysPassed} of {projection.totalDaysInMonth}</span>
            <span>Allowed: {formatCurrency(projection.allowedSpending)}</span>
          </div>

          {/* Explanation */}
          {projection.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-xl bg-gradient-to-r from-[#4F6EF7]/5 to-[#8B5CF6]/5 border border-[#4F6EF7]/10"
            >
              <p className="text-sm text-foreground leading-relaxed">{projection.explanation}</p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

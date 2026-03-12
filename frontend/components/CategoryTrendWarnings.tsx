'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Zap } from 'lucide-react';
import { detectCategorySpendingSpikes, CategoryTrendSpike } from '@/lib/categoryTrends';
import { useCurrency } from '@/lib/currencyContext';
import type { ExpenseItem } from '@/lib/types';

interface CategoryTrendWarningsProps {
  expenses: ExpenseItem[];
  isLoading: boolean;
}

const categoryEmojis: Record<string, string> = {
  housing: '🏠',
  transportation: '🚗',
  food: '🍔',
  utilities: '💡',
  healthcare: '🏥',
  entertainment: '🎬',
  shopping: '🛍️',
  personal: '💅',
  education: '📚',
  savings: '💰',
  investments: '📈',
  other: '📦',
};

function getSeverityColor(increasePercent: number): string {
  if (increasePercent >= 50) return '#DC3545';
  if (increasePercent >= 25) return '#F59E0B';
  return '#4F6EF7';
}

export default function CategoryTrendWarnings({ expenses, isLoading }: CategoryTrendWarningsProps) {
  const { formatCurrency } = useCurrency();
  const { spikes, currentMonthId, lastMonthId } = useMemo(() => {
    if (!expenses.length) return { spikes: [], currentMonthId: '', lastMonthId: '' };
    const now = new Date();
    const monthId = now.toISOString().slice(0, 7);
    return detectCategorySpendingSpikes({
      expenses,
      currentMonthId: monthId,
      thresholdPercent: 15,
    });
  }, [expenses]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="bg-card rounded-2xl border border-border p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Spending Alerts</h3>
            <p className="text-xs text-muted-foreground">
              {spikes.length > 0
                ? `${spikes.length} category spike${spikes.length > 1 ? 's' : ''} detected`
                : 'No unusual spending detected'}
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-accent/50 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && spikes.length === 0 && (
        <div className="text-center py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-14 h-14 rounded-full bg-[#10B981]/10 mx-auto mb-3 flex items-center justify-center"
          >
            <span className="text-2xl">✨</span>
          </motion.div>
          <p className="text-sm text-muted-foreground">Looking good!</p>
          <p className="text-xs text-muted-foreground mt-1">No spending spikes detected</p>
        </div>
      )}

      {/* Spikes list */}
      {!isLoading && spikes.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {spikes.map((spike: CategoryTrendSpike, index: number) => {
              const color = getSeverityColor(spike.increasePercent);
              const emoji = categoryEmojis[spike.category.toLowerCase()] || '📦';

              return (
                <motion.div
                  key={spike.category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl border transition-colors"
                  style={{
                    backgroundColor: `${color}08`,
                    borderColor: `${color}20`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      {emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground capitalize">{spike.category}</h4>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${color}15`,
                            color,
                          }}
                        >
                          +{spike.increasePercent.toFixed(0)}%
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        Spending increased from last month
                      </p>

                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">
                          Current: <span className="font-medium text-foreground">{formatCurrency(spike.thisMonthTotal)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Previous: <span className="font-medium text-foreground">{formatCurrency(spike.lastMonthTotal)}</span>
                        </span>
                      </div>
                    </div>

                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <TrendingUp className="w-5 h-5" style={{ color }} />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Month comparison info */}
      {!isLoading && currentMonthId && lastMonthId && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Comparing {currentMonthId} vs {lastMonthId}
          </p>
        </div>
      )}
    </motion.div>
  );
}

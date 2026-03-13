'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Target, RefreshCcw, Lightbulb, ChevronRight } from 'lucide-react';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useCurrency } from '@/lib/currencyContext';
import type { ExpenseItem } from '@/lib/types';

interface AIInsightsProps {
  expenses: ExpenseItem[];
  monthlyIncome: number;
  isLoadingExpenses: boolean;
}

interface Insight {
  id: string;
  type: 'warning' | 'tip' | 'positive' | 'goal';
  title: string;
  description: string;
  category?: string;
  amount?: number;
  percentChange?: number;
}

interface AIAnalysis {
  topCategories: Array<{ category: string; amount: number }>;
  insights: Insight[];
  summary: string;
}

const iconMap = {
  warning: AlertTriangle,
  tip: Lightbulb,
  positive: TrendingUp,
  goal: Target,
};

const colorMap = {
  warning: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
  tip: { bg: 'bg-[#4F6EF7]/10', text: 'text-[#4F6EF7]', border: 'border-[#4F6EF7]/20' },
  positive: { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/20' },
  goal: { bg: 'bg-[#8B5CF6]/10', text: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/20' },
};

export default function AIInsights({ expenses, monthlyIncome, isLoadingExpenses }: AIInsightsProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  const fetchAnalysis = async () => {
    if (expenses.length === 0 || isLoadingExpenses) return;

    setIsLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await getIdToken(user);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL}/api/budget/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expenses: expenses.slice(0, 50),
          monthlyIncome,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze');

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to load insights');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingExpenses && expenses.length > 0) {
      fetchAnalysis();
    }
  }, [expenses.length > 0, isLoadingExpenses]);

  const handleRefresh = () => {
    fetchAnalysis();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-2xl border border-border p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Insights</h3>
            <p className="text-xs text-muted-foreground">Powered by Gemini</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Loading state */}
      {(isLoading || isLoadingExpenses) && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-accent/50 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/20 text-center"
        >
          <AlertTriangle className="w-8 h-8 text-[#DC3545] mx-auto mb-2" />
          <p className="text-sm text-[#DC3545] font-medium">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 text-xs text-[#4F6EF7] hover:underline"
          >
            Try again
          </button>
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && !isLoadingExpenses && !error && expenses.length === 0 && (
        <div className="text-center py-8">
          <Lightbulb className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Add expenses to get AI insights</p>
        </div>
      )}

      {/* Insights list */}
      {!isLoading && !error && analysis && (
        <div className="space-y-3">
          {/* Summary */}
          {analysis.summary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-r from-[#4F6EF7]/5 to-[#8B5CF6]/5 border border-[#4F6EF7]/10"
            >
              <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
            </motion.div>
          )}

          {/* Individual insights */}
          <AnimatePresence mode="popLayout">
            {analysis.insights.map((insight, index) => {
              const Icon = iconMap[insight.type] || Lightbulb;
              const colors = colorMap[insight.type] || colorMap.tip;
              const isExpanded = expandedInsight === insight.id;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors ${colors.bg} ${colors.border} hover:bg-opacity-20`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm text-foreground truncate">{insight.title}</h4>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="text-xs text-muted-foreground mt-1 overflow-hidden"
                          >
                            {insight.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      {insight.category && !isExpanded && (
                        <span className="text-xs text-muted-foreground">{insight.category}</span>
                      )}
                    </div>

                    {insight.percentChange !== undefined && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${insight.percentChange > 0 ? 'text-[#DC3545]' : 'text-[#10B981]'}`}>
                        {insight.percentChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(insight.percentChange).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Top categories */}
          {analysis.topCategories && analysis.topCategories.length > 0 && (
            <div className="pt-4 mt-4 border-t border-border">
              <h4 className="text-xs font-medium text-muted-foreground mb-3">Top Spending Categories</h4>
              <div className="space-y-2">
                {analysis.topCategories.slice(0, 3).map((cat, index) => {
                  const total = analysis.topCategories.reduce((sum, c) => sum + c.amount, 0);
                  const percentage = total > 0 ? (cat.amount / total) * 100 : 0;

                  return (
                    <motion.div
                      key={cat.category}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs text-muted-foreground w-20 truncate">{cat.category}</span>
                      <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                          className="h-full bg-[#4F6EF7] rounded-full"
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground w-16 text-right">
                        {formatCurrency(cat.amount)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

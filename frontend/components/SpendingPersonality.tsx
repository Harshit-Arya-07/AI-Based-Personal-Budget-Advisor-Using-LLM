'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  RefreshCcw,
  Loader2,
  ShieldCheck,
  Zap,
  Heart,
  TrendingUp,
  PiggyBank,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { PersonalityResponse, PersonalityType } from '@/lib/types';

interface SpendingPersonalityProps {
  isLoadingExpenses?: boolean;
}

// Personality type configurations
const personalityConfig: Record<PersonalityType, {
  icon: typeof Brain;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  emoji: string;
  shortDesc: string;
}> = {
  'Disciplined Planner': {
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    gradient: 'from-emerald-500 to-teal-500',
    emoji: '📋',
    shortDesc: 'Methodical & strategic with money',
  },
  'Impulsive Spender': {
    icon: Zap,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    gradient: 'from-orange-500 to-red-500',
    emoji: '⚡',
    shortDesc: 'Spontaneous & emotion-driven spending',
  },
  'Lifestyle Optimizer': {
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    gradient: 'from-pink-500 to-rose-500',
    emoji: '✨',
    shortDesc: 'Quality-focused & experience-driven',
  },
  'Risk Taker': {
    icon: TrendingUp,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    gradient: 'from-purple-500 to-indigo-500',
    emoji: '🎯',
    shortDesc: 'Bold & opportunity-seeking',
  },
  'Conservative Saver': {
    icon: PiggyBank,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    gradient: 'from-blue-500 to-cyan-500',
    emoji: '🏦',
    shortDesc: 'Security-focused & future-oriented',
  },
  'Balanced Manager': {
    icon: Scale,
    color: 'text-[#4F6EF7]',
    bgColor: 'bg-[#4F6EF7]/10',
    borderColor: 'border-[#4F6EF7]/20',
    gradient: 'from-[#4F6EF7] to-[#8B5CF6]',
    emoji: '⚖️',
    shortDesc: 'Stable & sustainable approach',
  },
};

export default function SpendingPersonality({ isLoadingExpenses }: SpendingPersonalityProps) {
  const [data, setData] = useState<PersonalityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchPersonality = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await getIdToken(user);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budget/personality`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze personality');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load personality analysis');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingExpenses) {
      fetchPersonality();
    }
  }, [isLoadingExpenses]);

  const config = data?.personality ? personalityConfig[data.personality.personalityType] : null;
  const Icon = config?.icon || Brain;

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Spending Personality</h3>
            <p className="text-xs text-muted-foreground">AI-powered behavior analysis</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Analyzing your spending patterns...</p>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Spending Personality</h3>
            <p className="text-xs text-muted-foreground">AI-powered behavior analysis</p>
          </div>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={fetchPersonality}
            className="mt-3 text-sm text-[#4F6EF7] hover:text-[#4F6EF7]/80 flex items-center gap-1"
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </motion.div>
    );
  }

  if (!data || !config) return null;

  const { personality, metrics } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Spending Personality</h3>
              <p className="text-xs text-muted-foreground">AI-powered behavior analysis</p>
            </div>
          </div>
          <button
            onClick={fetchPersonality}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            title="Refresh analysis"
          >
            <RefreshCcw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Personality Type Card */}
      <div className="px-6 pb-4">
        <motion.div
          className={`relative rounded-xl p-4 ${config.bgColor} border ${config.borderColor}`}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{config.emoji}</span>
                <h4 className={`font-bold text-lg ${config.color}`}>
                  {personality.personalityType}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {config.shortDesc}
              </p>
            </div>
          </div>

          {/* Reasoning */}
          <p className="mt-4 text-sm text-foreground/80 leading-relaxed">
            {personality.reasoning}
          </p>
        </motion.div>
      </div>

      {/* Key Metrics */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Savings Rate"
            value={`${metrics.savingsRatePercent}%`}
            isPositive={metrics.savingsRatePercent >= 20}
          />
          <MetricCard
            label="Spending Volatility"
            value={`${metrics.spendingVolatility.toFixed(0)}%`}
            isPositive={metrics.spendingVolatility < 40}
          />
          <MetricCard
            label="Essential Spending"
            value={`${metrics.essentialPercent}%`}
            isPositive={metrics.essentialPercent >= 50}
          />
          <MetricCard
            label="Emergency Fund"
            value={`${metrics.emergencyFundMonths.toFixed(1)} mo`}
            isPositive={metrics.emergencyFundMonths >= 3}
          />
        </div>
      </div>

      {/* Expandable Details */}
      <div className="border-t border-border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
        >
          <span>View detailed analysis</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-4">
                {/* Strengths */}
                {personality.strengths.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Your Strengths
                    </h5>
                    <ul className="space-y-1.5">
                      {personality.strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-emerald-500 mt-1">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks */}
                {personality.risks.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      Watch Out For
                    </h5>
                    <ul className="space-y-1.5">
                      {personality.risks.map((risk, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvement Focus */}
                {personality.improvementFocus.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#4F6EF7]" />
                      Focus Areas
                    </h5>
                    <ul className="space-y-1.5">
                      {personality.improvementFocus.map((focus, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-[#4F6EF7] mt-1">•</span>
                          {focus}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Category Breakdown */}
                {metrics.categoryBreakdown.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-foreground mb-2">
                      Top Spending Categories
                    </h5>
                    <div className="space-y-2">
                      {metrics.categoryBreakdown.map((cat, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground capitalize">{cat.category}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-accent rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${cat.percentage}%` }}
                                className="h-full bg-gradient-to-r from-[#4F6EF7] to-[#8B5CF6] rounded-full"
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Quality Note */}
                {!data.dataQuality.hasEnoughData && (
                  <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg p-3">
                    <p className="text-xs text-[#F59E0B]">
                      💡 Analysis based on {data.dataQuality.expenseCount} expenses. 
                      Add more transactions for more accurate insights.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Metric Card Component
function MetricCard({ label, value, isPositive }: { label: string; value: string; isPositive: boolean }) {
  return (
    <div className="bg-accent/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-semibold ${isPositive ? 'text-emerald-500' : 'text-orange-500'}`}>
        {value}
      </p>
    </div>
  );
}

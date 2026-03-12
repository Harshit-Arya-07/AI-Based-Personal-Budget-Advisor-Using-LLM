'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scissors,
  PlusCircle,
  XCircle,
  Target,
  ShoppingBag,
  Sliders,
  ChevronRight,
  BarChart3,
  Calendar,
  Zap,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  runScenarioSimulation,
  runCombinedScenarios,
  generate12MonthProjection,
  SCENARIO_CONFIGS,
  SCENARIO_PRESETS,
  ScenarioType,
  WhatIfSimulationResult,
} from '@/lib/whatIfSimulator';
import { useCurrency } from '@/lib/currencyContext';
import type { ExpenseItem, SavingsGoal, UserSettings } from '@/lib/types';

interface WhatIfSimulatorProps {
  expenses: ExpenseItem[];
  goals: SavingsGoal[];
  settings: UserSettings;
  isLoading: boolean;
}

const categoryOptions = [
  'Food',
  'Entertainment',
  'Shopping',
  'Transportation',
  'Utilities',
  'Personal',
  'Other',
];

const scenarioIcons: Record<string, React.ReactNode> = {
  scissors: <Scissors className="w-4 h-4" />,
  'trending-up': <TrendingUp className="w-4 h-4" />,
  'trending-down': <TrendingDown className="w-4 h-4" />,
  'plus-circle': <PlusCircle className="w-4 h-4" />,
  'x-circle': <XCircle className="w-4 h-4" />,
  target: <Target className="w-4 h-4" />,
  'shopping-bag': <ShoppingBag className="w-4 h-4" />,
  sliders: <Sliders className="w-4 h-4" />,
};

type TabType = 'quick' | 'scenarios' | 'presets' | 'projection';

export default function WhatIfSimulator({ expenses, goals, settings, isLoading }: WhatIfSimulatorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('quick');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('reduce_category');
  const [primaryValue, setPrimaryValue] = useState('100');
  const [secondaryValue, setSecondaryValue] = useState<string>('Food');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const { formatCurrency, formatCompact } = useCurrency();

  // Quick simulation (legacy mode)
  const quickSimulation = useMemo(() => {
    if (!settings.monthlyIncome || expenses.length === 0) return null;

    return runScenarioSimulation({
      monthlyIncome: settings.monthlyIncome,
      savingsTarget: settings.savingsTarget || 0,
      expenses,
      goals,
      scenarioType: selectedScenario,
      primaryValue: parseFloat(primaryValue) || 0,
      secondaryValue: selectedScenario === 'major_purchase' ? parseInt(secondaryValue) || 12 : secondaryValue,
    });
  }, [settings, expenses, goals, selectedScenario, primaryValue, secondaryValue]);

  // Preset simulation
  const presetSimulation = useMemo(() => {
    if (!settings.monthlyIncome || !selectedPreset) return null;

    const preset = SCENARIO_PRESETS.find((p) => p.id === selectedPreset);
    if (!preset) return null;

    // Handle percentage-based scenarios
    const adjustedScenarios = preset.scenarios.map((s) => {
      if (s.type === 'decrease_income' && s.value < 1) {
        return { ...s, value: settings.monthlyIncome * s.value };
      }
      return s;
    });

    return runCombinedScenarios({
      monthlyIncome: settings.monthlyIncome,
      savingsTarget: settings.savingsTarget || 0,
      expenses,
      goals,
      scenarios: adjustedScenarios,
    });
  }, [settings, expenses, goals, selectedPreset]);

  // 12-month projection
  const projection = useMemo(() => {
    if (!settings.monthlyIncome || expenses.length === 0) return null;

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const monthlySavings = settings.monthlyIncome - totalSpent;

    return generate12MonthProjection({
      monthlyIncome: settings.monthlyIncome,
      monthlySavings,
      currentSavings: 0,
    });
  }, [settings, expenses]);

  const config = SCENARIO_CONFIGS[selectedScenario];

  const savingsChange = quickSimulation
    ? quickSimulation.after.totalSavings - quickSimulation.before.totalSavings
    : 0;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'quick', label: 'Quick', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'scenarios', label: 'Scenarios', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'presets', label: 'Presets', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'projection', label: '12-Month', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-card rounded-2xl border border-border p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">What-If Simulator</h3>
            <p className="text-xs text-muted-foreground">Plan your financial future</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-accent/50 rounded-lg mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          <div className="h-10 bg-accent/50 animate-pulse rounded-lg" />
          <div className="h-32 bg-accent/50 animate-pulse rounded-xl" />
        </div>
      )}

      {/* No data state */}
      {!isLoading && (!settings.monthlyIncome || expenses.length === 0) && (
        <div className="text-center py-8">
          <Sparkles className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Add income and expenses</p>
          <p className="text-xs text-muted-foreground mt-1">to run simulations</p>
        </div>
      )}

      {/* Quick Tab */}
      <AnimatePresence mode="wait">
        {!isLoading && quickSimulation && activeTab === 'quick' && (
          <motion.div
            key="quick"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {/* Scenario selector */}
            <div className="grid grid-cols-2 gap-2">
              {(['reduce_category', 'increase_income', 'remove_subscription', 'add_expense'] as ScenarioType[]).map(
                (type) => {
                  const cfg = SCENARIO_CONFIGS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedScenario(type)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedScenario === type
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/5'
                          : 'border-border bg-accent/30 hover:border-[#8B5CF6]/50'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                        style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                      >
                        {scenarioIcons[cfg.icon]}
                      </div>
                      <p className="text-xs font-medium text-foreground">{cfg.label}</p>
                    </button>
                  );
                }
              )}
            </div>

            {/* Input fields */}
            <div className="space-y-3">
              {config.secondaryInput && config.secondaryInput.type === 'category' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{config.secondaryInput.label}</label>
                  <select
                    value={secondaryValue}
                    onChange={(e) => setSecondaryValue(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-accent border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{config.inputLabel}</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder={config.inputPlaceholder}
                    value={primaryValue}
                    onChange={(e) => setPrimaryValue(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-accent border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>
            </div>

            {/* Results */}
            <SimulationResults 
              simulation={quickSimulation} 
              savingsChange={savingsChange}
              formatCurrency={formatCurrency}
              formatCompact={formatCompact}
            />
          </motion.div>
        )}

        {/* Scenarios Tab - Full list */}
        {!isLoading && quickSimulation && activeTab === 'scenarios' && (
          <motion.div
            key="scenarios"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            {Object.values(SCENARIO_CONFIGS).map((cfg) => (
              <button
                key={cfg.type}
                onClick={() => {
                  setSelectedScenario(cfg.type);
                  setActiveTab('quick');
                }}
                className="w-full p-3 rounded-xl border border-border bg-accent/30 hover:border-[#8B5CF6]/50 transition-all flex items-center gap-3 text-left"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                >
                  {scenarioIcons[cfg.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{cfg.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Presets Tab */}
        {!isLoading && settings.monthlyIncome && activeTab === 'presets' && (
          <motion.div
            key="presets"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            <div className="grid gap-2">
              {SCENARIO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(selectedPreset === preset.id ? null : preset.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    selectedPreset === preset.id
                      ? 'border-[#8B5CF6] bg-[#8B5CF6]/5'
                      : 'border-border bg-accent/30 hover:border-[#8B5CF6]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{preset.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </div>
                    {selectedPreset === preset.id && (
                      <Check className="w-4 h-4 text-[#8B5CF6]" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Preset Results */}
            {presetSimulation && selectedPreset && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 rounded-xl bg-[#8B5CF6]/5 border border-[#8B5CF6]/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-sm font-medium text-foreground">Combined Impact</span>
                </div>

                <div className="space-y-2 mb-4">
                  {presetSimulation.scenarioLabels.map((label, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowRight className="w-3 h-3" />
                      {label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Current Savings</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(presetSimulation.before.totalSavings)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#8B5CF6]/10">
                    <p className="text-xs text-muted-foreground mb-1">After Changes</p>
                    <p className="text-lg font-bold text-[#8B5CF6]">
                      {formatCurrency(presetSimulation.after.totalSavings)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex justify-center">
                  <div
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      presetSimulation.after.totalSavings > presetSimulation.before.totalSavings
                        ? 'bg-[#10B981]/15 text-[#10B981]'
                        : 'bg-[#DC3545]/15 text-[#DC3545]'
                    }`}
                  >
                    {presetSimulation.after.totalSavings > presetSimulation.before.totalSavings ? '+' : ''}
                    {formatCurrency(presetSimulation.after.totalSavings - presetSimulation.before.totalSavings)}/mo
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 12-Month Projection Tab */}
        {!isLoading && projection && activeTab === 'projection' && (
          <motion.div
            key="projection"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Savings projection at current rate</span>
            </div>

            {/* Mini bar chart */}
            <div className="h-32 flex items-end gap-1">
              {projection.slice(0, 12).map((month, i) => {
                const maxValue = Math.max(...projection.map((p) => p.cumulativeSavings));
                const height = maxValue > 0 ? (month.cumulativeSavings / maxValue) * 100 : 0;
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="w-full rounded-t-sm bg-gradient-to-t from-[#8B5CF6] to-[#A78BFA]"
                      style={{ minHeight: height > 0 ? 4 : 0 }}
                    />
                    <span className="text-[9px] text-muted-foreground">
                      {month.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-accent/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">3 Months</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(projection[2]?.cumulativeSavings || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#8B5CF6]/10 text-center">
                <p className="text-xs text-muted-foreground mb-1">6 Months</p>
                <p className="text-sm font-semibold text-[#8B5CF6]">
                  {formatCurrency(projection[5]?.cumulativeSavings || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#10B981]/10 text-center">
                <p className="text-xs text-muted-foreground mb-1">12 Months</p>
                <p className="text-sm font-semibold text-[#10B981]">
                  {formatCurrency(projection[11]?.cumulativeSavings || 0)}
                </p>
              </div>
            </div>

            {/* Monthly rate */}
            <div className="text-center text-xs text-muted-foreground">
              At {formatCurrency(projection[0]?.projectedSavings || 0)}/month savings rate
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Results component extracted for reuse
function SimulationResults({
  simulation,
  savingsChange,
  formatCurrency,
  formatCompact,
}: {
  simulation: WhatIfSimulationResult;
  savingsChange: number;
  formatCurrency: (amount: number) => string;
  formatCompact: (amount: number) => string;
}) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        backgroundColor: '#8B5CF605',
        borderColor: '#8B5CF615',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-medium text-muted-foreground">Projected Impact</h4>
        <span className="text-xs text-[#8B5CF6]">{simulation.scenarioLabel}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Current */}
        <div className="p-3 rounded-lg bg-background/50">
          <p className="text-xs text-muted-foreground mb-1">Now</p>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(simulation.before.totalSavings)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {simulation.before.savingsRatePercent.toFixed(0)}% rate
          </p>
        </div>

        {/* Projected */}
        <div className="p-3 rounded-lg bg-[#8B5CF6]/10">
          <p className="text-xs text-muted-foreground mb-1">After</p>
          <p className="text-lg font-bold text-[#8B5CF6]">
            {formatCurrency(simulation.after.totalSavings)}
          </p>
          <p className="text-[10px] text-[#8B5CF6]">
            {simulation.after.savingsRatePercent.toFixed(0)}% rate
          </p>
        </div>
      </div>

      {/* Change indicator */}
      <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-background/50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            savingsChange >= 0
              ? 'bg-[#10B981]/15 text-[#10B981]'
              : 'bg-[#DC3545]/15 text-[#DC3545]'
          }`}
        >
          {savingsChange >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          {savingsChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(savingsChange))}/mo
        </motion.div>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="p-2 rounded-lg bg-accent/50 text-center">
          <p className="text-[10px] text-muted-foreground">Daily Spend</p>
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(simulation.after.safeDailySpend)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-[#8B5CF6]/10 text-center">
          <p className="text-[10px] text-muted-foreground">Health</p>
          <p className="text-sm font-semibold text-[#8B5CF6]">
            {simulation.after.financialHealthScore.toFixed(0)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-[#10B981]/10 text-center">
          <p className="text-[10px] text-muted-foreground">Year</p>
          <p className="text-sm font-semibold text-[#10B981]">
            {formatCompact(simulation.after.totalSavings * 12)}
          </p>
        </div>
      </div>
    </div>
  );
}

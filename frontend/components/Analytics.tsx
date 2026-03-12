'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, ChevronDown } from 'lucide-react';
import { useCurrency } from '@/lib/currencyContext';
import type { ExpenseItem } from '@/lib/types';

interface AnalyticsProps {
  expenses: ExpenseItem[];
  monthlyIncome: number;
  isLoading: boolean;
}

const categoryColors: Record<string, string> = {
  housing: '#4F6EF7',
  transportation: '#10B981',
  food: '#F59E0B',
  utilities: '#8B5CF6',
  healthcare: '#DC3545',
  entertainment: '#EC4899',
  shopping: '#06B6D4',
  personal: '#F97316',
  education: '#6366F1',
  savings: '#10B981',
  investments: '#22C55E',
  other: '#64748B',
};

type TimeRange = '7d' | '30d' | '90d' | 'all';

export default function Analytics({ expenses, monthlyIncome, isLoading }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const { formatCurrency, symbol: currencySymbol } = useCurrency();

  const filteredExpenses = useMemo(() => {
    if (timeRange === 'all') return expenses;

    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return expenses.filter((e) => new Date(e.date) >= cutoff);
  }, [expenses, timeRange]);

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const expense of filteredExpenses) {
      const cat = expense.category.toLowerCase();
      totals[cat] = (totals[cat] || 0) + expense.amount;
    }

    return Object.entries(totals)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: categoryColors[name] || categoryColors.other,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const dailyData = useMemo(() => {
    const dailyTotals: Record<string, number> = {};

    for (const expense of filteredExpenses) {
      dailyTotals[expense.date] = (dailyTotals[expense.date] || 0) + expense.amount;
    }

    return Object.entries(dailyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount,
      }));
  }, [filteredExpenses]);

  const totalSpending = categoryData.reduce((sum, cat) => sum + cat.value, 0);

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
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Spending Analytics</h3>
            <p className="text-xs text-muted-foreground">{formatCurrency(totalSpending)} total</p>
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="h-9 px-3 rounded-lg bg-accent border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]"
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="h-64 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-accent border-t-[#4F6EF7] animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredExpenses.length === 0 && (
        <div className="h-64 flex flex-col items-center justify-center">
          <Calendar className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No data for selected period</p>
        </div>
      )}

      {/* Charts */}
      {!isLoading && filteredExpenses.length > 0 && (
        <div className="space-y-6">
          {/* Category breakdown */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-muted-foreground">By Category</h4>
              <div className="flex items-center gap-1 bg-accent rounded-lg p-1">
                <button
                  onClick={() => setChartType('pie')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    chartType === 'pie' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pie
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    chartType === 'bar' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  ) : (
                    <BarChart data={categoryData.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" tickFormatter={(v) => `${currencySymbol}${v}`} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {categoryData.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {categoryData.map((cat) => {
                  const percentage = totalSpending > 0 ? ((cat.value / totalSpending) * 100).toFixed(1) : '0';
                  return (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="flex-1 text-sm text-foreground truncate">{cat.name}</span>
                      <span className="text-xs text-muted-foreground">{percentage}%</span>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(cat.value)}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Spending trend */}
          {dailyData.length > 1 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Daily Spending Trend</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis tickFormatter={(v) => `${currencySymbol}${v}`} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Spent']}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#4F6EF7"
                      strokeWidth={2}
                      dot={{ fill: '#4F6EF7', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#4F6EF7' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Income vs Expenses */}
          {monthlyIncome > 0 && (
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Budget Overview</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20">
                  <p className="text-xs text-[#10B981] mb-1">Income</p>
                  <p className="text-xl font-bold text-[#10B981]">{formatCurrency(monthlyIncome)}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#DC3545]/10 border border-[#DC3545]/20">
                  <p className="text-xs text-[#DC3545] mb-1">Spent</p>
                  <p className="text-xl font-bold text-[#DC3545]">{formatCurrency(totalSpending)}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Budget used</span>
                  <span>{((totalSpending / monthlyIncome) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-accent rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (totalSpending / monthlyIncome) * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      totalSpending / monthlyIncome > 0.9
                        ? 'bg-[#DC3545]'
                        : totalSpending / monthlyIncome > 0.7
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#10B981]'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

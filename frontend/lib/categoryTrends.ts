import { ExpenseItem } from './types';

export interface CategoryTrendSpike {
  category: string;
  thisMonthTotal: number;
  lastMonthTotal: number;
  increasePercent: number;
}

export function monthIdFromDate(dateString: string) {
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return '';
  return dateString.slice(0, 7);
}

export function getPreviousMonthId(monthId: string) {
  if (!/^\d{4}-\d{2}$/.test(monthId)) return '';
  const [yearPart, monthPart] = monthId.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const previous = new Date(Date.UTC(year, month - 2, 1));
  return previous.toISOString().slice(0, 7);
}

export function aggregateCategoryTotalsByMonth(expenses: ExpenseItem[]) {
  const monthlyCategoryTotals = new Map<string, Map<string, number>>();

  for (const expense of expenses) {
    const monthId = monthIdFromDate(expense.date);
    if (!monthId) continue;

    if (!monthlyCategoryTotals.has(monthId)) {
      monthlyCategoryTotals.set(monthId, new Map<string, number>());
    }

    const categoryTotals = monthlyCategoryTotals.get(monthId)!;
    const category = String(expense.category || 'Other');
    const amount = Number(expense.amount || 0);
    categoryTotals.set(category, Number(((categoryTotals.get(category) || 0) + amount).toFixed(2)));
  }

  return monthlyCategoryTotals;
}

export function detectCategorySpendingSpikes({
  expenses,
  currentMonthId,
  thresholdPercent = 15,
}: {
  expenses: ExpenseItem[];
  currentMonthId: string;
  thresholdPercent?: number;
}) {
  const monthlyCategoryTotals = aggregateCategoryTotalsByMonth(expenses);
  const lastMonthId = getPreviousMonthId(currentMonthId);

  const currentTotals = monthlyCategoryTotals.get(currentMonthId) || new Map<string, number>();
  const lastTotals = monthlyCategoryTotals.get(lastMonthId) || new Map<string, number>();

  const spikes: CategoryTrendSpike[] = [];

  for (const [category, thisMonthTotal] of currentTotals.entries()) {
    const lastMonthTotal = Number(lastTotals.get(category) || 0);
    if (thisMonthTotal <= 0) continue;

    let increasePercent = 0;
    if (lastMonthTotal <= 0) {
      increasePercent = 100;
    } else {
      increasePercent = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    }

    if (increasePercent > thresholdPercent) {
      spikes.push({
        category,
        thisMonthTotal,
        lastMonthTotal,
        increasePercent: Number(increasePercent.toFixed(1)),
      });
    }
  }

  spikes.sort((left, right) => right.increasePercent - left.increasePercent);

  return { currentMonthId, lastMonthId, spikes };
}

export interface BurnRateInputs {
  totalSpentThisMonth: number;
  monthlyIncome: number;
  savingsTarget: number;
  now?: Date;
}

export interface BurnRateResult {
  daysPassed: number;
  totalDaysInMonth: number;
  dailyAverageSpend: number;
  projectedMonthEndSpend: number;
  allowedSpending: number;
  differenceFromAllowed: number;
  isOverspendingForecast: boolean;
  explanation: string;
}

function safeNumber(value: number) {
  if (!Number.isFinite(value)) return 0;
  return value;
}

function buildExplanation({
  isOverspendingForecast,
  projectedMonthEndSpend,
  allowedSpending,
  differenceFromAllowed,
}: {
  isOverspendingForecast: boolean;
  projectedMonthEndSpend: number;
  allowedSpending: number;
  differenceFromAllowed: number;
}) {
  if (allowedSpending <= 0) {
    return 'Your allowed spending is currently zero or negative after savings target. Reduce target or increase income to avoid immediate overrun risk.';
  }

  if (isOverspendingForecast) {
    return `At your current burn rate, month-end spending is projected at $${projectedMonthEndSpend.toFixed(2)}, which is $${Math.abs(
      differenceFromAllowed
    ).toFixed(2)} above your allowed spending ($${allowedSpending.toFixed(2)}).`;
  }

  return `Current burn rate projects month-end spending at $${projectedMonthEndSpend.toFixed(2)}, leaving a buffer of $${Math.abs(
    differenceFromAllowed
  ).toFixed(2)} versus allowed spending ($${allowedSpending.toFixed(2)}).`;
}

export function calculateBurnRateProjection(input: BurnRateInputs): BurnRateResult {
  const now = input.now || new Date();
  const totalSpentThisMonth = safeNumber(input.totalSpentThisMonth);
  const monthlyIncome = safeNumber(input.monthlyIncome);
  const savingsTarget = safeNumber(input.savingsTarget);

  const daysPassed = Math.max(now.getDate(), 1);
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const dailyAverageSpend = totalSpentThisMonth / daysPassed;
  const projectedMonthEndSpend = dailyAverageSpend * totalDaysInMonth;

  const allowedSpending = monthlyIncome - savingsTarget;
  const differenceFromAllowed = allowedSpending - projectedMonthEndSpend;
  const isOverspendingForecast = projectedMonthEndSpend > allowedSpending;

  return {
    daysPassed,
    totalDaysInMonth,
    dailyAverageSpend: Number(dailyAverageSpend.toFixed(2)),
    projectedMonthEndSpend: Number(projectedMonthEndSpend.toFixed(2)),
    allowedSpending: Number(allowedSpending.toFixed(2)),
    differenceFromAllowed: Number(differenceFromAllowed.toFixed(2)),
    isOverspendingForecast,
    explanation: buildExplanation({
      isOverspendingForecast,
      projectedMonthEndSpend,
      allowedSpending,
      differenceFromAllowed,
    }),
  };
}

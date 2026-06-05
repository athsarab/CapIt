import { FinancialSummary, MonthlyData, Transaction } from '@/lib/types';

// ============================================================
// Currency Formatting
// ============================================================

export function formatCurrency(
  amount: number,
  symbol: string = 'Rs.',
  locale: string = 'en-LK'
): string {
  return `${symbol} ${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function formatCompact(amount: number, symbol: string = 'Rs.'): string {
  if (amount >= 1_000_000) {
    return `${symbol} ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${symbol} ${(amount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount, symbol);
}

// ============================================================
// Financial Calculations
// ============================================================

export function calculateFinancialSummary(
  transactions: Transaction[],
  month?: number,
  year?: number
): FinancialSummary {
  const filtered = month !== undefined && year !== undefined
    ? transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
    : transactions;

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const savings = Math.max(0, balance);

  const healthScore = calculateHealthScore(totalIncome, totalExpenses, savings);

  return { totalIncome, totalExpenses, balance, savings, healthScore };
}

export function calculateHealthScore(
  income: number,
  expenses: number,
  savings: number
): number {
  if (income === 0) return 0;

  const savingsRate = savings / income;
  const expenseRatio = expenses / income;

  let score = 0;

  // Savings rate component (max 40 points)
  if (savingsRate >= 0.3) score += 40;
  else if (savingsRate >= 0.2) score += 30;
  else if (savingsRate >= 0.1) score += 20;
  else if (savingsRate > 0) score += 10;

  // Expense ratio component (max 40 points)
  if (expenseRatio <= 0.5) score += 40;
  else if (expenseRatio <= 0.7) score += 30;
  else if (expenseRatio <= 0.9) score += 20;
  else if (expenseRatio <= 1) score += 10;

  // Has income component (max 20 points)
  if (income > 0) score += 20;

  return Math.min(100, score);
}

export function getHealthLabel(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      label: 'Excellent',
      color: '#22c55e',
      description: 'Great job! You are managing your finances very well.',
    };
  } else if (score >= 60) {
    return {
      label: 'Good',
      color: '#84cc16',
      description: 'You are on the right track. Keep saving more!',
    };
  } else if (score >= 40) {
    return {
      label: 'Fair',
      color: '#eab308',
      description: 'Consider reducing expenses and increasing savings.',
    };
  } else if (score >= 20) {
    return {
      label: 'Poor',
      color: '#f97316',
      description: 'Your expenses are high. Review your budget.',
    };
  }
  return {
    label: 'Critical',
    color: '#ef4444',
    description: 'Immediate action needed. Set a strict budget.',
  };
}

// ============================================================
// Date Utilities
// ============================================================

export function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
}

export function getShortMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' });
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateStr);
}

// ============================================================
// Monthly trend data (last 6 months)
// ============================================================

export function buildMonthlyData(
  transactions: Transaction[],
  months: number = 6
): MonthlyData[] {
  const result: MonthlyData[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();

    const filtered = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() + 1 === m && td.getFullYear() === y;
    });

    const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    result.push({
      month: getShortMonthName(m),
      income,
      expenses,
      savings: Math.max(0, income - expenses),
    });
  }

  return result;
}

// ============================================================
// Budget helpers
// ============================================================

export function getBudgetStatus(spent: number, budget: number): {
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
  color: string;
} {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;

  if (percentage >= 100) {
    return { percentage: Math.min(percentage, 100), status: 'danger', color: '#ef4444' };
  } else if (percentage >= 80) {
    return { percentage, status: 'warning', color: '#f97316' };
  }
  return { percentage, status: 'safe', color: '#22c55e' };
}

// ============================================================
// Recurring expense helpers
// ============================================================

export function getNextDueDate(frequency: string, fromDate: Date = new Date()): Date {
  const next = new Date(fromDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================
// Category spending aggregation
// ============================================================

export function getCategorySpending(transactions: Transaction[]) {
  const map = new Map<string, { name: string; amount: number; color: string; icon: string }>();

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const key = t.category?.name ?? 'Other';
      const existing = map.get(key);
      if (existing) {
        existing.amount += t.amount;
      } else {
        map.set(key, {
          name: key,
          amount: t.amount,
          color: t.category?.color ?? '#94a3b8',
          icon: t.category?.icon ?? 'circle-dot',
        });
      }
    });

  const total = Array.from(map.values()).reduce((s, v) => s + v.amount, 0);

  return Array.from(map.values())
    .map((v) => ({ ...v, percentage: total > 0 ? (v.amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

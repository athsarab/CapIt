'use client';

import { useEffect } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { getBudgetStatus, getCurrentMonthYear } from '@/lib/utils/finance';
import toast from 'react-hot-toast';

/** 
 * Invisible component that watches budgets and fires warnings
 * when new expenses push a category over 80% / 100% of its budget.
 */
export function BudgetWatcher() {
  const { transactions, budgets, isLoading } = useApp();
  const { month, year } = getCurrentMonthYear();

  useEffect(() => {
    if (isLoading) return;

    const overBudget = budgets.filter(b => {
      if (b.month !== month || b.year !== year) return false;
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category_id === b.category_id &&
          new Date(t.date).getMonth() + 1 === month &&
          new Date(t.date).getFullYear() === year)
        .reduce((s, t) => s + t.amount, 0);
      const status = getBudgetStatus(spent, b.amount);
      return status.status === 'danger';
    });

    if (overBudget.length > 0) {
      overBudget.forEach(b => {
        toast.error(`⚠️ Over budget in ${b.category?.name ?? 'a category'}!`, {
          id: `budget-${b.id}`,
          duration: 5000,
        });
      });
    }
  }, [transactions]);  // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatCurrency, getBudgetStatus, getMonthName, getCurrentMonthYear } from '@/lib/utils/finance';
import { Plus, Trash2, Wallet, Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';

export default function BudgetsPage() {
  const supabase = createClient();
  const { budgets, categories, transactions, currencySymbol, refreshBudgets } = useApp();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

  const monthBudgets = useMemo(() => {
    return budgets.filter(b => b.month === selectedMonth && b.year === selectedYear);
  }, [budgets, selectedMonth, selectedYear]);

  const budgetsWithSpending = useMemo(() => {
    return monthBudgets.map(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category_id === b.category_id &&
          new Date(t.date).getMonth() + 1 === selectedMonth &&
          new Date(t.date).getFullYear() === selectedYear)
        .reduce((s, t) => s + t.amount, 0);
      return { ...b, spent };
    });
  }, [monthBudgets, transactions, selectedMonth, selectedYear]);

  const totalBudget = budgetsWithSpending.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetsWithSpending.reduce((s, b) => s + (b.spent ?? 0), 0);
  const overBudgetCount = budgetsWithSpending.filter(b => (b.spent ?? 0) > b.amount).length;

  const usedCategoryIds = monthBudgets.map(b => b.category_id);
  const availableCategories = expenseCategories.filter(c => !usedCategoryIds.includes(c.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { toast.error('Select a category'); return; }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { toast.error('Enter valid amount'); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('budgets').upsert({
      user_id: user!.id,
      category_id: categoryId,
      amount: num,
      month: selectedMonth,
      year: selectedYear,
    }, { onConflict: 'user_id,category_id,month,year' });

    if (error) { toast.error('Failed to save budget'); }
    else {
      toast.success('Budget saved!');
      setShowForm(false); setCategoryId(''); setAmount('');
      refreshBudgets();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this budget?')) return;
    await supabase.from('budgets').delete().eq('id', id);
    toast.success('Budget deleted');
    refreshBudgets();
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }));
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Budgets</h1>
        <button id="add-budget-btn" onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 !px-4 !py-2.5 text-sm">
          <Plus className="w-4 h-4" /> Add Budget
        </button>
      </div>

      {/* Month/Year selector */}
      <div className="flex gap-2 animate-fade-in">
        <select id="budget-month" value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border outline-none flex-1 bg-white dark:bg-[#12131a]"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select id="budget-year" value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border outline-none bg-white dark:bg-[#12131a]"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in">
        <div className="card rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Budget</p>
          <p className="text-sm font-extrabold mt-1 text-indigo-500 dark:text-indigo-400">{formatCurrency(totalBudget, currencySymbol)}</p>
        </div>
        <div className="card rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Spent</p>
          <p className="text-sm font-extrabold mt-1 text-rose-500">{formatCurrency(totalSpent, currencySymbol)}</p>
        </div>
        <div className="card rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Remaining</p>
          <p className={cn('text-sm font-extrabold mt-1', totalBudget - totalSpent >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
            {formatCurrency(Math.abs(totalBudget - totalSpent), currencySymbol)}
          </p>
        </div>
      </div>

      {/* Over budget alert */}
      {overBudgetCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border animate-fade-in bg-rose-500/5 dark:bg-rose-500/10"
          style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            {overBudgetCount} categor{overBudgetCount > 1 ? 'ies' : 'y'} exceeded budget this month!
          </p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card rounded-2xl p-5 flex flex-col gap-4 animate-scale-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Set Budget</h3>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableCategories.map(cat => {
                const isSelected = categoryId === cat.id;
                return (
                  <button key={cat.id} type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-150',
                      isSelected 
                        ? 'shadow-sm' 
                        : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                    style={{
                      background: isSelected ? `${cat.color}15` : 'var(--muted)',
                      borderColor: isSelected ? cat.color : '',
                    }}>
                    <CategoryIcon 
                      icon={cat.icon} 
                      color={isSelected ? cat.color : 'var(--muted-foreground)'} 
                      size={16} 
                    />
                    <span className="text-[10px] font-semibold text-center leading-tight transition-colors duration-150"
                      style={{ color: isSelected ? cat.color : 'var(--foreground)' }}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
              {availableCategories.length === 0 && (
                <p className="col-span-4 text-xs text-center py-4 text-slate-400 dark:text-slate-500">All categories have budgets!</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Monthly Limit (LKR)</label>
            <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--muted)] transition-all duration-200 focus-within:border-indigo-500 focus-within:bg-[var(--card)] focus-within:ring-2 focus-within:ring-indigo-500/15">
              <span className="pl-4 pr-2 font-bold text-slate-400 dark:text-slate-500 select-none">Rs.</span>
              <input id="budget-amount" type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required
                className="w-full pr-4 py-3 bg-transparent text-sm outline-none border-0 focus:ring-0 focus:!ring-0 focus:!border-0 focus:!border-transparent focus:!bg-transparent focus:!shadow-none"
                style={{ color: 'var(--foreground)' }} />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="btn-secondary flex-1 !py-2.5 text-sm">Cancel</button>
            <button id="save-budget-btn" type="submit" disabled={loading}
              className="btn-primary flex-1 !py-2.5 text-sm flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      )}

      {/* Budget cards */}
      <div className="flex flex-col gap-3 animate-fade-in">
        {budgetsWithSpending.length === 0 ? (
          <div className="card rounded-2xl p-12 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No budgets set</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Set monthly category budgets to track your spending</p>
          </div>
        ) : budgetsWithSpending.map(b => {
          const status = getBudgetStatus(b.spent ?? 0, b.amount);
          const remaining = b.amount - (b.spent ?? 0);
          return (
            <div key={b.id} className="card rounded-2xl p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={b.category?.icon ?? 'circle-dot'} color={b.category?.color ?? '#6366f1'} withBackground size={18} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{b.category?.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {formatCurrency(b.spent ?? 0, currencySymbol)} of {formatCurrency(b.amount, currencySymbol)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {status.status === 'danger' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  <span className="text-sm font-bold" style={{ color: status.color }}>
                    {remaining >= 0 ? formatCurrency(remaining, currencySymbol) : `-${formatCurrency(Math.abs(remaining), currencySymbol)}`}
                  </span>
                  <button onClick={() => handleDelete(b.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors ml-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${status.percentage}%`, background: status.color }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                  {status.status === 'danger' ? '⚠️ Over budget!' : `${status.percentage.toFixed(0)}% used`}
                </span>
                <span className="text-[10px] font-medium" style={{ color: status.color }}>
                  {remaining >= 0 ? `${formatCurrency(remaining, currencySymbol)} left` : 'Exceeded!'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

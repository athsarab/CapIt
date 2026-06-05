'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/lib/context/AppContext';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { STUDENT_TEMPLATES, WORKER_TEMPLATES, COMMON_TEMPLATES } from '@/lib/constants/categories';
import { formatCurrency, toISODateString } from '@/lib/utils/finance';
import { ArrowLeft, Loader2, Zap, GraduationCap, Briefcase } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';
import { TransactionType } from '@/lib/types';
import { getBudgetStatus } from '@/lib/utils/finance';
import { getCurrentMonthYear } from '@/lib/utils/finance';

export default function NewTransactionPage() {
  const router = useRouter();
  const supabase = createClient();
  const { categories, transactions, budgets, currencySymbol, refreshTransactions } = useApp();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(toISODateString(new Date()));
  const [loading, setLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<'student' | 'worker' | 'common' | null>(null);

  const filteredCategories = categories.filter(c => c.type === type || c.type === 'both');

  // Recent suggestions
  const recentDescriptions = [...new Set(
    transactions.filter(t => t.type === type).slice(0, 20).map(t => t.description)
  )].slice(0, 5);

  // Budget warning
  const { month, year } = getCurrentMonthYear();
  const selectedCategory = categories.find(c => c.id === categoryId);
  const matchingBudget = budgets.find(b =>
    b.category_id === categoryId && b.month === month && b.year === year
  );
  const budgetSpent = transactions
    .filter(t => t.type === 'expense' && t.category_id === categoryId && new Date(t.date).getMonth() + 1 === month && new Date(t.date).getFullYear() === year)
    .reduce((s, t) => s + t.amount, 0);
  const budgetStatus = matchingBudget ? getBudgetStatus(budgetSpent + (parseFloat(amount) || 0), matchingBudget.amount) : null;

  function applyTemplate(tmpl: typeof STUDENT_TEMPLATES[0]) {
    setDescription(tmpl.description);
    setAmount(tmpl.amount.toString());
    const cat = categories.find(c => c.name === tmpl.category_name);
    if (cat) setCategoryId(cat.id);
    setType('expense');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { toast.error('Please select a category'); return; }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { toast.error('Enter a valid amount'); return; }

    if (budgetStatus?.status === 'danger') {
      toast.error(`⚠️ Over budget! You\'ve exceeded your ${selectedCategory?.name} budget.`, { duration: 4000 });
    } else if (budgetStatus?.status === 'warning') {
      toast(`⚠️ Approaching budget limit for ${selectedCategory?.name}`, { icon: '⚠️' });
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('transactions').insert({
      user_id: user!.id,
      type,
      amount: numAmount,
      description,
      notes: notes || null,
      category_id: categoryId,
      date,
    });

    if (error) {
      toast.error('Failed to save transaction');
    } else {
      toast.success('Transaction added!');
      await refreshTransactions();
      router.push('/transactions');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/transactions" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ color: 'var(--muted-foreground)' }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Add Transaction</h1>
      </div>

      {/* Quick Templates */}
      <div className="card rounded-2xl p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Quick Add Templates</span>
        </div>
        <div className="flex gap-2 mb-3">
          {([['student', 'Student', GraduationCap], ['worker', 'Worker', Briefcase], ['common', 'Common', Zap]] as const).map(([key, label, Icon]) => (
            <button key={key} type="button" id={`template-${key}`}
              onClick={() => setActiveTemplate(activeTemplate === key ? null : key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all border',
                activeTemplate === key 
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-transparent shadow-sm' 
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#161824] dark:hover:bg-[#1e202f] border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400'
              )}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {activeTemplate && (
          <div className="grid grid-cols-2 gap-2">
            {(activeTemplate === 'student' ? STUDENT_TEMPLATES : activeTemplate === 'worker' ? WORKER_TEMPLATES : COMMON_TEMPLATES).map(tmpl => {
              const cat = categories.find(c => c.name === tmpl.category_name);
              return (
                <button key={tmpl.id} type="button" id={`tmpl-${tmpl.id}`}
                  onClick={() => applyTemplate(tmpl)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all hover:border-indigo-400/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 bg-slate-50/50 dark:bg-[#161824]/50 border-slate-100 dark:border-slate-800/80">
                  {cat && <CategoryIcon icon={cat.icon} color={cat.color} size={14} />}
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate text-slate-800 dark:text-slate-200">{tmpl.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{formatCurrency(tmpl.amount, currencySymbol)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="card rounded-2xl p-5 flex flex-col gap-4 animate-fade-in">
        {/* Type toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-900/50">
          {(['expense', 'income'] as TransactionType[]).map(t => (
            <button key={t} type="button" id={`type-${t}`}
              onClick={() => { setType(t); setCategoryId(''); }}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize', 
                type === t 
                  ? t === 'income' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'bg-rose-500 text-white shadow-sm' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
              )}>
              {t === 'income' ? '↑ Income' : '↓ Expense'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Amount (LKR)</label>
          <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--muted)] transition-all duration-200 focus-within:border-indigo-500 focus-within:bg-[var(--card)] focus-within:ring-2 focus-within:ring-indigo-500/15">
            <span className="pl-4 pr-2 font-bold text-slate-400 dark:text-slate-500 select-none">Rs.</span>
            <input
              id="amount-input"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full pr-4 py-3 bg-transparent text-lg font-bold outline-none border-0 focus:ring-0 focus:!ring-0 focus:!border-0 focus:!border-transparent focus:!bg-transparent focus:!shadow-none"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Description</label>
          <input
            id="description-input"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What was this for?"
            required
            list="desc-suggestions"
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
          <datalist id="desc-suggestions">
            {recentDescriptions.map(d => <option key={d} value={d} />)}
          </datalist>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Category</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {filteredCategories.map(cat => {
              const isSelected = categoryId === cat.id;
              return (
                <button key={cat.id} type="button" id={`cat-${cat.id}`}
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
                    size={18} 
                  />
                  <span className="text-[10px] font-semibold text-center leading-tight transition-colors duration-150"
                    style={{ color: isSelected ? cat.color : 'var(--foreground)' }}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget warning */}
        {budgetStatus && type === 'expense' && (budgetStatus.status === 'warning' || budgetStatus.status === 'danger') && (
          <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm', budgetStatus.status === 'danger' ? 'bg-red-50 dark:bg-red-950/30 text-red-600' : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600')}>
            <span>⚠️</span>
            {budgetStatus.status === 'danger'
              ? `You'll exceed your ${selectedCategory?.name} budget!`
              : `You'll reach ${budgetStatus.percentage.toFixed(0)}% of your ${selectedCategory?.name} budget`}
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Date</label>
          <input
            id="date-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Notes (optional)</label>
          <textarea
            id="notes-input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional notes..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all resize-none"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <button
          id="save-transaction-btn"
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Saving...' : 'Save Transaction'}
        </button>
      </form>
    </div>
  );
}

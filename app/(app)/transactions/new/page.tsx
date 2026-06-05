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
    <div className="max-w-lg mx-auto space-y-4">
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
          <Zap className="w-4 h-4" style={{ color: '#6366f1' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Quick Add Templates</span>
        </div>
        <div className="flex gap-2 mb-3">
          {([['student', 'Student', GraduationCap], ['worker', 'Worker', Briefcase], ['common', 'Common', Zap]] as const).map(([key, label, Icon]) => (
            <button key={key} id={`template-${key}`}
              onClick={() => setActiveTemplate(activeTemplate === key ? null : key)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all', activeTemplate === key ? 'text-white' : '')}
              style={activeTemplate === key ? { background: '#6366f1' } : { background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
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
                <button key={tmpl.id} id={`tmpl-${tmpl.id}`}
                  onClick={() => applyTemplate(tmpl)}
                  className="flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                  style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                  {cat && <CategoryIcon icon={cat.icon} color={cat.color} size={14} />}
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{tmpl.label}</p>
                    <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{formatCurrency(tmpl.amount, currencySymbol)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="card rounded-2xl p-5 space-y-4 animate-fade-in">
        {/* Type toggle */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--muted)' }}>
          {(['expense', 'income'] as TransactionType[]).map(t => (
            <button key={t} type="button" id={`type-${t}`}
              onClick={() => { setType(t); setCategoryId(''); }}
              className={cn('flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize', type === t ? 'text-white shadow-md' : '')}
              style={type === t ? { background: t === 'income' ? '#22c55e' : '#ef4444' } : { color: 'var(--muted-foreground)' }}>
              {t === 'income' ? '↑ Income' : '↓ Expense'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Amount (LKR)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold" style={{ color: 'var(--muted-foreground)' }}>Rs.</span>
            <input
              id="amount-input"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full pl-12 pr-4 py-3 rounded-xl text-lg font-bold border outline-none transition-all"
              style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Description</label>
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
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Category</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {filteredCategories.map(cat => (
              <button key={cat.id} type="button" id={`cat-${cat.id}`}
                onClick={() => setCategoryId(cat.id)}
                className={cn('flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all', categoryId === cat.id ? 'border-2' : 'hover:border-slate-300')}
                style={{
                  borderColor: categoryId === cat.id ? cat.color : 'var(--border)',
                  background: categoryId === cat.id ? `${cat.color}18` : 'var(--muted)',
                }}>
                <CategoryIcon icon={cat.icon} color={cat.color} size={18} />
                <span className="text-[10px] font-medium text-center leading-tight" style={{ color: 'var(--foreground)' }}>{cat.name}</span>
              </button>
            ))}
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
          className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Saving...' : 'Save Transaction'}
        </button>
      </form>
    </div>
  );
}

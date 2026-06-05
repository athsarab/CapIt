'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatCurrency, formatDate, getNextDueDate, toISODateString } from '@/lib/utils/finance';
import { RECURRING_TEMPLATES } from '@/lib/constants/categories';
import { Plus, Trash2, RefreshCw, Loader2, Calendar, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { RecurringFrequency } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly',
};
const FREQ_COLORS: Record<RecurringFrequency, string> = {
  daily: '#ef4444', weekly: '#f97316', monthly: '#6366f1', yearly: '#8b5cf6',
};

export default function RecurringPage() {
  const supabase = createClient();
  const { recurringExpenses, categories, currencySymbol, refreshRecurring } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(toISODateString(new Date()));
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

  function applyTemplate(tmpl: typeof RECURRING_TEMPLATES[0]) {
    setDescription(tmpl.description);
    setAmount(tmpl.amount.toString());
    setFrequency(tmpl.frequency as RecurringFrequency);
    const cat = categories.find(c => c.name === tmpl.category_name);
    if (cat) setCategoryId(cat.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { toast.error('Select a category'); return; }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { toast.error('Enter valid amount'); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const nextDue = getNextDueDate(frequency, new Date(startDate));

    const { error } = await supabase.from('recurring_expenses').insert({
      user_id: user!.id,
      description, amount: num, frequency,
      start_date: startDate,
      next_due_date: startDate, // Will be processed on next check
      category_id: categoryId,
      notes: notes || null,
    });

    if (error) { toast.error('Failed to save'); }
    else {
      toast.success('Recurring expense added!');
      setShowForm(false);
      setDescription(''); setAmount(''); setNotes(''); setCategoryId('');
      refreshRecurring();
    }
    setLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('recurring_expenses').update({ is_active: !current }).eq('id', id);
    refreshRecurring();
    toast.success(current ? 'Paused' : 'Activated');
  }

  async function handleDelete(id: string, desc: string) {
    if (!confirm(`Delete "${desc}"?`)) return;
    await supabase.from('recurring_expenses').delete().eq('id', id);
    toast.success('Deleted');
    refreshRecurring();
  }

  const active = recurringExpenses.filter(r => r.is_active);
  const inactive = recurringExpenses.filter(r => !r.is_active);
  const totalMonthly = active
    .filter(r => r.frequency === 'monthly')
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Recurring Expenses</h1>
        <button id="add-recurring-btn" onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg hover:opacity-90 active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in">
        <div className="card rounded-xl p-4">
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Active Recurring</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{active.length}</p>
        </div>
        <div className="card rounded-xl p-4">
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Monthly Commitment</p>
          <p className="text-lg font-bold mt-1 text-indigo-500">{formatCurrency(totalMonthly, currencySymbol)}</p>
        </div>
      </div>

      {/* Quick templates */}
      {!showForm && (
        <div className="card rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Quick Templates</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {RECURRING_TEMPLATES.map(tmpl => (
              <button key={tmpl.description} id={`rec-tmpl-${tmpl.description.replace(/\s/g, '-').toLowerCase()}`}
                onClick={() => applyTemplate(tmpl)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:border-indigo-400 transition-all"
                style={{ borderColor: 'var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }}>
                {tmpl.description}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card rounded-2xl p-5 space-y-4 animate-scale-in">
          <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>New Recurring Expense</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Description</label>
              <input id="rec-description" value={description} onChange={e => setDescription(e.target.value)} required placeholder="e.g. Rent"
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Amount (Rs.)</label>
              <input id="rec-amount" type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Frequency</label>
              <select id="rec-frequency" value={frequency} onChange={e => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Start Date</label>
              <input id="rec-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Category</label>
            <div className="grid grid-cols-4 gap-2">
              {expenseCategories.slice(0, 12).map(cat => (
                <button key={cat.id} type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn('flex flex-col items-center gap-1 p-2 rounded-xl border transition-all')}
                  style={{ borderColor: categoryId === cat.id ? cat.color : 'var(--border)', background: categoryId === cat.id ? `${cat.color}18` : 'var(--muted)' }}>
                  <CategoryIcon icon={cat.icon} color={cat.color} size={14} />
                  <span className="text-[9px] text-center leading-tight" style={{ color: 'var(--foreground)' }}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Cancel</button>
            <button id="save-recurring-btn" type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Recurring list */}
      <div className="space-y-3 animate-fade-in">
        {[...active, ...inactive].map(r => {
          const cat = r.category;
          const dueDate = new Date(r.next_due_date);
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const isDue = dueDate <= today;

          return (
            <div key={r.id} className={cn('card rounded-2xl p-4 transition-all', !r.is_active && 'opacity-50')}>
              <div className="flex items-center gap-3">
                <CategoryIcon icon={cat?.icon ?? 'repeat'} color={cat?.color ?? '#6366f1'} withBackground size={18} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{r.description}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: `${FREQ_COLORS[r.frequency]}20`, color: FREQ_COLORS[r.frequency] }}>
                      {FREQ_LABELS[r.frequency]}
                    </span>
                    {isDue && r.is_active && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
                        Due Today
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Calendar className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Next: {formatDate(r.next_due_date)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-red-500">{formatCurrency(r.amount, currencySymbol)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => toggleActive(r.id, r.is_active)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ color: r.is_active ? '#f97316' : '#22c55e' }}>
                  {r.is_active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                  {r.is_active ? 'Pause' : 'Activate'}
                </button>
                <button onClick={() => handleDelete(r.id, r.description)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        {recurringExpenses.length === 0 && (
          <div className="card rounded-2xl p-12 text-center">
            <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No recurring expenses yet</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Add bills, rent, and subscriptions to auto-track them monthly</p>
          </div>
        )}
      </div>
    </div>
  );
}

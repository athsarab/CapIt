'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatCurrency, formatDate } from '@/lib/utils/finance';
import { SAVINGS_GOAL_ICONS, GOAL_COLORS } from '@/lib/constants/categories';
import { Plus, Target, Trash2, Loader2, Pencil, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';
import { SavingsGoal } from '@/lib/types';

function GoalCard({ goal, onDelete, onEdit, currencySymbol }: {
  goal: SavingsGoal; onDelete: (id: string) => void; onEdit: (g: SavingsGoal) => void; currencySymbol: string;
}) {
  const pct = Math.min(100, goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={cn('card rounded-2xl p-5 animate-fade-in relative overflow-hidden', goal.is_completed && 'border')}
      style={{ borderColor: goal.is_completed ? goal.color : undefined }}>
      {goal.is_completed && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="w-5 h-5" style={{ color: goal.color }} />
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width="80" height="80" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="var(--border)" strokeWidth="5" />
            <circle cx="44" cy="44" r="36" fill="none" stroke={goal.color} strokeWidth="5"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 44 44)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{pct.toFixed(0)}%</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CategoryIcon icon={goal.icon} color={goal.color} size={15} />
            <h3 className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>{goal.name}</h3>
          </div>
          <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
            {formatCurrency(goal.current_amount, currencySymbol)} of {formatCurrency(goal.target_amount, currencySymbol)}
          </p>
          {goal.target_date && (
            <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>🎯 Target: {formatDate(goal.target_date)}</p>
          )}
          <div className="progress-bar mt-2">
            <div className="progress-fill" style={{ width: `${pct}%`, background: goal.color }} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => onEdit(goal)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          style={{ color: 'var(--muted-foreground)' }}>
          <Pencil className="w-3.5 h-3.5" /> Edit / Add Funds
        </button>
        <button onClick={() => onDelete(goal.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function SavingsPage() {
  const supabase = createClient();
  const { savingsGoals, currencySymbol, refreshSavings } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('piggy-bank');
  const [color, setColor] = useState('#6366f1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  function openEdit(goal: SavingsGoal) {
    setEditGoal(goal);
    setName(goal.name); setTargetAmount(goal.target_amount.toString());
    setCurrentAmount(goal.current_amount.toString()); setTargetDate(goal.target_date ?? '');
    setIcon(goal.icon); setColor(goal.color); setNotes(goal.notes ?? '');
    setShowForm(true);
  }

  function resetForm() {
    setEditGoal(null); setName(''); setTargetAmount(''); setCurrentAmount('');
    setTargetDate(''); setIcon('piggy-bank'); setColor('#6366f1'); setNotes('');
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;
    if (isNaN(target) || target <= 0) { toast.error('Enter valid target amount'); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      name, target_amount: target, current_amount: current,
      target_date: targetDate || null, icon, color, notes: notes || null,
      is_completed: current >= target,
    };

    if (editGoal) {
      const { error } = await supabase.from('savings_goals').update(payload).eq('id', editGoal.id);
      if (error) toast.error('Failed to update'); else toast.success('Goal updated!');
    } else {
      const { error } = await supabase.from('savings_goals').insert({ ...payload, user_id: user!.id });
      if (error) toast.error('Failed to save'); else toast.success('Goal created!');
    }
    await refreshSavings();
    resetForm();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this savings goal?')) return;
    await supabase.from('savings_goals').delete().eq('id', id);
    toast.success('Deleted'); refreshSavings();
  }

  const totalSaved = savingsGoals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = savingsGoals.reduce((s, g) => s + g.target_amount, 0);
  const completed = savingsGoals.filter(g => g.is_completed).length;

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Savings Goals</h1>
        <button id="add-goal-btn" onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 !px-4 !py-2.5 text-sm">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in">
        <div className="card rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Goals</p>
          <p className="text-sm font-extrabold mt-1" style={{ color: 'var(--foreground)' }}>{savingsGoals.length}</p>
        </div>
        <div className="card rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Saved</p>
          <p className="text-sm font-extrabold mt-1 text-emerald-500">{formatCurrency(totalSaved, currencySymbol)}</p>
        </div>
        <div className="card rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Completed</p>
          <p className="text-sm font-extrabold mt-1 text-indigo-500 dark:text-indigo-400">{completed}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card rounded-2xl p-5 flex flex-col gap-4 animate-scale-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {editGoal ? 'Edit Goal / Add Funds' : 'New Savings Goal'}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Goal Name</label>
              <input id="goal-name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. New Phone"
                className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all"
                style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Target Amount (LKR)</label>
              <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--muted)] transition-all duration-200 focus-within:border-indigo-500 focus-within:bg-[var(--card)] focus-within:ring-2 focus-within:ring-indigo-500/15">
                <span className="pl-3 pr-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 select-none">Rs.</span>
                <input id="goal-target" type="number" step="0.01" min="0" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0.00" required
                  className="w-full pr-3 py-2 bg-transparent text-sm outline-none border-0 focus:ring-0 focus:!ring-0 focus:!border-0 focus:!border-transparent focus:!bg-transparent focus:!shadow-none"
                  style={{ color: 'var(--foreground)' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Saved So Far (LKR)</label>
              <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--muted)] transition-all duration-200 focus-within:border-indigo-500 focus-within:bg-[var(--card)] focus-within:ring-2 focus-within:ring-indigo-500/15">
                <span className="pl-3 pr-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 select-none">Rs.</span>
                <input id="goal-current" type="number" step="0.01" min="0" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0.00"
                  className="w-full pr-3 py-2 bg-transparent text-sm outline-none border-0 focus:ring-0 focus:!ring-0 focus:!border-0 focus:!border-transparent focus:!bg-transparent focus:!shadow-none"
                  style={{ color: 'var(--foreground)' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Target Date (optional)</label>
              <input id="goal-date" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all"
                style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {SAVINGS_GOAL_ICONS.map(({ icon: ic, label }) => (
                <button key={ic} type="button"
                  onClick={() => setIcon(ic)}
                  className={cn('w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-150')}
                  style={{ borderColor: icon === ic ? color : 'var(--border)', background: icon === ic ? `${color}15` : 'var(--muted)' }}
                  title={label}>
                  <CategoryIcon icon={ic} color={icon === ic ? color : 'var(--muted-foreground)'} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('w-7 h-7 rounded-full border border-transparent transition-all duration-150', color === c ? 'scale-110 shadow-sm border-slate-400 dark:border-slate-200' : '')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={resetForm}
              className="btn-secondary flex-1 !py-2.5 text-sm">Cancel</button>
            <button id="save-goal-btn" type="submit" disabled={loading}
              className="btn-primary flex-1 !py-2.5 text-sm flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Saving...' : editGoal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      )}

      {/* Goals grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
        {savingsGoals.length === 0 ? (
          <div className="col-span-2 card rounded-2xl p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No savings goals yet</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Start saving towards your dreams</p>
          </div>
        ) : savingsGoals.map(goal => (
          <GoalCard key={goal.id} goal={goal} onDelete={handleDelete} onEdit={openEdit} currencySymbol={currencySymbol} />
        ))}
      </div>
    </div>
  );
}

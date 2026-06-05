'use client';

import { useApp } from '@/lib/context/AppContext';
import { calculateFinancialSummary, buildMonthlyData, formatCurrency, formatRelativeDate, getHealthLabel, getCategorySpending, formatCompact } from '@/lib/utils/finance';
import { getCurrentMonthYear } from '@/lib/utils/finance';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils/cn';

function HealthScoreCard({ score }: { score: number }) {
  const { label, color, description } = getHealthLabel(score);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="card p-5 rounded-2xl animate-fade-in delay-300">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Financial Health</h3>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width="90" height="90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="5" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={color} strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{score}</span>
            <span className="text-[9px]" style={{ color: 'var(--muted-foreground)' }}>/ 100</span>
          </div>
        </div>
        <div>
          <p className="text-base font-bold" style={{ color }}>{label}</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { transactions, budgets, savingsGoals, currencySymbol, isLoading, recurringExpenses } = useApp();
  const { month, year } = getCurrentMonthYear();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-8 skeleton w-48 mb-6" />
        <div className="h-36 skeleton rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-64 skeleton rounded-2xl lg:col-span-2" />
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const summary = calculateFinancialSummary(transactions, month, year);
  const monthlyData = buildMonthlyData(transactions, 6);
  const categorySpending = getCategorySpending(transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  }));
  const recentTx = transactions.slice(0, 5);

  // Overdue recurring
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueDue = recurringExpenses.filter(r => {
    const d = new Date(r.next_due_date);
    d.setHours(0, 0, 0, 0);
    return r.is_active && d <= today;
  });

  return (
    <div className="flex flex-col gap-5 max-w-7xl">
      {/* Heading */}
      <div className="animate-fade-in flex flex-col md:flex-row md:items-center md:justify-between gap-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Dashboard</h1>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {new Date().toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Recurring alert */}
      {overdueDue.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border animate-fade-in bg-rose-500/5 dark:bg-rose-500/10"
          style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
            <span className="font-bold">{overdueDue.length} recurring expense{overdueDue.length > 1 ? 's' : ''}</span> was auto-added today.
          </p>
        </div>
      )}

      {/* Main Available Balance Card */}
      <div className="card rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-slate-950 dark:to-zinc-950 text-white shadow-xl animate-fade-in border-0">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full opacity-20 bg-indigo-500 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 rounded-full opacity-10 bg-purple-500 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200/60">Available Balance</span>
          <p className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
            {formatCurrency(summary.balance, currencySymbol)}
          </p>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10 text-xs text-indigo-200/70">
            <span>Financial Health:</span>
            <span className={cn(
              "font-bold px-2 py-0.5 rounded-full text-[9px]",
              summary.healthScore >= 70 ? "bg-emerald-500/20 text-emerald-400" :
              summary.healthScore >= 40 ? "bg-amber-500/20 text-amber-400" :
              "bg-rose-500/20 text-rose-400"
            )}>
              {summary.healthScore} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Grid of secondary statistics */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in delay-100">
        <div className="card rounded-2xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider uppercase">Income</span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {formatCompact(summary.totalIncome, currencySymbol)}
          </p>
        </div>

        <div className="card rounded-2xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 flex-shrink-0">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider uppercase">Expenses</span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {formatCompact(summary.totalExpenses, currencySymbol)}
          </p>
        </div>

        <div className="card rounded-2xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <div className="w-5 h-5 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 flex-shrink-0">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider uppercase">Savings</span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {formatCompact(summary.savings, currencySymbol)}
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Bar Chart */}
        <div className="card rounded-2xl p-5 lg:col-span-2 animate-fade-in delay-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Income vs Expenses (6 months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={10} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={40} />
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value) || 0, currencySymbol), '']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Health Score */}
        <HealthScoreCard score={summary.healthScore} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent transactions */}
        <div className="card rounded-2xl p-5 animate-fade-in delay-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Recent Transactions</h3>
            <Link href="/transactions" className="text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              style={{ color: '#6366f1' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentTx.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                No transactions yet.<br />
                <Link href="/transactions/new" className="text-indigo-500 hover:underline">Add your first one →</Link>
              </p>
            ) : recentTx.map(tx => (
              <div key={tx.id} className="flex items-center gap-3">
                <CategoryIcon icon={tx.category?.icon ?? 'circle-dot'} color={tx.category?.color ?? '#94a3b8'} withBackground size={18} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{tx.description}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{formatRelativeDate(tx.date)}</p>
                </div>
                <span className={cn('text-sm font-bold flex-shrink-0', tx.type === 'income' ? 'text-green-500' : 'text-red-500')}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category spending pie */}
        <div className="card rounded-2xl p-5 animate-fade-in delay-400">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Spending by Category</h3>
          {categorySpending.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>No expense data yet</p>
          ) : (
            <div className="flex gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={categorySpending} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    dataKey="amount" paddingAngle={2}>
                    {categorySpending.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [formatCurrency(Number(v) || 0, currencySymbol), '']}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-40">
                {categorySpending.slice(0, 6).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-xs truncate flex-1" style={{ color: 'var(--foreground)' }}>{cat.name}</span>
                    <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Savings Goals preview */}
      {savingsGoals.length > 0 && (
        <div className="card rounded-2xl p-5 animate-fade-in delay-400">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Savings Goals</h3>
            <Link href="/savings" className="text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#6366f1' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savingsGoals.slice(0, 3).map(goal => {
              const pct = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
              return (
                <div key={goal.id} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryIcon icon={goal.icon} color={goal.color} withBackground size={14} />
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{goal.name}</span>
                  </div>
                  <div className="progress-bar mb-1.5">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: goal.color }} />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <span>{formatCompact(goal.current_amount, currencySymbol)}</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

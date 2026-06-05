'use client';

import { useApp } from '@/lib/context/AppContext';
import { calculateFinancialSummary, buildMonthlyData, formatCurrency, formatRelativeDate, getHealthLabel, getCategorySpending, formatCompact } from '@/lib/utils/finance';
import { getCurrentMonthYear } from '@/lib/utils/finance';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils/cn';

function SummaryCard({
  label, value, icon: Icon, gradient, trend, trendValue, delay = '0ms'
}: {
  label: string; value: string; icon: React.ElementType;
  gradient: string; trend?: 'up' | 'down'; trendValue?: string; delay?: string;
}) {
  return (
    <div className="rounded-2xl p-5 text-white shadow-lg animate-fade-in flex flex-col gap-3 relative overflow-hidden"
      style={{ background: gradient, animationDelay: delay }}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
        style={{ background: 'rgba(255,255,255,0.5)', transform: 'translate(30%, -30%)' }} />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium opacity-80">{label}</span>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {trend && trendValue && (
        <div className="flex items-center gap-1 text-xs opacity-80">
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trendValue} this month
        </div>
      )}
    </div>
  );
}

function HealthScoreCard({ score }: { score: number }) {
  const { label, color, description } = getHealthLabel(score);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="card p-5 rounded-2xl animate-fade-in delay-300">
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted-foreground)' }}>Financial Health</h3>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={color} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{score}</span>
            <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>/ 100</span>
          </div>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color }}>{label}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
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
      <div className="space-y-4">
        <div className="h-8 skeleton w-48 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
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
    <div className="space-y-5 max-w-7xl">
      {/* Heading */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {new Date().toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Recurring alert */}
      {overdueDue.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border animate-fade-in"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            <span className="font-semibold">{overdueDue.length} recurring expense{overdueDue.length > 1 ? 's' : ''}</span> were auto-added today.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Income" value={formatCompact(summary.totalIncome, currencySymbol)}
          icon={TrendingUp} gradient="linear-gradient(135deg, #22c55e, #16a34a)"
          delay="0ms"
        />
        <SummaryCard
          label="Expenses" value={formatCompact(summary.totalExpenses, currencySymbol)}
          icon={TrendingDown} gradient="linear-gradient(135deg, #ef4444, #dc2626)"
          delay="100ms"
        />
        <SummaryCard
          label="Balance" value={formatCompact(summary.balance, currencySymbol)}
          icon={Wallet} gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
          delay="200ms"
        />
        <SummaryCard
          label="Savings" value={formatCompact(summary.savings, currencySymbol)}
          icon={PiggyBank} gradient="linear-gradient(135deg, #0ea5e9, #0284c7)"
          delay="300ms"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Bar Chart */}
        <div className="card rounded-2xl p-5 lg:col-span-2 animate-fade-in delay-200">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted-foreground)' }}>Income vs Expenses (6 months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={10} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={40} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value, currencySymbol), '']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
              />
              <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
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
            <h3 className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>Recent Transactions</h3>
            <Link href="/transactions" className="text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all"
              style={{ color: '#6366f1' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
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
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted-foreground)' }}>Spending by Category</h3>
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
                    formatter={(v: number) => [formatCurrency(v, currencySymbol), '']}
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
            <h3 className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>Savings Goals</h3>
            <Link href="/savings" className="text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#6366f1' }}>
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

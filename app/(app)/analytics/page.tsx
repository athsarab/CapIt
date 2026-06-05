'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import {
  buildMonthlyData, getCategorySpending, formatCurrency,
  calculateFinancialSummary, getMonthName
} from '@/lib/utils/finance';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Area, AreaChart,
} from 'recharts';
import { cn } from '@/lib/utils/cn';
import { getCurrentMonthYear } from '@/lib/utils/finance';

type ChartTab = 'spending' | 'trend' | 'savings' | 'comparison';

export default function AnalyticsPage() {
  const { transactions, currencySymbol, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState<ChartTab>('spending');
  const { month, year } = getCurrentMonthYear();

  const monthlyData = useMemo(() => buildMonthlyData(transactions, 12), [transactions]);

  const thisMonthTx = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    }),
    [transactions, month, year]
  );

  const categorySpending = useMemo(() => getCategorySpending(thisMonthTx), [thisMonthTx]);

  const summary = useMemo(() => calculateFinancialSummary(transactions, month, year), [transactions, month, year]);

  const totalLabel = (v: number) => formatCurrency(v, currencySymbol);

  const tabs: { id: ChartTab; label: string }[] = [
    { id: 'spending', label: 'Category Spending' },
    { id: 'trend', label: 'Monthly Trend' },
    { id: 'savings', label: 'Savings Trend' },
    { id: 'comparison', label: 'Comparison' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 skeleton w-40 mb-4" />
        <div className="h-96 skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Analytics</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{getMonthName(month)} {year} overview</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
        {[
          { label: 'Income', value: summary.totalIncome, color: '#22c55e' },
          { label: 'Expenses', value: summary.totalExpenses, color: '#ef4444' },
          { label: 'Balance', value: summary.balance, color: '#6366f1' },
          { label: 'Savings Rate', value: summary.totalIncome > 0 ? (summary.savings / summary.totalIncome * 100) : 0, color: '#0ea5e9', isPercent: true },
        ].map(({ label, value, color, isPercent }) => (
          <div key={label} className="card rounded-xl p-3 text-center">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
            <p className="text-base font-bold mt-1" style={{ color }}>
              {isPercent ? `${value.toFixed(1)}%` : formatCurrency(value, currencySymbol)}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="animate-fade-in">
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--muted)' }}>
          {tabs.map(tab => (
            <button key={tab.id} id={`analytics-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn('flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all', activeTab === tab.id ? 'text-white shadow-md' : '')}
              style={activeTab === tab.id ? { background: '#6366f1' } : { color: 'var(--muted-foreground)' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="card rounded-2xl p-5 animate-fade-in">
        {activeTab === 'spending' && (
          <>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Spending by Category – {getMonthName(month)} {year}
            </h3>
            {categorySpending.length === 0 ? (
              <p className="text-center py-16 text-sm" style={{ color: 'var(--muted-foreground)' }}>No expense data for this month</p>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ResponsiveContainer width={260} height={260}>
                  <PieChart>
                    <Pie data={categorySpending} cx="50%" cy="50%" outerRadius={110} innerRadius={55}
                      dataKey="amount" paddingAngle={3} nameKey="name">
                      {categorySpending.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [totalLabel(v), 'Amount']}
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 w-full space-y-2">
                  {categorySpending.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <span className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>{cat.name}</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{formatCurrency(cat.amount, currencySymbol)}</span>
                      <span className="text-xs w-10 text-right" style={{ color: 'var(--muted-foreground)' }}>{cat.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'trend' && (
          <>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted-foreground)' }}>Income vs Expenses (12 months)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} barSize={12} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={40} />
                <Tooltip formatter={(v: number) => [totalLabel(v), '']}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                  labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeTab === 'savings' && (
          <>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted-foreground)' }}>Savings Trend (12 months)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={40} />
                <Tooltip formatter={(v: number) => [totalLabel(v), 'Savings']}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }} />
                <Area type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={2.5} fill="url(#savingsGrad)" dot={{ fill: '#6366f1', r: 4 }} name="Savings" />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}

        {activeTab === 'comparison' && (
          <>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted-foreground)' }}>Category Spending Comparison</h3>
            {categorySpending.length === 0 ? (
              <p className="text-center py-16 text-sm" style={{ color: 'var(--muted-foreground)' }}>No expense data for this month</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categorySpending} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(v: number) => [totalLabel(v), 'Spent']}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} name="Amount">
                    {categorySpending.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </div>
    </div>
  );
}

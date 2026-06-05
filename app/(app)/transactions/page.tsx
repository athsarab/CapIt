'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatCurrency, formatDate } from '@/lib/utils/finance';
import { Plus, Search, Filter, ArrowUpCircle, ArrowDownCircle, Pencil, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';
import { Transaction } from '@/lib/types';

export default function TransactionsPage() {
  const { transactions, categories, currencySymbol, refreshTransactions } = useApp();
  const supabase = createClient();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category_id !== categoryFilter) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, search]);

  async function handleDelete(tx: Transaction) {
    if (!confirm(`Delete "${tx.description}"?`)) return;
    setDeleting(tx.id);
    const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Transaction deleted');
      refreshTransactions();
    }
    setDeleting(null);
  }

  // Group by date
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof transactions>();
    filtered.forEach(t => {
      const key = t.date;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Transactions</h1>
        <Link
          href="/transactions/new"
          id="add-transaction-btn"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.97] bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500"
        >
          <Plus className="w-4 h-4" /> Add
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in">
        <div className="card rounded-2xl p-3 flex items-center gap-3">
          <ArrowUpCircle className="w-7 h-7 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Income</p>
            <p className="text-sm font-bold text-emerald-500">{formatCurrency(totalIncome, currencySymbol)}</p>
          </div>
        </div>
        <div className="card rounded-2xl p-3 flex items-center gap-3">
          <ArrowDownCircle className="w-7 h-7 text-rose-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Expenses</p>
            <p className="text-sm font-bold text-rose-500">{formatCurrency(totalExpense, currencySymbol)}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card rounded-2xl p-4 flex flex-col gap-3 animate-fade-in">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            id="transaction-search"
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'income', 'expense'] as const).map(type => (
            <button
              key={type}
              id={`filter-${type}`}
              onClick={() => setTypeFilter(type)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize border',
                typeFilter === type 
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-transparent shadow-sm' 
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#161824] dark:hover:bg-[#1e202f] border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400'
              )}
            >
              {type === 'all' ? 'All' : type === 'income' ? '↑ Income' : '↓ Expense'}
            </button>
          ))}

          <select
            id="category-filter"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border outline-none bg-slate-50 dark:bg-[#161824] border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Transaction list */}
      <div className="flex flex-col gap-4 animate-fade-in">
        {grouped.length === 0 ? (
          <div className="card rounded-2xl p-12 text-center">
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No transactions found</p>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Add your first transaction to get started</p>
            <Link href="/transactions/new" className="text-indigo-500 text-sm hover:underline">+ Add Transaction</Link>
          </div>
        ) : grouped.map(([date, txs]) => (
          <div key={date}>
            <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--muted-foreground)' }}>{formatDate(date)}</p>
            <div className="card rounded-2xl divide-y" style={{ borderColor: 'var(--border)' }}>
              {txs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-4 first:rounded-t-2xl last:rounded-b-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <CategoryIcon icon={tx.category?.icon ?? 'circle-dot'} color={tx.category?.color ?? '#94a3b8'} withBackground size={18} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{tx.description}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {tx.category?.name ?? 'Uncategorized'}
                      {tx.notes ? ` · ${tx.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-bold flex-shrink-0', tx.type === 'income' ? 'text-green-500' : 'text-red-500')}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currencySymbol)}
                    </span>
                    <Link href={`/transactions/${tx.id}/edit`}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      style={{ color: 'var(--muted-foreground)' }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(tx)}
                      disabled={deleting === tx.id}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors text-red-500 disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

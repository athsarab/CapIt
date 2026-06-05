'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/lib/context/AppContext';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatCurrency } from '@/lib/utils/finance';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';
import { TransactionType } from '@/lib/types';

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const { categories, transactions, currencySymbol, refreshTransactions } = useApp();

  const tx = transactions.find(t => t.id === params.id);

  const [type, setType] = useState<TransactionType>(tx?.type ?? 'expense');
  const [amount, setAmount] = useState(tx?.amount?.toString() ?? '');
  const [description, setDescription] = useState(tx?.description ?? '');
  const [notes, setNotes] = useState(tx?.notes ?? '');
  const [categoryId, setCategoryId] = useState(tx?.category_id ?? '');
  const [date, setDate] = useState(tx?.date ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tx) {
      setType(tx.type);
      setAmount(tx.amount.toString());
      setDescription(tx.description);
      setNotes(tx.notes ?? '');
      setCategoryId(tx.category_id ?? '');
      setDate(tx.date);
    }
  }, [tx]);

  const filteredCategories = categories.filter(c => c.type === type || c.type === 'both');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { toast.error('Please select a category'); return; }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { toast.error('Enter a valid amount'); return; }

    setLoading(true);
    const { error } = await supabase.from('transactions').update({
      type, amount: numAmount, description, notes: notes || null, category_id: categoryId, date,
    }).eq('id', params.id as string);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success('Transaction updated!');
      await refreshTransactions();
      router.push('/transactions');
    }
    setLoading(false);
  }

  if (!tx) return (
    <div className="text-center py-12">
      <p style={{ color: 'var(--muted-foreground)' }}>Transaction not found.</p>
      <Link href="/transactions" className="text-indigo-500 hover:underline text-sm">Back to transactions</Link>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/transactions" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ color: 'var(--muted-foreground)' }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Transaction</h1>
      </div>

      <form onSubmit={handleSubmit} className="card rounded-2xl p-5 space-y-4 animate-fade-in">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--muted)' }}>
          {(['expense', 'income'] as TransactionType[]).map(t => (
            <button key={t} type="button"
              onClick={() => { setType(t); setCategoryId(''); }}
              className={cn('flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize', type === t ? 'text-white shadow-md' : '')}
              style={type === t ? { background: t === 'income' ? '#22c55e' : '#ef4444' } : { color: 'var(--muted-foreground)' }}>
              {t === 'income' ? '↑ Income' : '↓ Expense'}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Amount (LKR)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold" style={{ color: 'var(--muted-foreground)' }}>Rs.</span>
            <input id="edit-amount" type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required
              className="w-full pl-12 pr-4 py-3 rounded-xl text-lg font-bold border outline-none"
              style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Description</label>
          <input id="edit-description" type="text" value={description} onChange={e => setDescription(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Category</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {filteredCategories.map(cat => (
              <button key={cat.id} type="button"
                onClick={() => setCategoryId(cat.id)}
                className={cn('flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all', categoryId === cat.id ? 'border-2' : 'hover:border-slate-300')}
                style={{ borderColor: categoryId === cat.id ? cat.color : 'var(--border)', background: categoryId === cat.id ? `${cat.color}18` : 'var(--muted)' }}>
                <CategoryIcon icon={cat.icon} color={cat.color} size={18} />
                <span className="text-[10px] font-medium text-center leading-tight" style={{ color: 'var(--foreground)' }}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Date</label>
          <input id="edit-date" type="date" value={date} onChange={e => setDate(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Notes (optional)</label>
          <textarea id="edit-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
        </div>

        <button id="update-transaction-btn" type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Saving...' : 'Update Transaction'}
        </button>
      </form>
    </div>
  );
}

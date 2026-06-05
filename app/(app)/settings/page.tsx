'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useRouter } from 'next/navigation';
import { Loader2, User, LogOut, Sun, Moon, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';

export default function SettingsPage() {
  const { profile, refreshProfile, currencySymbol } = useApp();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [monthlyIncome, setMonthlyIncome] = useState(profile?.monthly_income?.toString() ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      monthly_income: parseFloat(monthlyIncome) || 0,
    }).eq('id', user!.id);

    if (error) toast.error('Failed to save');
    else { toast.success('Profile saved!'); refreshProfile(); }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight animate-fade-in" style={{ color: 'var(--foreground)' }}>Settings</h1>

      {/* Profile */}
      <div className="card rounded-2xl p-5 flex flex-col gap-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <User className="w-5 h-5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Profile Settings</h2>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Full Name</label>
            <input id="settings-name" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none"
              style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Monthly Income (LKR)</label>
            <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--muted)] transition-all duration-200 focus-within:border-indigo-500 focus-within:bg-[var(--card)] focus-within:ring-2 focus-within:ring-indigo-500/15">
              <span className="pl-4 pr-2 font-bold text-slate-400 dark:text-slate-500 select-none">Rs.</span>
              <input id="settings-income" type="number" min="0" step="0.01" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="0.00"
                className="w-full pr-4 py-2.5 bg-transparent text-sm outline-none border-0 focus:ring-0 focus:!ring-0 focus:!border-0 focus:!border-transparent focus:!bg-transparent focus:!shadow-none"
                style={{ color: 'var(--foreground)' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Currency</label>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#161824] text-slate-500 dark:text-slate-400">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>LKR – Sri Lankan Rupee (Rs.)</span>
            </div>
          </div>
          <button id="save-settings-btn" type="submit" disabled={loading}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="card rounded-2xl p-5 animate-fade-in">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Appearance Mode</h2>
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as const).map(t => {
            const isActive = theme === t;
            return (
              <button key={t} id={`theme-${t}`}
                onClick={() => setTheme(t)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all capitalize text-xs font-semibold',
                  isActive 
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#161824] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e202f]'
                )}>
                {t === 'light' ? <Sun className="w-5 h-5" /> : t === 'dark' ? <Moon className="w-5 h-5" /> : <span className="text-lg">⚙️</span>}
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="card rounded-2xl p-5 animate-fade-in">
        <button id="settings-logout-btn" onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-red-500 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-[0.98] transition-all bg-[var(--card)] hover:border-red-400 dark:hover:border-red-800">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* App Info */}
      <div className="text-center pb-4 animate-fade-in">
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>CapIt v1.0.0 · Personal Finance Manager</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Built for Sri Lankan students & professionals</p>
      </div>
    </div>
  );
}

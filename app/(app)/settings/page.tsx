'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Loader2, User, LogOut, Sun, Moon, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

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
    <div className="space-y-5 max-w-lg">
      <h1 className="text-2xl font-bold animate-fade-in" style={{ color: 'var(--foreground)' }}>Settings</h1>

      {/* Profile */}
      <div className="card rounded-2xl p-5 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#6366f120' }}>
            <User className="w-5 h-5" style={{ color: '#6366f1' }} />
          </div>
          <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>Profile</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Full Name</label>
            <input id="settings-name" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none"
              style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Monthly Income (Rs.)</label>
            <input id="settings-income" type="number" min="0" step="0.01" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none"
              style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Currency</label>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
              style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
              <Wallet className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>LKR – Sri Lankan Rupee (Rs.)</span>
            </div>
          </div>
          <button id="save-settings-btn" type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="card rounded-2xl p-5 animate-fade-in">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Appearance</h2>
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as const).map(t => (
            <button key={t} id={`theme-${t}`}
              onClick={() => setTheme(t)}
              className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all capitalize text-sm font-medium"
              style={{ borderColor: theme === t ? '#6366f1' : 'var(--border)', background: theme === t ? '#6366f120' : 'var(--muted)', color: theme === t ? '#6366f1' : 'var(--muted-foreground)' }}>
              {t === 'light' ? <Sun className="w-5 h-5" /> : t === 'dark' ? <Moon className="w-5 h-5" /> : <span className="text-lg">⚙️</span>}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="card rounded-2xl p-5 animate-fade-in">
        <button id="settings-logout-btn" onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-red-500 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
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

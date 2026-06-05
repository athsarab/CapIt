'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, TrendingUp, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Sidebar } from './Sidebar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/recurring': 'Recurring',
  '/budgets': 'Budgets',
  '/analytics': 'Analytics',
  '/savings': 'Savings Goals',
  '/settings': 'Settings',
};

export function TopBar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const title = Object.entries(pageTitles).find(([k]) => pathname.startsWith(k))?.[1] ?? 'CapIt';

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-white/85 dark:bg-[#090a0f]/85 backdrop-blur-lg"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
        }}>
        <button
          onClick={() => setDrawerOpen(true)}
          id="menu-btn"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>{title}</span>
        </div>

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          id="mobile-theme-toggle"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {resolvedTheme === 'dark'
            ? <Sun className="w-5 h-5 text-yellow-400" />
            : <Moon className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 animate-slide-in">
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

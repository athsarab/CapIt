'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, ArrowLeftRight, RefreshCw, PieChart,
  Target, Wallet, TrendingUp, Sun, Moon, LogOut, Settings, X
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/recurring', icon: RefreshCw, label: 'Recurring' },
  { href: '/budgets', icon: Wallet, label: 'Budgets' },
  { href: '/analytics', icon: PieChart, label: 'Analytics' },
  { href: '/savings', icon: Target, label: 'Savings' },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/login');
  }

  return (
    <aside className="flex flex-col h-full"
      style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}>

      {/* Logo */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>CapIt</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Finance Manager</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              id={`nav-${label.toLowerCase()}`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-white shadow-md'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
              style={isActive ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : { color: 'var(--muted-foreground)' }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          id="theme-toggle"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button
          onClick={handleLogout}
          id="logout-btn"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

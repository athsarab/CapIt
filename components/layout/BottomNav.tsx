'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, PieChart, Target, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/budgets', icon: Wallet, label: 'Budgets' },
  { href: '/analytics', icon: PieChart, label: 'Analytics' },
  { href: '/savings', icon: Target, label: 'Savings' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              id={`bottom-nav-${label.toLowerCase()}`}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[56px]"
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                isActive ? 'text-white shadow-lg scale-110' : ''
              )}
                style={isActive ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                <Icon className={cn('w-5 h-5', !isActive && 'text-slate-400 dark:text-slate-500')} />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

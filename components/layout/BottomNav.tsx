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
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom border-t border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-[#090a0f]/85 backdrop-blur-lg"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)',
      }}>
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              id={`bottom-nav-${label.toLowerCase()}`}
              className="flex flex-col items-center gap-1 py-1 transition-all flex-1 min-w-0"
            >
              <div className={cn(
                'w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200',
                isActive 
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 scale-105' 
                  : 'text-slate-400 dark:text-slate-500'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                'text-[9px] font-semibold tracking-wider transition-colors duration-200',
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500'
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

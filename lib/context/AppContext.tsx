'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Transaction, Category, Budget, RecurringExpense, SavingsGoal } from '@/lib/types';
import { getNextDueDate, toISODateString } from '@/lib/utils/finance';
import toast from 'react-hot-toast';

interface AppContextType {
  profile: Profile | null;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurringExpenses: RecurringExpense[];
  savingsGoals: SavingsGoal[];
  isLoading: boolean;
  refreshTransactions: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
  refreshRecurring: () => Promise<void>;
  refreshSavings: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  currencySymbol: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currencySymbol = profile?.currency_symbol ?? 'Rs.';

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) setProfile(data);
  }, [supabase]);

  const refreshTransactions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setTransactions(data as Transaction[]);
  }, [supabase]);

  const refreshBudgets = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', user.id);
    if (data) setBudgets(data as Budget[]);
  }, [supabase]);

  const refreshRecurring = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('recurring_expenses')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .order('next_due_date', { ascending: true });
    if (data) setRecurringExpenses(data as RecurringExpense[]);
  }, [supabase]);

  const refreshSavings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSavingsGoals(data as SavingsGoal[]);
  }, [supabase]);

  const processRecurring = useCallback(async (userId: string, recurring: RecurringExpense[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = recurring.filter((r) => {
      if (!r.is_active) return false;
      const dueDate = new Date(r.next_due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= today;
    });

    if (overdue.length === 0) return;

    for (const r of overdue) {
      // Insert transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        category_id: r.category_id,
        type: 'expense',
        amount: r.amount,
        description: r.description,
        notes: `Auto-generated from recurring: ${r.frequency}`,
        date: r.next_due_date,
        is_recurring: true,
        recurring_id: r.id,
      });

      // Update next due date
      const nextDue = getNextDueDate(r.frequency, new Date(r.next_due_date));
      await supabase
        .from('recurring_expenses')
        .update({
          next_due_date: toISODateString(nextDue),
          last_generated: toISODateString(new Date()),
        })
        .eq('id', r.id);
    }

    if (overdue.length > 0) {
      toast.success(`${overdue.length} recurring expense${overdue.length > 1 ? 's' : ''} auto-added!`);
      await refreshTransactions();
      await refreshRecurring();
    }
  }, [supabase, refreshTransactions, refreshRecurring]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const [profileRes, txRes, catRes, budgetRes, recurringRes, savingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('transactions').select('*, category:categories(*)').eq('user_id', user.id).order('date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').or(`is_default.eq.true,user_id.eq.${user.id}`).order('name'),
        supabase.from('budgets').select('*, category:categories(*)').eq('user_id', user.id),
        supabase.from('recurring_expenses').select('*, category:categories(*)').eq('user_id', user.id).order('next_due_date', { ascending: true }),
        supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (txRes.data) setTransactions(txRes.data as Transaction[]);
      if (catRes.data) setCategories(catRes.data as Category[]);
      if (budgetRes.data) setBudgets(budgetRes.data as Budget[]);
      if (recurringRes.data) {
        setRecurringExpenses(recurringRes.data as RecurringExpense[]);
        await processRecurring(user.id, recurringRes.data as RecurringExpense[]);
      }
      if (savingsRes.data) setSavingsGoals(savingsRes.data as SavingsGoal[]);

      setIsLoading(false);
    }

    init();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider
      value={{
        profile,
        transactions,
        categories,
        budgets,
        recurringExpenses,
        savingsGoals,
        isLoading,
        refreshTransactions,
        refreshBudgets,
        refreshRecurring,
        refreshSavings,
        refreshProfile,
        currencySymbol,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

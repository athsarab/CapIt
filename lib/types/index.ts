// ============================================================
// CapIt – Global TypeScript Types
// ============================================================

export type TransactionType = 'income' | 'expense';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type CategoryType = 'expense' | 'income' | 'both';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  currency_symbol: string;
  theme: string;
  monthly_income: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  notes: string | null;
  date: string;
  is_recurring: boolean;
  recurring_id: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  frequency: RecurringFrequency;
  start_date: string;
  next_due_date: string;
  last_generated: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  spent?: number;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Form Types
// ============================================================

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  category_id: string;
  date: string;
}

export interface RecurringFormData {
  description: string;
  amount: number;
  frequency: RecurringFrequency;
  start_date: string;
  category_id: string;
  notes?: string;
}

export interface BudgetFormData {
  category_id: string;
  amount: number;
  month: number;
  year: number;
}

export interface SavingsGoalFormData {
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  icon: string;
  color: string;
  notes?: string;
}

export interface ProfileFormData {
  full_name: string;
  currency: string;
  currency_symbol: string;
  monthly_income: number;
}

// ============================================================
// Dashboard / Analytics Types
// ============================================================

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savings: number;
  healthScore: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  color: string;
  icon: string;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface ExpenseTemplate {
  id: string;
  label: string;
  description: string;
  amount: number;
  category_name: string;
  icon: string;
  type: 'student' | 'worker' | 'common';
}

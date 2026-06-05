import { Category, ExpenseTemplate } from '@/lib/types';

// LKR-friendly expense categories
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_default'>[] = [
  // Expenses
  { name: 'Food & Dining', icon: 'utensils', color: '#f97316', type: 'expense' },
  { name: 'Transport', icon: 'car', color: '#3b82f6', type: 'expense' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#ec4899', type: 'expense' },
  { name: 'Housing & Rent', icon: 'home', color: '#8b5cf6', type: 'expense' },
  { name: 'Utilities', icon: 'zap', color: '#eab308', type: 'expense' },
  { name: 'Healthcare', icon: 'heart-pulse', color: '#ef4444', type: 'expense' },
  { name: 'Education', icon: 'graduation-cap', color: '#06b6d4', type: 'expense' },
  { name: 'Entertainment', icon: 'film', color: '#a855f7', type: 'expense' },
  { name: 'Subscriptions', icon: 'repeat', color: '#6366f1', type: 'expense' },
  { name: 'Phone & Internet', icon: 'smartphone', color: '#14b8a6', type: 'expense' },
  { name: 'Boarding', icon: 'building', color: '#f59e0b', type: 'expense' },
  { name: 'Groceries', icon: 'shopping-cart', color: '#22c55e', type: 'expense' },
  { name: 'Personal Care', icon: 'smile', color: '#f43f5e', type: 'expense' },
  { name: 'Travel', icon: 'plane', color: '#0ea5e9', type: 'expense' },
  { name: 'Investment', icon: 'trending-up', color: '#10b981', type: 'expense' },
  { name: 'Other', icon: 'circle-dot', color: '#94a3b8', type: 'expense' },
  // Income
  { name: 'Salary', icon: 'briefcase', color: '#22c55e', type: 'income' },
  { name: 'Freelance', icon: 'laptop', color: '#06b6d4', type: 'income' },
  { name: 'Business', icon: 'store', color: '#8b5cf6', type: 'income' },
  { name: 'Allowance', icon: 'wallet', color: '#f97316', type: 'income' },
  { name: 'Bonus', icon: 'gift', color: '#ec4899', type: 'income' },
  { name: 'Investment Returns', icon: 'trending-up', color: '#10b981', type: 'income' },
  { name: 'Other Income', icon: 'circle-dot', color: '#94a3b8', type: 'income' },
];

// LKR amounts for Sri Lankan context
export const STUDENT_TEMPLATES: ExpenseTemplate[] = [
  {
    id: 'student-boarding',
    label: 'Boarding Fee',
    description: 'Monthly boarding fee',
    amount: 8000,
    category_name: 'Boarding',
    icon: 'building',
    type: 'student',
  },
  {
    id: 'student-meal',
    label: 'Canteen Meal',
    description: 'Canteen lunch',
    amount: 250,
    category_name: 'Food & Dining',
    icon: 'utensils',
    type: 'student',
  },
  {
    id: 'student-bus',
    label: 'Bus Fare',
    description: 'Bus fare',
    amount: 60,
    category_name: 'Transport',
    icon: 'car',
    type: 'student',
  },
  {
    id: 'student-internet',
    label: 'Data Package',
    description: 'Mobile data package',
    amount: 1500,
    category_name: 'Phone & Internet',
    icon: 'smartphone',
    type: 'student',
  },
  {
    id: 'student-stationary',
    label: 'Stationery',
    description: 'Books and stationery',
    amount: 500,
    category_name: 'Education',
    icon: 'graduation-cap',
    type: 'student',
  },
  {
    id: 'student-tution',
    label: 'Tuition',
    description: 'Tuition class fee',
    amount: 5000,
    category_name: 'Education',
    icon: 'graduation-cap',
    type: 'student',
  },
];

export const WORKER_TEMPLATES: ExpenseTemplate[] = [
  {
    id: 'worker-rent',
    label: 'Monthly Rent',
    description: 'House rent',
    amount: 25000,
    category_name: 'Housing & Rent',
    icon: 'home',
    type: 'worker',
  },
  {
    id: 'worker-fuel',
    label: 'Fuel',
    description: 'Petrol / fuel',
    amount: 5000,
    category_name: 'Transport',
    icon: 'car',
    type: 'worker',
  },
  {
    id: 'worker-phone',
    label: 'Phone Bill',
    description: 'Monthly phone bill',
    amount: 2000,
    category_name: 'Phone & Internet',
    icon: 'smartphone',
    type: 'worker',
  },
  {
    id: 'worker-electric',
    label: 'Electricity',
    description: 'Electricity bill',
    amount: 4000,
    category_name: 'Utilities',
    icon: 'zap',
    type: 'worker',
  },
  {
    id: 'worker-water',
    label: 'Water Bill',
    description: 'Water bill',
    amount: 800,
    category_name: 'Utilities',
    icon: 'zap',
    type: 'worker',
  },
  {
    id: 'worker-groceries',
    label: 'Groceries',
    description: 'Weekly groceries',
    amount: 5000,
    category_name: 'Groceries',
    icon: 'shopping-cart',
    type: 'worker',
  },
];

export const COMMON_TEMPLATES: ExpenseTemplate[] = [
  {
    id: 'common-netflix',
    label: 'Netflix',
    description: 'Netflix subscription',
    amount: 1990,
    category_name: 'Subscriptions',
    icon: 'film',
    type: 'common',
  },
  {
    id: 'common-spotify',
    label: 'Spotify',
    description: 'Spotify subscription',
    amount: 499,
    category_name: 'Subscriptions',
    icon: 'music',
    type: 'common',
  },
  {
    id: 'common-gym',
    label: 'Gym',
    description: 'Gym membership',
    amount: 2500,
    category_name: 'Personal Care',
    icon: 'dumbbell',
    type: 'common',
  },
];

export const RECURRING_TEMPLATES = [
  { description: 'Monthly Rent', amount: 25000, frequency: 'monthly', category_name: 'Housing & Rent' },
  { description: 'Phone Bill', amount: 2000, frequency: 'monthly', category_name: 'Phone & Internet' },
  { description: 'Internet Bill', amount: 3500, frequency: 'monthly', category_name: 'Phone & Internet' },
  { description: 'Boarding Fee', amount: 8000, frequency: 'monthly', category_name: 'Boarding' },
  { description: 'Electricity Bill', amount: 4000, frequency: 'monthly', category_name: 'Utilities' },
  { description: 'Netflix', amount: 1990, frequency: 'monthly', category_name: 'Subscriptions' },
  { description: 'Spotify', amount: 499, frequency: 'monthly', category_name: 'Subscriptions' },
  { description: 'Gym Membership', amount: 2500, frequency: 'monthly', category_name: 'Personal Care' },
];

export const SAVINGS_GOAL_ICONS = [
  { icon: 'piggy-bank', label: 'Savings' },
  { icon: 'car', label: 'Vehicle' },
  { icon: 'home', label: 'Home' },
  { icon: 'plane', label: 'Travel' },
  { icon: 'graduation-cap', label: 'Education' },
  { icon: 'smartphone', label: 'Phone' },
  { icon: 'heart', label: 'Health' },
  { icon: 'gift', label: 'Gift' },
  { icon: 'laptop', label: 'Tech' },
  { icon: 'ring', label: 'Wedding' },
  { icon: 'baby', label: 'Baby' },
  { icon: 'target', label: 'Goal' },
];

export const GOAL_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#a855f7', '#f43f5e',
];

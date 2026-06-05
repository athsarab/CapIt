# CapIt

CapIt is a personal finance manager built with the Next.js App Router and Supabase. Track income, expenses, budgets, recurring bills, and savings goals with a responsive, mobile-first UI.

## Features

- Dashboard with financial health, trends, and monthly charts
- Income and expense tracking with categories
- Recurring expenses and reminders
- Budgets, savings goals, and analytics
- Authenticated experience with Supabase
- PWA-ready configuration

## Tech Stack

- Next.js (App Router)
- React 19
- Tailwind CSS
- Supabase (Auth + Database)
- Recharts for charts

## Requirements

- Node.js 18+ (recommended)
- A Supabase project

## Environment Variables

Create a `.env.local` file at the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

If you want the database schema used by this app, see [supabase/migrations](supabase/migrations).

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project Structure

```text
app/                    App Router routes and layouts
components/             UI and layout components
lib/                    Data, Supabase, utilities, and context
public/                 Static assets and PWA manifest
supabase/migrations/    Database schema migrations
```

## Deployment

Build and run:

```bash
npm run build
npm run start
```

Set the same environment variables in your hosting provider.

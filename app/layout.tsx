import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CapIt – Personal Finance Manager',
  description: 'Track your income, expenses, budgets, and savings goals with CapIt. Built for Sri Lankan students and professionals.',
  manifest: '/manifest.json',
  keywords: ['finance', 'budget', 'expense tracker', 'savings', 'LKR', 'Sri Lanka'],
  authors: [{ name: 'CapIt' }],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CapIt',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: 'CapIt – Personal Finance Manager',
    description: 'Manage your money smarter. Track expenses, set budgets, reach savings goals.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="h-full antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: '500',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

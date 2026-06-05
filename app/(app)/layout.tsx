import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppProvider } from '@/lib/context/AppContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { TopBar } from '@/components/layout/TopBar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <AppProvider>
      <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex flex-col sticky top-0 h-screen"
          style={{ width: '260px', minWidth: '260px' }}>
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile TopBar */}
          <div className="lg:hidden">
            <TopBar />
          </div>

          <main
            className="flex-1 lg:pb-6"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
          >
            <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </AppProvider>
  );
}

import { ReactNode, useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-30 rounded-full border border-[var(--stroke-soft)] bg-[var(--bg-base)] p-3 text-[var(--text-strong)] shadow-sm transition-colors hover:bg-[var(--bg-soft)] lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

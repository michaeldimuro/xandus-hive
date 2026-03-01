import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, Hexagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHiveWebSocket } from '@/hooks/useHiveWebSocket';

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarCollapsed');
    return stored === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keep the WebSocket connection alive while the layout is mounted
  useHiveWebSocket();

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  const toggle = () => setCollapsed((prev) => !prev);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn('lg:block', mobileMenuOpen ? 'block' : 'hidden')}>
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </div>

      {/* Main content area */}
      <main
        className={cn(
          'transition-all duration-300',
          collapsed ? 'lg:ml-16' : 'lg:ml-64',
        )}
      >
        {/* Sticky top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Desktop collapse toggle (visible when sidebar is collapsed) */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex h-8 w-8 text-muted-foreground"
              onClick={toggle}
            >
              <Menu size={18} />
            </Button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition lg:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                <Hexagon size={14} className="text-white" />
              </div>
              <span className="font-semibold text-foreground">Xandus Hive</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

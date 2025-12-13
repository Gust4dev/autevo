'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { TenantThemeProvider } from '@/components/providers/TenantThemeProvider';
import { cn } from '@/lib/cn';

interface DashboardShellProps {
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'filmtech-sidebar-collapsed';

export function DashboardShell({ children }: DashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) {
      setIsSidebarCollapsed(stored === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const handleSidebarToggle = () => {
    const newValue = !isSidebarCollapsed;
    setIsSidebarCollapsed(newValue);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block lg:w-[240px]" />
        <div className="flex flex-1 flex-col">
          <div className="h-16 border-b border-border" />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <TenantThemeProvider>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={handleSidebarToggle}
          />
        </div>

        {/* Mobile Navigation */}
        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />

        {/* Main Content Area */}
        <div
          className={cn(
            'flex flex-1 flex-col transition-all duration-300',
            isSidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'
          )}
        >
          {/* Header */}
          <Header
            isSidebarCollapsed={isSidebarCollapsed}
            onMobileMenuToggle={() => setIsMobileNavOpen(true)}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in-up">
            {children}
          </main>
        </div>
      </div>
    </TenantThemeProvider>
  );
}


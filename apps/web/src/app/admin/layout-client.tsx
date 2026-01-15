"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronRight,
  Menu,
  ScrollText,
  Settings,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userName: string;
}

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/tenants", icon: Users, label: "Tenants" },
  { href: "/admin/logs", icon: ScrollText, label: "Audit Logs" },
  { href: "/admin/settings", icon: Settings, label: "Configurações" },
];

export function AdminLayoutClient({
  children,
  userName,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-200">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="font-bold text-white text-lg">A</span>
          </div>
          <div>
            <span className="font-bold text-slate-900 text-lg">Autevo</span>
            <span className="text-xs text-slate-500 block -mt-0.5">
              Admin Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
          Navegação
        </p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-medium shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isActive && "text-indigo-600")}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 text-indigo-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-medium text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {userName}
            </p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Voltar ao Dashboard
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-slate-200 bg-white flex-col fixed inset-y-0 left-0 z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-slate-200 flex items-center px-4 shadow-sm">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 p-0 bg-white border-slate-200"
          >
            <div className="flex flex-col h-full">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex-1 flex justify-center">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="font-bold text-white text-sm">A</span>
            </div>
            <span className="font-bold text-slate-900">Admin</span>
          </Link>
        </div>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 overflow-y-auto bg-slate-50">
        <div className="pt-16 lg:pt-0 min-h-screen">{children}</div>
      </main>
    </div>
  );
}

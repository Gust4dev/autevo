"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Menu,
  X,
  Settings,
  LogOut,
  Users,
  Car,
  TrendingUp,
  Wrench,
  Package,
  CreditCard,
  Handshake,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/dashboard/financial",
    label: "Financeiro",
    icon: TrendingUp,
    roles: ["ADMIN_SAAS", "OWNER", "MANAGER", "ADMIN", "admin"],
  },
  {
    href: "/dashboard/orders",
    label: "Ordens de Serviço",
    icon: ClipboardList,
  },
  { href: "/dashboard/scheduling", label: "Agendamentos", icon: Calendar },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/vehicles", label: "Veículos", icon: Car },
  {
    href: "/dashboard/services",
    label: "Serviços",
    icon: Wrench,
  },
  { href: "/dashboard/products", label: "Produtos", icon: Package },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export function MobileNav({
  isOpen,
  onClose,
  userRole: propUserRole,
}: MobileNavProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();

  // Use prop role (server-side/layout) or fallback to client metadata
  const userRole =
    propUserRole || (user?.publicMetadata?.role as string | undefined);

  // Close sheet on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole || "");
  });

  const showSettings = [
    "ADMIN_SAAS",
    "OWNER",
    "MANAGER",
    "ADMIN",
    "admin",
  ].includes(userRole || "");

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        className="w-[300px] sm:w-[400px] flex flex-col p-6"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              A
            </div>
            Menu
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 flex flex-col gap-2 mt-8 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          <Separator className="my-2" />

          <Separator className="my-2" />

          {showSettings && (
            <>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Configurações
              </div>

              <Link
                href="/dashboard/settings"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  pathname === "/dashboard/settings"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Settings className="h-5 w-5" />
                Geral
              </Link>

              <Link
                href="/dashboard/settings/team"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  pathname.startsWith("/dashboard/settings/team")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Users className="h-5 w-5" />
                Equipe
              </Link>

              {["ADMIN_SAAS", "OWNER", "MANAGER"].includes(userRole || "") && (
                <Link
                  href="/dashboard/settings/pricing"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/settings/pricing")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <CreditCard className="h-5 w-5" />
                  Planos
                </Link>
              )}

              {["ADMIN_SAAS", "OWNER", "MANAGER"].includes(userRole || "") && (
                <Link
                  href="/dashboard/settings/partnership"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/settings/partnership")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Handshake className="h-5 w-5" />
                  Parceria
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="mt-auto pt-8">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

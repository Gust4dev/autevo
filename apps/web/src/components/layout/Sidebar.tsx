"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  Car,
  Wrench,
  Package,
  Settings,
  ChevronLeft,
  type LucideIcon,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useTenantTheme } from "@/components/providers/TenantThemeProvider";
import { FoundingMemberBadge } from "./FoundingMemberBadge";
import { trpc } from "@/lib/trpc/client";

type UserRole =
  | "ADMIN_SAAS"
  | "OWNER"
  | "MANAGER"
  | "MEMBER"
  | "ADMIN"
  | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  roles?: UserRole[];
  id?: string;
}

const mainNavItems: NavItem[] = [
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
];

const catalogNavItems: NavItem[] = [
  {
    href: "/dashboard/services",
    label: "Serviços",
    icon: Wrench,
    id: "nav-services",
  },
  { href: "/dashboard/products", label: "Produtos", icon: Package },
];

const settingsNavItems: NavItem[] = [
  {
    href: "/dashboard/settings",
    label: "Configurações",
    icon: Settings,
    roles: ["ADMIN_SAAS", "OWNER", "MANAGER", "ADMIN", "admin"],
  },
  {
    href: "/dashboard/settings/team",
    label: "Equipe",
    icon: Users,
    roles: ["ADMIN_SAAS", "OWNER", "MANAGER", "ADMIN", "admin"],
  },
  {
    href: "/dashboard/settings/pricing",
    label: "Planos",
    icon: CreditCard,
    roles: ["ADMIN_SAAS", "OWNER", "MANAGER"],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  userRole?: UserRole;
}

export function Sidebar({ isCollapsed, onToggle, userRole }: SidebarProps) {
  const pathname = usePathname();
  const theme = useTenantTheme();

  // Use passed role (from DB) or fallback to Clerk metadata (if available)
  const { user } = useUser();
  const effectiveRole =
    userRole || (user?.publicMetadata?.role as UserRole | undefined);

  // Fallback check for founding member status via DB
  const { data: subscription } = trpc.billing.getSubscription.useQuery(
    undefined,
    {
      enabled: !!user,
    },
  );

  const isFounder =
    (user?.publicMetadata as any)?.isFoundingMember || subscription?.isFounder;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/40 bg-card/80 backdrop-blur-xl transition-all duration-500 ease-out shadow-2xl",
          isCollapsed ? "w-[68px]" : "w-[260px]",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            {theme?.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={theme.logo}
                alt={theme.name || "Logo"}
                className="h-9 w-9 shrink-0 object-contain"
              />
            ) : (
              <img
                src="/icon.svg"
                alt="Autevo"
                className="h-9 w-9 shrink-0 object-contain"
              />
            )}
            {!isCollapsed && (
              <span className="text-lg font-semibold text-foreground truncate">
                {theme?.name || "Autevo"}
              </span>
            )}
          </Link>
        </div>

        {/* Founding Member Badge */}
        {!isCollapsed && isFounder && (
          <div className="px-3 pt-3">
            <FoundingMemberBadge />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
          <NavSection
            items={mainNavItems}
            isCollapsed={isCollapsed}
            pathname={pathname}
            userRole={effectiveRole}
          />

          <Separator className="my-3" />

          <SectionLabel isCollapsed={isCollapsed}>Catálogo</SectionLabel>
          <NavSection
            items={catalogNavItems}
            isCollapsed={isCollapsed}
            pathname={pathname}
            userRole={effectiveRole}
          />

          <Separator className="my-3" />

          {/* Settings Section - Only show if has items */}
          <NavSection
            items={settingsNavItems}
            isCollapsed={isCollapsed}
            pathname={pathname}
            userRole={effectiveRole}
          />
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-full"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                isCollapsed && "rotate-180",
              )}
            />
            <span className="sr-only">
              {isCollapsed ? "Expandir menu" : "Recolher menu"}
            </span>
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function NavSection({
  items,
  isCollapsed,
  pathname,
  userRole,
}: {
  items: NavItem[];
  isCollapsed: boolean;
  pathname: string;
  userRole?: UserRole;
}) {
  const filteredItems = items.filter((item) => {
    if (!item.roles) return true; // Accessible by everyone
    if (!userRole) return false; // Protected but no role loaded yet
    return item.roles.includes(userRole);
  });

  if (filteredItems.length === 0) return null;

  return (
    <div className="space-y-1">
      {filteredItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive}
            isCollapsed={isCollapsed}
          />
        );
      })}
    </div>
  );
}

function NavItem({
  item,
  isActive,
  isCollapsed,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      id={item.id}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out relative overflow-hidden group",
        "hover:bg-primary/10 hover:text-primary hover:shadow-sm hover:translate-x-1",
        isActive
          ? "bg-primary/15 text-primary shadow-sm font-semibold after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-1 after:bg-primary after:rounded-r-full after:animate-fade-in"
          : "text-muted-foreground",
        isCollapsed && "justify-center px-2 hover:translate-x-0",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

function SectionLabel({
  children,
  isCollapsed,
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
}) {
  if (isCollapsed) return null;

  return (
    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useTenantTheme } from '@/components/providers/TenantThemeProvider';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'Ordens de Serviço', icon: ClipboardList },
  { href: '/dashboard/scheduling', label: 'Agendamentos', icon: Calendar },
  { href: '/dashboard/customers', label: 'Clientes', icon: Users },
  { href: '/dashboard/vehicles', label: 'Veículos', icon: Car },
];

const catalogNavItems: NavItem[] = [
  { href: '/dashboard/services', label: 'Serviços', icon: Wrench },
  { href: '/dashboard/products', label: 'Produtos', icon: Package },
];

const settingsNavItems: NavItem[] = [
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const theme = useTenantTheme();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300',
          isCollapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            {theme?.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={theme.logo}
                alt={theme.name || 'Logo'}
                className="h-9 w-9 shrink-0 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">
                  {theme?.name?.[0] || 'F'}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <span className="text-lg font-semibold text-foreground truncate">
                {theme?.name || 'Filmtech OS'}
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
          <NavSection
            items={mainNavItems}
            isCollapsed={isCollapsed}
            pathname={pathname}
          />

          <Separator className="my-3" />

          <SectionLabel isCollapsed={isCollapsed}>Catálogo</SectionLabel>
          <NavSection
            items={catalogNavItems}
            isCollapsed={isCollapsed}
            pathname={pathname}
          />

          <Separator className="my-3" />

          <NavSection
            items={settingsNavItems}
            isCollapsed={isCollapsed}
            pathname={pathname}
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
                'h-4 w-4 transition-transform duration-300',
                isCollapsed && 'rotate-180'
              )}
            />
            <span className="sr-only">
              {isCollapsed ? 'Expandir menu' : 'Recolher menu'}
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
}: {
  items: NavItem[];
  isCollapsed: boolean;
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/dashboard' && pathname.startsWith(item.href));

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
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
        'hover:bg-accent hover:text-accent-foreground',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {item.badge > 99 ? '99+' : item.badge}
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

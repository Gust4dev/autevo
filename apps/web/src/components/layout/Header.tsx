"use client";

import { useRouter } from "next/navigation";
import { Menu, Bell, Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/provider";
import { cn } from "@/lib/cn";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isSidebarCollapsed: boolean;
}

export function Header({
  onMobileMenuToggle,
  isSidebarCollapsed,
}: HeaderProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notification.list.useQuery(
    { limit: 5 },
    {
      refetchInterval: 30000,
    },
  );

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
    },
  });

  const notifications = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationClick = (notification: {
    id: string;
    orderId: string | null;
    status: string;
  }) => {
    // Mark as read if pending
    if (notification.status === "pending") {
      markAsRead.mutate({ id: notification.id });
    }

    // Navigate to order if orderId exists
    if (notification.orderId) {
      router.push(`/dashboard/orders/${notification.orderId}`);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/40 bg-background/60 backdrop-blur-xl px-6 transition-all duration-500 ease-out",
        isSidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[276px]",
      )}
    >
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMobileMenuToggle}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </Button>

      {/* Search Bar */}
      <div className="relative hidden flex-1 md:block md:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar clientes, veículos, OS..."
          className="pl-10"
        />
      </div>

      {/* Right Section */}
      <div className="ml-auto flex items-center gap-2">
        {/* Mobile Search */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="h-5 w-5" />
          <span className="sr-only">Buscar</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {/* Notification badge */}
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <span className="sr-only">Notificações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              {unreadCount > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  {unreadCount} não lidas
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Carregando...
                </div>
              ) : !notifications?.length ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma notificação recente.
                </div>
              ) : (
                notifications.map((notification: any) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex flex-col items-start gap-1 py-3 cursor-pointer",
                      notification.status === "pending" && "bg-primary/5",
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <p className="text-sm font-medium">
                        {notification.message}
                      </p>
                      {notification.status === "pending" && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(notification.createdAt))}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-primary cursor-pointer"
              onClick={() => router.push("/dashboard/orders")}
            >
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Button */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
      </div>
    </header>
  );
}

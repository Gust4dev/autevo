'use client';

import { Menu, Bell, Search } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isSidebarCollapsed: boolean;
}

export function Header({ onMobileMenuToggle, isSidebarCollapsed }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/40 bg-background/60 backdrop-blur-xl px-6 transition-all duration-500 ease-out',
        isSidebarCollapsed ? 'lg:pl-[84px]' : 'lg:pl-[276px]'
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
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                3
              </span>
              <span className="sr-only">Notificações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <p className="text-sm font-medium">Nova OS criada</p>
              <p className="text-xs text-muted-foreground">
                OS #2024001 agendada para hoje às 14:00
              </p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <p className="text-sm font-medium">Cliente cadastrado</p>
              <p className="text-xs text-muted-foreground">
                João Silva foi adicionado ao sistema
              </p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <p className="text-sm font-medium">Estoque baixo</p>
              <p className="text-xs text-muted-foreground">
                Película 3M está abaixo do mínimo
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Button */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-9 w-9',
            },
          }}
        />
      </div>
    </header>
  );
}

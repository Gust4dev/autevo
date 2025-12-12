'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  MoreHorizontal, 
  UserPlus, 
  Shield, 
  UserCog,
  UserX,
  UserCheck,
} from 'lucide-react';
import { 
  Button, 
  DataTable, 
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/components/ui';
import type { Column } from '@/components/ui';
import { trpc } from '@/lib/trpc/provider';
import { toast } from 'sonner';

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' }> = {
  ESTRATEGISTA: { label: 'Estrategista', variant: 'success' },
  ORQUESTRADOR: { label: 'Orquestrador', variant: 'warning' },
  OPERACIONAL: { label: 'Operacional', variant: 'secondary' },
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<{
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  } | null>(null);

  const { data: users = [], isLoading, refetch } = trpc.user.list.useQuery();
  
  const deactivateMutation = trpc.user.deactivate.useMutation({
    onSuccess: () => {
      toast.success('Usuário desativado com sucesso');
      refetch();
      setDeactivateDialogOpen(false);
      setUserToDeactivate(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reactivateMutation = trpc.user.reactivate.useMutation({
    onSuccess: () => {
      toast.success('Usuário reativado com sucesso');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Filter data
  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const handleDeactivate = (user: (typeof users)[number]) => {
    setUserToDeactivate(user);
    setDeactivateDialogOpen(true);
  };

  const confirmDeactivate = () => {
    if (userToDeactivate) {
      deactivateMutation.mutate({ id: userToDeactivate.id });
    }
  };

  const handleReactivate = (user: (typeof users)[number]) => {
    reactivateMutation.mutate({ id: user.id });
  };

  const columns: Column<(typeof users)[number]>[] = [
    {
      key: 'name',
      header: 'Usuário',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Cargo',
      render: (user) => {
        const config = roleLabels[user.role] || { label: user.role, variant: 'default' as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'commission',
      header: 'Comissão',
      render: (user) => (
        <span className="text-sm">
          {user.defaultCommissionPercent ? `${user.defaultCommissionPercent}%` : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'destructive'}>
          {user.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/invite">
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar Usuário
          </Link>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        page={page}
        totalPages={1}
        total={filteredUsers.length}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou email..."
        getRowKey={(user) => user.id}
        emptyTitle="Nenhum usuário encontrado"
        emptyDescription="Convide membros para sua equipe."
        emptyAction={
          <Button asChild>
            <Link href="/dashboard/users/invite">
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar Usuário
            </Link>
          </Button>
        }
        renderActions={(user) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/users/${user.id}`}>
                  <UserCog className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.isActive ? (
                <DropdownMenuItem
                  onClick={() => handleDeactivate(user)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Desativar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleReactivate(user)}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Reativar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* Deactivate Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar <strong>{userToDeactivate?.name}</strong>?
              O usuário não poderá mais acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeactivate}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? 'Desativando...' : 'Desativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

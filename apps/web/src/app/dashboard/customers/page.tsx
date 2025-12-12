'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Phone, Mail, Car } from 'lucide-react';
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

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  document: string | null;
  whatsappOptIn: boolean;
  createdAt: Date;
  _count: {
    vehicles: number;
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // tRPC query
  const { data, isLoading, refetch } = trpc.customer.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
  });

  // tRPC mutation
  const deleteMutation = trpc.customer.delete.useMutation({
    onSuccess: () => {
      toast.success('Cliente excluído com sucesso');
      refetch();
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const customers = data?.customers || [];
  const pagination = data?.pagination;

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate({ id: customerToDelete.id });
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (customer) => (
        <div className="flex flex-col">
          <span className="font-medium">{customer.name}</span>
          {customer.document && (
            <span className="text-xs text-muted-foreground">{customer.document}</span>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contato',
      render: (customer) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {customer.phone}
            {customer.whatsappOptIn && (
              <Badge variant="success" className="ml-1 text-[10px] px-1.5 py-0">
                WhatsApp
              </Badge>
            )}
          </div>
          {customer.email && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {customer.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'vehicles',
      header: 'Veículos',
      className: 'text-center',
      render: (customer) => (
        <div className="flex items-center justify-center gap-1.5">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span>{customer._count.vehicles}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Cadastro',
      sortable: true,
      render: (customer) => (
        <span className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat('pt-BR').format(new Date(customer.createdAt))}
        </span>
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
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e seus veículos
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        page={page}
        totalPages={pagination?.totalPages || 1}
        total={pagination?.total || 0}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, telefone ou email..."
        onRowClick={(customer) => router.push(`/dashboard/customers/${customer.id}`)}
        getRowKey={(customer) => customer.id}
        emptyTitle="Nenhum cliente encontrado"
        emptyDescription="Comece cadastrando seu primeiro cliente."
        emptyAction={
          <Button asChild>
            <Link href="/dashboard/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Cliente
            </Link>
          </Button>
        }
        renderActions={(customer) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/customers/${customer.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/customers/${customer.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(customer)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cliente{' '}
              <strong>{customerToDelete?.name}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

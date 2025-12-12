'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Car, User } from 'lucide-react';
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

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number | null;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  _count: {
    orders: number;
  };
}

export default function VehiclesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const { data, isLoading, refetch } = trpc.vehicle.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
  });

  const deleteMutation = trpc.vehicle.delete.useMutation({
    onSuccess: () => {
      toast.success('Veículo excluído com sucesso');
      refetch();
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const vehicles = data?.vehicles || [];
  const pagination = data?.pagination;

  const handleDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (vehicleToDelete) {
      deleteMutation.mutate({ id: vehicleToDelete.id });
    }
  };

  const columns: Column<Vehicle>[] = [
    {
      key: 'vehicle',
      header: 'Veículo',
      render: (vehicle) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{vehicle.brand} {vehicle.model}</span>
              {vehicle.year && (
                <Badge variant="outline" className="text-xs">
                  {vehicle.year}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{vehicle.color}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plate',
      header: 'Placa',
      render: (vehicle) => (
        <Badge variant="secondary" className="font-mono">
          {vehicle.plate}
        </Badge>
      ),
    },
    {
      key: 'customer',
      header: 'Proprietário',
      render: (vehicle) => (
        <Link 
          href={`/dashboard/customers/${vehicle.customer.id}`}
          className="flex items-center gap-2 hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{vehicle.customer.name}</span>
        </Link>
      ),
    },
    {
      key: 'orders',
      header: 'OS',
      className: 'text-center',
      render: (vehicle) => (
        <span className="font-medium">{vehicle._count.orders}</span>
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
          <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
          <p className="text-muted-foreground">
            Gerencie os veículos cadastrados
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Veículo
          </Link>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={vehicles}
        isLoading={isLoading}
        page={page}
        totalPages={pagination?.totalPages || 1}
        total={pagination?.total || 0}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por placa, marca, modelo ou proprietário..."
        onRowClick={(vehicle) => router.push(`/dashboard/vehicles/${vehicle.id}`)}
        getRowKey={(vehicle) => vehicle.id}
        emptyTitle="Nenhum veículo encontrado"
        emptyDescription="Comece cadastrando um veículo para um cliente."
        emptyAction={
          <Button asChild>
            <Link href="/dashboard/vehicles/new">
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Veículo
            </Link>
          </Button>
        }
        renderActions={(vehicle) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/vehicles/${vehicle.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(vehicle)}
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
            <DialogTitle>Excluir Veículo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o veículo{' '}
              <strong>{vehicleToDelete?.brand} {vehicleToDelete?.model}</strong> ({vehicleToDelete?.plate})?
              Esta ação não pode ser desfeita.
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

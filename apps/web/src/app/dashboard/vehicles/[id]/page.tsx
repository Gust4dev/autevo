'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  Car,
  User,
  Calendar,
  ClipboardList,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  Badge,
  Separator,
  Skeleton,
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
} from '@/components/ui';
import { trpc } from '@/lib/trpc/provider';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive' }> = {
  AGENDADO: { label: 'Agendado', variant: 'secondary' },
  EM_VISTORIA: { label: 'Em Vistoria', variant: 'info' },
  EM_EXECUCAO: { label: 'Em Execução', variant: 'info' },
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando Pagamento', variant: 'warning' },
  CONCLUIDO: { label: 'Concluído', variant: 'success' },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VehicleDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: vehicle, isLoading } = trpc.vehicle.getById.useQuery({ id });

  const deleteMutation = trpc.vehicle.delete.useMutation({
    onSuccess: () => {
      toast.success('Veículo excluído com sucesso');
      router.push('/dashboard/vehicles');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ id });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Veículo não encontrado</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/vehicles">Voltar para Veículos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/dashboard/vehicles">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {vehicle.brand} {vehicle.model}
              </h1>
              <Badge variant="outline" className="font-mono text-base">
                {vehicle.plate}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {vehicle.color} • {vehicle.year || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pl-12 sm:pl-0">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/vehicles/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/orders/new?vehicleId=${id}`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Nova OS
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Veículo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vehicle Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Car className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Veículo</p>
                <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proprietário</p>
                {vehicle.customer ? (
                  <>
                    <Link 
                      href={`/dashboard/customers/${vehicle.customer.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {vehicle.customer.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{vehicle.customer.phone}</p>
                  </>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium text-sm flex items-center gap-2">
                     Sem proprietário vinculado
                     <Button variant="link" asChild className="p-0 h-auto text-amber-600 underline">
                        <Link href={`/dashboard/vehicles/${id}/edit`}>Vincular</Link>
                     </Button>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cadastrado em</p>
                <p className="font-medium">
                  {new Intl.DateTimeFormat('pt-BR').format(new Date(vehicle.createdAt))}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 text-center">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-2xl font-bold">{vehicle._count.orders}</p>
                <p className="text-xs text-muted-foreground">Total de OS</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Histórico de Ordens</CardTitle>
              <CardDescription>
                Todas as ordens de serviço deste veículo
              </CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link href={`/dashboard/orders/new?vehicleId=${id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Nova OS
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!vehicle.orders || vehicle.orders.length === 0 ? (
              <div className="py-8 text-center">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">
                  Nenhuma ordem de serviço registrada
                </p>
                <Button className="mt-4" size="sm" asChild>
                  <Link href={`/dashboard/orders/new?vehicleId=${id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira OS
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicle.orders.map((order: {
                  id: string;
                  code: string;
                  status: string;
                  scheduledAt: Date;
                  total: unknown;
                  items: { service: { name: string } | null }[];
                }) => {
                  const status = statusConfig[order.status] || statusConfig.AGENDADO;
                  return (
                    <Link
                      key={order.id}
                      href={`/dashboard/orders/${order.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{order.code}</span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.items?.map(i => i.service?.name).filter(Boolean).join(', ') || 'Sem serviços'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat('pt-BR').format(new Date(order.scheduledAt))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(Number(order.total))}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Veículo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o veículo{' '}
              <strong>{vehicle.brand} {vehicle.model}</strong> ({vehicle.plate})?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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

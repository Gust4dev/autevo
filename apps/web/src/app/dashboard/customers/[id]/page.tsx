'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  Phone, 
  Mail, 
  FileText, 
  Calendar,
  Car,
  Plus,
  MoreHorizontal,
  ClipboardList,
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
import { useState } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: customer, isLoading } = trpc.customer.getById.useQuery({ id });

  const deleteMutation = trpc.customer.delete.useMutation({
    onSuccess: () => {
      toast.success('Cliente excluído com sucesso');
      router.push('/dashboard/customers');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ id });
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

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/customers">Voltar para Clientes</Link>
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
            <Link href="/dashboard/customers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
              {customer.whatsappOptIn && (
                <Badge variant="success">WhatsApp Ativo</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Cliente desde {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(customer.createdAt))}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pl-12 sm:pl-0">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/customers/${id}/edit`}>
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
                <Link href={`/dashboard/orders/new?customerId=${id}`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Nova OS
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/vehicles/new?customerId=${id}`}>
                  <Car className="mr-2 h-4 w-4" />
                  Adicionar Veículo
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Cliente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            </div>

            {customer.email && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
            )}

            {customer.document && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                  <p className="font-medium">{customer.document}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cadastrado em</p>
                <p className="font-medium">
                  {new Intl.DateTimeFormat('pt-BR').format(new Date(customer.createdAt))}
                </p>
              </div>
            </div>

            {customer.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
                  <p className="text-sm">{customer.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Vehicles */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Veículos</CardTitle>
              <CardDescription>
                {customer.vehicles.length} veículo{customer.vehicles.length !== 1 && 's'} cadastrado{customer.vehicles.length !== 1 && 's'}
              </CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link href={`/dashboard/vehicles/new?customerId=${id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {customer.vehicles.length === 0 ? (
              <div className="py-8 text-center">
                <Car className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">
                  Nenhum veículo cadastrado
                </p>
                <Button className="mt-4" size="sm" asChild>
                  <Link href={`/dashboard/vehicles/new?customerId=${id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Veículo
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {customer.vehicles.map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    href={`/dashboard/vehicles/${vehicle.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {vehicle.brand} {vehicle.model}
                          </span>
                          <Badge variant="outline">{vehicle.plate}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.color} • {vehicle.year}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{vehicle._count.orders} OS</p>
                      <p className="text-xs text-muted-foreground">realizadas</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{customer.name}</strong>?
              Todos os veículos e dados associados serão perdidos.
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

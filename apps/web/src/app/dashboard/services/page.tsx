"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Clock,
  DollarSign,
} from "lucide-react";
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
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { trpc } from "@/lib/trpc/provider";
import { toast } from "sonner";

export default function ServicesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{
    id: string;
    name: string;
    isActive: boolean;
  } | null>(null);

  const { data, isLoading, refetch } = trpc.service.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    isActive: showInactive ? undefined : true,
  });

  const toggleActiveMutation = trpc.service.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.service.delete.useMutation({
    onSuccess: () => {
      toast.success("Serviço excluído com sucesso");
      refetch();
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const services = data?.services || [];
  const pagination = data?.pagination;

  const handleDelete = (service: (typeof services)[number]) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteMutation.mutate({ id: serviceToDelete.id });
    }
  };

  const handleToggleActive = (service: (typeof services)[number]) => {
    toggleActiveMutation.mutate({ id: service.id });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const columns: Column<(typeof services)[number]>[] = [
    {
      key: "name",
      header: "Serviço",
      sortable: true,
      render: (service) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{service.name}</span>
            {!service.isActive && (
              <Badge variant="secondary" className="text-xs">
                Inativo
              </Badge>
            )}
          </div>
          {service.description && (
            <span className="text-sm text-muted-foreground line-clamp-1">
              {service.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "basePrice",
      header: "Preço Base",
      render: (service) => (
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {formatCurrency(Number(service.basePrice))}
          </span>
        </div>
      ),
    },
    {
      key: "estimatedTime",
      header: "Tempo Est.",
      render: (service) =>
        service.estimatedTime ? (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatTime(service.estimatedTime)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "returnDays",
      header: "Retorno",
      render: (service) =>
        service.returnDays ? (
          <span>{service.returnDays} dias</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "commission",
      header: "Comissão",
      render: (service) =>
        service.defaultCommissionPercent ? (
          <Badge variant="outline">
            {Number(service.defaultCommissionPercent)}%
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
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
      <div
        id="page-title"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de serviços
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showInactive ? "secondary" : "outline"}
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? "Ocultar Inativos" : "Mostrar Inativos"}
          </Button>
          <Button id="btn-new-service" asChild>
            <Link href="/dashboard/services/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Serviço
            </Link>
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={services}
        isLoading={isLoading}
        page={page}
        totalPages={pagination?.totalPages || 1}
        total={pagination?.total || 0}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou descrição..."
        onRowClick={(service) =>
          router.push(`/dashboard/services/${service.id}`)
        }
        getRowKey={(service) => service.id}
        emptyTitle="Nenhum serviço encontrado"
        emptyDescription="Comece cadastrando seu primeiro serviço."
        emptyAction={
          <Button asChild>
            <Link href="/dashboard/services/new">
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Serviço
            </Link>
          </Button>
        }
        renderActions={(service) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/services/${service.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/services/${service.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleActive(service)}>
                {service.isActive ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(service)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Serviço</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o serviço{" "}
              <strong>{serviceToDelete?.name}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

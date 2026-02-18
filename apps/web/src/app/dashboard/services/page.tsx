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
  ChevronRight,
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
  Card,
  CardContent,
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

      {/* Desktop Table */}
      <div className="hidden md:block">
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
      </div>

      {/* Mobile List */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <p className="text-muted-foreground">
                Nenhum serviço encontrado.
              </p>
              <Button asChild>
                <Link href="/dashboard/services/new">Cadastrar Serviço</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {services.map((service: any) => (
              <div
                key={service.id}
                className="bg-card border border-border/50 rounded-xl p-4 space-y-4 active:bg-muted/30 transition-colors"
                onClick={() => router.push(`/dashboard/services/${service.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">
                        {service.name}
                      </span>
                      {!service.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mr-2"
                      >
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
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(service);
                        }}
                      >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(service);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatCurrency(Number(service.basePrice))}
                    </span>
                  </div>
                  {service.estimatedTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatTime(service.estimatedTime)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    {service.defaultCommissionPercent && (
                      <Badge variant="outline" className="text-xs w-fit">
                        Comissão: {Number(service.defaultCommissionPercent)}%
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/services/${service.id}`}>
                      Detalhes <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}

            {/* Mobile Pagination */}
            {(pagination?.totalPages || 0) > 1 && (
              <div className="flex justify-center pt-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center px-2 text-sm text-muted-foreground">
                  {page} de {pagination?.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage((p) =>
                      Math.min(pagination?.totalPages || 1, p + 1),
                    );
                  }}
                  disabled={page === (pagination?.totalPages || 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

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

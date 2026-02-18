"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Car,
  User,
  Calendar,
  Filter,
  ChevronRight,
  Receipt,
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
  Card,
  CardContent,
  Skeleton,
} from "@/components/ui";
import { StatusBadge } from "@/components/orders";
import type { Column } from "@/components/ui";
import { trpc } from "@/lib/trpc/provider";
import { exportToExcel, formatFilenameDate } from "@/lib/export";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";

const statusOptions = [
  { value: "AGENDADO", label: "Agendado" },
  { value: "EM_VISTORIA", label: "Em Vistoria" },
  { value: "EM_EXECUCAO", label: "Em Execução" },
  { value: "AGUARDANDO_PAGAMENTO", label: "Aguardando Pagamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
];

export default function OrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = trpc.order.list.useQuery(
    {
      page,
      limit: 20,
      search: search || undefined,
      status:
        selectedStatuses.length > 0
          ? (selectedStatuses as (
              | "AGENDADO"
              | "EM_VISTORIA"
              | "EM_EXECUCAO"
              | "AGUARDANDO_PAGAMENTO"
              | "CONCLUIDO"
              | "CANCELADO"
            )[])
          : undefined,
    },
    {
      refetchInterval: 5000,
    },
  );

  const orders = data?.orders || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const columns: Column<(typeof orders)[number]>[] = [
    {
      key: "code",
      header: "OS",
      sortable: true,
      render: (order) => (
        <div className="space-y-1">
          <span className="font-mono font-semibold">{order.code}</span>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(order.scheduledAt)}
          </div>
        </div>
      ),
    },
    {
      key: "vehicle",
      header: "Cliente / Veículo",
      render: (order) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            {order.vehicle.customer ? (
              <Link
                href={`/dashboard/customers/${order.vehicle.customer.id}`}
                className="font-medium hover:text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {order.vehicle.customer.name}
              </Link>
            ) : (
              <span className="text-muted-foreground font-medium italic">
                Cliente desconhecido
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Car className="h-3.5 w-3.5" />
            <span className="font-mono">{order.vehicle.plate}</span>
            <span>•</span>
            <span>
              {order.vehicle.brand} {order.vehicle.model}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: "total",
      header: "Valor",
      render: (order) => (
        <span className="font-semibold">
          {formatCurrency(Number(order.total))}
        </span>
      ),
    },
    {
      key: "assignedTo",
      header: "Responsável",
      render: (order) => (
        <span className="text-sm">{order.assignedTo?.name || "-"}</span>
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
          <h1 className="text-2xl font-bold tracking-tight">
            Ordens de Serviço
          </h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de serviço do sistema
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton search={search} selectedStatuses={selectedStatuses} />
          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedStatuses.length}
              </Badge>
            )}
          </Button>
          <Button asChild>
            <Link href="/dashboard/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova OS
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Filtrar por Status</h3>
                {selectedStatuses.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStatuses([])}
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleStatus(option.value)}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      selectedStatuses.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={orders}
          isLoading={isLoading}
          page={page}
          totalPages={data?.pages || 1}
          total={data?.total || 0}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por código, placa ou cliente..."
          onRowClick={(order) => router.push(`/dashboard/orders/${order.id}`)}
          getRowKey={(order) => order.id}
          emptyTitle="Nenhuma ordem encontrada"
          emptyDescription="Comece criando sua primeira ordem de serviço."
          emptyAction={
            <Button asChild>
              <Link href="/dashboard/orders/new">
                <Plus className="mr-2 h-4 w-4" />
                Criar OS
              </Link>
            </Button>
          }
          renderActions={(order) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/orders/${order.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {order.vehicle.customer && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/customers/${order.vehicle.customer.id}`}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Ver Cliente
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/vehicles/${order.vehicle.id}`}>
                    <Car className="mr-2 h-4 w-4" />
                    Ver Veículo
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      </div>

      {/* Mobile Stats List */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <p className="text-muted-foreground">Nenhuma ordem encontrada.</p>
              <Button asChild>
                <Link href="/dashboard/orders/new">Criar OS</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div
                key={order.id}
                className="bg-card border border-border/50 rounded-xl p-4 space-y-4 active:bg-muted/30 transition-colors"
                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg">
                        {order.code}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(order.scheduledAt)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {order.vehicle.customer?.name || "Cliente desconhecido"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {order.vehicle.brand} {order.vehicle.model}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {order.vehicle.plate}
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Valor Total
                    </span>
                    <span className="font-bold text-base">
                      {formatCurrency(Number(order.total))}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      Detalhes <ChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}

            {/* Mobile Pagination */}
            {(data?.pages || 0) > 1 && (
              <div className="flex justify-center pt-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-2 text-sm">
                  Pag {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(data?.pages || 1, p + 1))
                  }
                  disabled={page === (data?.pages || 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ExportButton({
  search,
  selectedStatuses,
}: {
  search?: string;
  selectedStatuses?: string[];
}) {
  const { refetch, isFetching } = trpc.order.listAll.useQuery(
    {
      search,
      status: selectedStatuses?.length
        ? (selectedStatuses as OrderStatus[])
        : undefined,
    },
    { enabled: false },
  );

  const handleExport = async () => {
    try {
      const { data } = await refetch();
      if (!data) return;

      const exportData = data.map((o: any) => ({
        Código: o.code,
        Status: o.status,
        "Data Agendamento": new Intl.DateTimeFormat("pt-BR").format(
          new Date(o.scheduledAt),
        ),
        Cliente: o.vehicle.customer?.name || "N/A",
        Veículo: `${o.vehicle.brand} ${o.vehicle.model}`,
        Placa: o.vehicle.plate,
        Responsável: o.assignedTo?.name || "N/A",
        "Valor Total": Number(o.total),
      }));

      exportToExcel(
        exportData,
        `OrdensServico_${formatFilenameDate()}`,
        "Ordens",
      );
      toast.success("Exportação concluída");
    } catch (error) {
      toast.error("Erro ao exportar dados");
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isFetching}>
      <Receipt className="mr-2 h-4 w-4" />
      {isFetching ? "Exportando..." : "Exportar Excel"}
    </Button>
  );
}

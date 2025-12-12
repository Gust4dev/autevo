'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, MoreHorizontal, Eye, Pencil, Car, User, Calendar, Filter } from 'lucide-react';
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
} from '@/components/ui';
import { StatusBadge } from '@/components/orders';
import type { Column } from '@/components/ui';
import { trpc } from '@/lib/trpc/provider';


const statusOptions = [
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'EM_VISTORIA', label: 'Em Vistoria' },
  { value: 'EM_EXECUCAO', label: 'Em Execução' },
  { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando Pagamento' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export default function OrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = trpc.order.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: selectedStatuses.length > 0 ? selectedStatuses as ('AGENDADO' | 'EM_VISTORIA' | 'EM_EXECUCAO' | 'AGUARDANDO_PAGAMENTO' | 'CONCLUIDO' | 'CANCELADO')[] : undefined,
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const columns: Column<(typeof orders)[number]>[] = [
    {
      key: 'code',
      header: 'OS',
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
      key: 'vehicle',
      header: 'Cliente / Veículo',
      render: (order) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <Link 
              href={`/dashboard/customers/${order.vehicle.customer.id}`}
              className="font-medium hover:text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {order.vehicle.customer.name}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Car className="h-3.5 w-3.5" />
            <span className="font-mono">{order.vehicle.plate}</span>
            <span>•</span>
            <span>{order.vehicle.brand} {order.vehicle.model}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'total',
      header: 'Valor',
      render: (order) => (
        <span className="font-semibold">{formatCurrency(Number(order.total))}</span>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Responsável',
      render: (order) => (
        <span className="text-sm">{order.assignedTo?.name || '-'}</span>
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
          <h1 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de serviço do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
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
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
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

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        page={page}
        totalPages={pagination?.totalPages || 1}
        total={pagination?.total || 0}
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
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/customers/${order.vehicle.customer.id}`}>
                  <User className="mr-2 h-4 w-4" />
                  Ver Cliente
                </Link>
              </DropdownMenuItem>
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
  );
}

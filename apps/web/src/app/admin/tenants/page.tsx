"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Filter,
  X,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TenantStatus } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const statusConfig: Record<
  TenantStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING_ACTIVATION: {
    label: "Pendente",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    icon: Clock,
  },
  TRIAL: {
    label: "Trial",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: Clock,
  },
  ACTIVE: {
    label: "Ativo",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    icon: CheckCircle,
  },
  SUSPENDED: {
    label: "Suspenso",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    icon: AlertTriangle,
  },
  PAST_DUE: {
    label: "Atrasado",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: AlertTriangle,
  },
  CANCELED: {
    label: "Cancelado",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    icon: XCircle,
  },
};

export default function TenantsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantStatus | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading } = trpc.admin.listTenants.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter,
  });

  const FilterButtons = () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={!statusFilter ? "default" : "outline"}
        size="sm"
        onClick={() => {
          setStatusFilter(undefined);
          setFiltersOpen(false);
        }}
        className={!statusFilter ? "bg-indigo-600 hover:bg-indigo-700" : ""}
      >
        Todos
      </Button>
      {(
        ["PENDING_ACTIVATION", "TRIAL", "ACTIVE", "SUSPENDED"] as TenantStatus[]
      ).map((status) => (
        <Button
          key={status}
          variant={statusFilter === status ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setStatusFilter(status);
            setPage(1);
            setFiltersOpen(false);
          }}
          className={
            statusFilter === status ? "bg-indigo-600 hover:bg-indigo-700" : ""
          }
        >
          {statusConfig[status].label}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Users className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Clientes
          </h1>
          <p className="text-sm text-slate-500">
            {data?.pagination.total || 0} clientes cadastrados
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 my-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="hidden sm:flex gap-2">
          <FilterButtons />
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="sm:hidden border-slate-200">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {statusFilter && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 px-1.5 bg-indigo-100 text-indigo-700"
                >
                  1
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-white border-slate-200">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-slate-900">
                Filtrar por Status
              </SheetTitle>
            </SheetHeader>
            <FilterButtons />
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filter Badge (Mobile) */}
      {statusFilter && (
        <div className="flex sm:hidden mb-4">
          <Badge
            className={`${statusConfig[statusFilter].bgColor} ${statusConfig[statusFilter].color} pr-1`}
          >
            {statusConfig[statusFilter].label}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 hover:bg-transparent"
              onClick={() => setStatusFilter(undefined)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : data?.tenants.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum cliente encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="bg-white border-slate-200 shadow-sm hidden lg:block overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-sm text-slate-600">
                    <th className="px-6 py-4 font-semibold">Cliente</th>
                    <th className="px-6 py-4 font-semibold">Owner</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Criado</th>
                    <th className="px-6 py-4 font-semibold">Uso</th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.tenants.map((tenant) => {
                    const status = statusConfig[tenant.status];
                    const StatusIcon = status.icon;

                    return (
                      <tr
                        key={tenant.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">
                              {tenant.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {tenant.slug}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tenant.owner ? (
                            <div>
                              <p className="text-sm text-slate-900">
                                {tenant.owner.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {tenant.owner.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={`${status.bgColor} ${status.color} border-0`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDistanceToNow(new Date(tenant.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>{tenant.usage.orders} OS</span>
                            <span>{tenant.usage.customers} clientes</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
                            asChild
                          >
                            <Link href={`/admin/tenants/${tenant.id}`}>
                              Ver detalhes
                              <ExternalLink className="h-3 w-3 ml-1.5" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Mobile/Tablet Cards */}
          <div className="lg:hidden space-y-3">
            {data?.tenants.map((tenant) => {
              const status = statusConfig[tenant.status];
              const StatusIcon = status.icon;

              return (
                <Link
                  key={tenant.id}
                  href={`/admin/tenants/${tenant.id}`}
                  className="block"
                >
                  <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {tenant.name}
                          </h3>
                          <p className="text-sm text-slate-500 truncate">
                            {tenant.slug}
                          </p>
                        </div>
                        <Badge
                          className={`${status.bgColor} ${status.color} border-0 shrink-0`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>

                      {tenant.owner && (
                        <div className="mb-3 text-sm">
                          <p className="text-slate-700">{tenant.owner.name}</p>
                          <p className="text-slate-500 truncate">
                            {tenant.owner.email}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                        <span>
                          {tenant.usage.orders} OS • {tenant.usage.customers}{" "}
                          clientes
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(tenant.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <p className="text-sm text-slate-500 text-center sm:text-left">
            Mostrando {(page - 1) * data.pagination.limit + 1} a{" "}
            {Math.min(page * data.pagination.limit, data.pagination.total)} de{" "}
            {data.pagination.total} clientes
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.pagination.totalPages}
              className="border-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  Phone,
  Mail,
  Car,
  MessageCircle,
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
import { BirthdaySidebar } from "@/components/customers/BirthdaySidebar";
import { WhatsAppMessageMenu } from "@/components/whatsapp";
import { trpc } from "@/lib/trpc/provider";
import { toast } from "sonner";
import { exportToExcel, formatFilenameDate } from "@/lib/export";

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
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  // tRPC query
  const { data, isLoading, refetch } = trpc.customer.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
  });

  // tRPC mutation
  const deleteMutation = trpc.customer.delete.useMutation({
    onSuccess: () => {
      toast.success("Cliente excluído com sucesso");
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
      key: "name",
      header: "Nome",
      sortable: true,
      render: (customer) => (
        <div className="flex flex-col">
          <span className="font-medium">{customer.name}</span>
          {customer.document && (
            <span className="text-xs text-muted-foreground">
              {customer.document}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Contato",
      render: (customer) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-1.5 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              {customer.phone}
              {customer.whatsappOptIn && (
                <Badge
                  variant="success"
                  className="ml-1 text-[10px] px-1.5 py-0"
                >
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
          <WhatsAppMessageMenu
            customer={{
              name: customer.name,
              phone: customer.phone,
              whatsappOptIn: customer.whatsappOptIn,
            }}
            context="customer"
          />
        </div>
      ),
    },
    {
      key: "vehicles",
      header: "Veículos",
      className: "text-center",
      render: (customer) => (
        <div className="flex items-center justify-center gap-1.5">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span>{customer._count.vehicles}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Cadastro",
      sortable: true,
      render: (customer) => (
        <span className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("pt-BR").format(
            new Date(customer.createdAt),
          )}
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
    <>
      <BirthdaySidebar />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie seus clientes e seus veículos
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton search={search} />
            <Button asChild>
              <Link href="/dashboard/customers/new">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Link>
            </Button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
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
            onRowClick={(customer) =>
              router.push(`/dashboard/customers/${customer.id}`)
            }
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
        </div>

        {/* Mobile List */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))
          ) : customers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center space-y-4">
                <p className="text-muted-foreground">
                  Nenhum cliente encontrado.
                </p>
                <Button asChild>
                  <Link href="/dashboard/customers/new">Cadastrar Cliente</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {customers.map((customer: any) => (
                <div
                  key={customer.id}
                  className="bg-card border border-border/50 rounded-xl p-4 space-y-4 active:bg-muted/30 transition-colors"
                  onClick={() =>
                    router.push(`/dashboard/customers/${customer.id}`)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{customer.name}</p>
                        {customer.document && (
                          <p className="text-xs text-muted-foreground">
                            {customer.document}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mr-2 h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/customers/${customer.id}`}>
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/customers/${customer.id}/edit`}
                          >
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(customer);
                          }}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{customer.phone}</span>
                      {customer.whatsappOptIn && (
                        <Badge
                          variant="success"
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          WA
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <span>
                        {customer._count.vehicles} veículos cadastrados
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Cadastrado em{" "}
                      {new Intl.DateTimeFormat("pt-BR").format(
                        new Date(customer.createdAt),
                      )}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/customers/${customer.id}`}>
                        Ver <ChevronRight className="ml-1 h-3 w-3" />
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
                      setPage((p) =>
                        Math.min(pagination?.totalPages || 1, p + 1),
                      )
                    }
                    disabled={page === (pagination?.totalPages || 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Cliente</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o cliente{" "}
                <strong>{customerToDelete?.name}</strong>? Esta ação não pode
                ser desfeita.
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
    </>
  );
}

function ExportButton({ search }: { search?: string }) {
  const { refetch, isFetching } = trpc.customer.listAll.useQuery(
    { search },
    { enabled: false },
  );

  const handleExport = async () => {
    try {
      const { data } = await refetch();
      if (!data) return;

      const exportData = data.map((c: any) => ({
        Nome: c.name,
        Telefone: c.phone,
        Email: c.email || "",
        Documento: c.document || "",
        "WhatsApp Opt-In": c.whatsappOptIn ? "Sim" : "Não",
        Veículos: c._count.vehicles,
        Cadastro: new Intl.DateTimeFormat("pt-BR").format(
          new Date(c.createdAt),
        ),
      }));

      exportToExcel(exportData, `Clientes_${formatFilenameDate()}`, "Clientes");
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

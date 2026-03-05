"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  DollarSign,
  User,
  Car,
  Phone,
  Calendar,
  Clock,
  MoreHorizontal,
  FileText,
  Loader2,
  AlertTriangle,
  Eye,
  ClipboardCheck,
  Package,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Separator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  Input,
  Label,
} from "@/components/ui";
import {
  StatusBadge,
  OrderTimeline,
  PaymentDialog,
  ShareOrderButton,
  ContractPreviewModal,
} from "@/components/orders";
import { WhatsAppButton } from "@/components/whatsapp";
import { trpc } from "@/lib/trpc/provider";
import { toast } from "sonner";
import {
  DEFAULT_TEMPLATES,
  replaceTemplateVariables,
  getTrackingUrl,
} from "@/lib/whatsapp";
// Dynamic import for PDF button to avoid strict SSR issues with react-pdf
import dynamic from "next/dynamic";

const PDFDownloadButton = dynamic(
  () =>
    import("@/components/pdfs/PDFDownloadButton").then(
      (mod) => mod.PDFDownloadButton,
    ),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" size="sm" disabled>
        Carregando PDF...
      </Button>
    ),
  },
);

const ContractDownloadButton = dynamic(
  () =>
    import("@/components/pdfs/ContractDownloadButton").then(
      (mod) => mod.ContractDownloadButton,
    ),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" size="sm" disabled>
        Carregando Contrato...
      </Button>
    ),
  },
);

// Valid status transitions (matching backend)
const validNextStatuses: Record<string, { value: string; label: string }[]> = {
  AGENDADO: [
    { value: "EM_VISTORIA", label: "Iniciar Vistoria" },
    { value: "CANCELADO", label: "Cancelar OS" },
  ],
  EM_VISTORIA: [
    { value: "EM_EXECUCAO", label: "Iniciar Execução" },
    { value: "CANCELADO", label: "Cancelar OS" },
  ],
  EM_EXECUCAO: [
    { value: "AGUARDANDO_PAGAMENTO", label: "Finalizar Serviço" },
    { value: "CANCELADO", label: "Cancelar OS" },
  ],
  AGUARDANDO_PAGAMENTO: [{ value: "CONCLUIDO", label: "Concluir OS" }],
  CANCELADO: [{ value: "AGENDADO", label: "Reabrir OS" }],
};

const paymentMethodLabels: Record<string, string> = {
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  DINHEIRO: "Dinheiro",
  TRANSFERENCIA: "Transferência",
};

const INSPECTION_TYPE_LABELS: Record<string, { label: string; emoji: string }> =
  {
    entrada: { label: "Entrada", emoji: "📥" },
    intermediaria: { label: "Intermediária", emoji: "🔄" },
    final: { label: "Saída", emoji: "✅" },
  };

function InspectionsSection({ orderId }: { orderId: string }) {
  const { data: inspections, isLoading } = trpc.inspection.list.useQuery({
    orderId,
  });
  const { data: settings } = trpc.settings.get.useQuery();

  const inspectionRequired = (settings as any)?.inspectionRequired || "NONE";
  const isEntryRequired =
    inspectionRequired === "ENTRY" || inspectionRequired === "BOTH";
  const isExitRequired =
    inspectionRequired === "EXIT" || inspectionRequired === "BOTH";
  const noInspectionRequired = inspectionRequired === "NONE";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vistorias</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const entradaInspection = inspections?.find((i: any) => i.type === "entrada");
  const saidaInspection = inspections?.find((i: any) => i.type === "final");

  const entradaStatus =
    entradaInspection?.status === "concluida"
      ? "ok"
      : entradaInspection
        ? "andamento"
        : "pendente";
  const saidaStatus =
    saidaInspection?.status === "concluida"
      ? "ok"
      : saidaInspection
        ? "andamento"
        : "pendente";

  const getStatusMessage = () => {
    if (noInspectionRequired) return "Vistorias são opcionais nesta oficina";
    if (isEntryRequired && isExitRequired) {
      if (entradaStatus === "ok" && saidaStatus === "ok")
        return "Todas as vistorias obrigatórias concluídas";
      return "Complete as vistorias de Entrada e Saída";
    }
    if (isEntryRequired) {
      if (entradaStatus === "ok") return "Vistoria de Entrada concluída";
      return "Complete a vistoria de Entrada";
    }
    if (isExitRequired) {
      if (saidaStatus === "ok") return "Vistoria de Saída concluída";
      return "Complete a vistoria de Saída";
    }
    return "Complete as vistorias";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Vistorias</CardTitle>
          <CardDescription>{getStatusMessage()}</CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href={`/dashboard/orders/${orderId}/inspection`}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Gerenciar
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Entrada */}
        <Link
          href={`/dashboard/orders/${orderId}/inspection/entrada`}
          className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${
            isEntryRequired
              ? "bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100/50"
              : "bg-muted/50 hover:bg-muted"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📥</span>
            <div>
              <p className="font-medium group-hover:text-primary transition-colors">
                Entrada
              </p>
              <p
                className={`text-xs ${
                  isEntryRequired
                    ? "text-amber-700 dark:text-amber-300 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {isEntryRequired ? "⚠️ Obrigatória" : "Opcional"}
              </p>
            </div>
          </div>
          <Badge
            variant={
              entradaStatus === "ok"
                ? "default"
                : entradaStatus === "andamento"
                  ? "secondary"
                  : "outline"
            }
            className={entradaStatus === "ok" ? "bg-green-500" : ""}
          >
            {entradaStatus === "ok"
              ? "✓ Concluída"
              : entradaStatus === "andamento"
                ? `${entradaInspection?.progress || 0}%`
                : "Pendente"}
          </Badge>
        </Link>

        {/* Saída */}
        <Link
          href={`/dashboard/orders/${orderId}/inspection/final`}
          className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${
            isExitRequired
              ? "bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100/50"
              : "bg-muted/50 hover:bg-muted"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-medium group-hover:text-primary transition-colors">
                Saída
              </p>
              <p
                className={`text-xs ${
                  isExitRequired
                    ? "text-amber-700 dark:text-amber-300 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {isExitRequired ? "⚠️ Obrigatória" : "Opcional"}
              </p>
            </div>
          </div>
          <Badge
            variant={
              saidaStatus === "ok"
                ? "default"
                : saidaStatus === "andamento"
                  ? "secondary"
                  : "outline"
            }
            className={saidaStatus === "ok" ? "bg-green-500" : ""}
          >
            {saidaStatus === "ok"
              ? "✓ Concluída"
              : saidaStatus === "andamento"
                ? `${saidaInspection?.progress || 0}%`
                : "Pendente"}
          </Badge>
        </Link>

        {/* Info message when nothing is required */}
        {noInspectionRequired && (
          <div className="mt-2 text-xs text-muted-foreground text-center py-2 border-t">
            💡 O proprietário configurou as vistorias como opcionais.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [customProductData, setCustomProductData] = useState({
    name: "",
    costPrice: "",
    quantity: "1",
  });

  // Queries
  const orderQuery = trpc.order.getById.useQuery({ id });
  const productsQuery = trpc.product.list.useQuery(
    { limit: 50, search: productSearch },
    { enabled: addProductOpen },
  );
  const settingsQuery = trpc.settings.get.useQuery();
  const meQuery = trpc.user.me.useQuery();
  const utils = trpc.useUtils();

  // Mutations
  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      utils.order.getById.invalidate({ id });
      utils.order.list.invalidate(); // Update list too
      utils.order.getStats.invalidate(); // Update dashboard
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const reopenOrder = trpc.order.reopen.useMutation({
    onSuccess: () => {
      toast.success("Ordem de serviço reaberta");
      utils.order.getById.invalidate({ id });
      utils.order.list.invalidate();
      utils.order.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao reabrir ordem");
    },
  });

  const addPayment = trpc.order.addPayment.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso");
      utils.order.getById.invalidate({ id });
      setPaymentDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar pagamento");
    },
  });

  const addOrderProduct = trpc.order.addProduct.useMutation({
    onSuccess: () => {
      toast.success("Produto adicionado");
      utils.order.getById.invalidate({ id });
      setAddProductOpen(false);
      setProductSearch("");
      setCustomProductData({ name: "", costPrice: "", quantity: "1" });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar produto");
    },
  });

  const removeOrderProduct = trpc.order.removeProduct.useMutation({
    onSuccess: () => {
      toast.success("Produto removido");
      utils.order.getById.invalidate({ id });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover produto");
    },
  });

  const generateApprovalLink = trpc.order.generateApprovalLink.useMutation();

  const updateOrderProductQuantity =
    trpc.order.updateProductQuantity.useMutation({
      onSuccess: () => {
        utils.order.getById.invalidate({ id });
      },
      onError: (error) => {
        toast.error(error.message || "Erro ao atualizar quantidade");
      },
    });

  // Helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const formatDateTime = (dateString: string | Date) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({
      id,
      status: newStatus as any,
    });
  };

  const handleAddPayment = async (data: {
    method: string;
    amount: number;
    paidAt?: Date;
    notes?: string;
  }) => {
    await addPayment.mutateAsync({
      orderId: id,
      method: data.method as any,
      amount: data.amount,
      paidAt: data.paidAt,
      notes: data.notes,
    });
  };

  if (orderQuery.isLoading) {
    return (
      <div className="flex h-[50vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          Carregando detalhes da OS...
        </p>
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-destructive font-medium">Erro ao carregar OS</p>
        <p className="text-muted-foreground">
          {orderQuery.error?.message || "OS não encontrada"}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/orders")}
        >
          Voltar para Lista
        </Button>
      </div>
    );
  }

  const order = orderQuery.data;
  const nextStatuses = validNextStatuses[order.status] || [];

  // Use pre-calculated values from backend
  const paidAmount = order.paidAmount ?? 0;
  const balance = order.balance ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {order.code}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-muted-foreground">
              Criada em {formatDate(order.createdAt)} por {order.createdBy.name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          {/* Status Actions */}
          {order.status === "CONCLUIDO" ? (
            <ContractDownloadButton orderId={id} />
          ) : (
            <PDFDownloadButton orderId={id} />
          )}

          {order.vehicle.customer && (
            <>
              <WhatsAppButton
                phone={order.vehicle.customer.phone}
                message={replaceTemplateVariables(
                  DEFAULT_TEMPLATES.find((t) => t.key === "tracking_link")
                    ?.message || "",
                  {
                    nome: order.vehicle.customer.name.split(" ")[0],
                    veiculo: `${order.vehicle.brand} ${order.vehicle.model}`,
                    link: order.trackingUrl || getTrackingUrl(id),
                  },
                )}
                whatsappOptIn={order.vehicle.customer.whatsappOptIn}
                variant="outline"
                size="sm"
              />
              <ShareOrderButton
                orderId={id}
                customerName={order.vehicle.customer.name.split(" ")[0]}
                vehicleName={`${order.vehicle.brand} ${order.vehicle.model}`}
                trackingUrl={order.trackingUrl}
              />
            </>
          )}

          {nextStatuses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={updateStatus.isPending}
                  data-testid="status-trigger"
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Atualizar Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {nextStatuses.map((status: any) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => handleStatusChange(status.value)}
                    className={
                      status.value === "CANCELADO"
                        ? "text-destructive focus:text-destructive"
                        : ""
                    }
                    data-testid={`status-item-${status.value}`}
                  >
                    {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Inspection Button - Highlighted when in inspection status */}
          {(order.status === "EM_VISTORIA" || order.status === "AGENDADO") && (
            <Button variant="secondary" asChild>
              <Link href={`/dashboard/orders/${id}/inspection`}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Vistoria
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                data-testid="order-actions-menu"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/orders/${id}/inspection`}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Vistorias
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/orders/${id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar OS
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!settingsQuery.data?.contractTemplate) {
                    toast.error(
                      "O proprietário precisa configurar o modelo de contrato nas configurações.",
                    );
                    return;
                  }
                  setContractModalOpen(true);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Contrato
              </DropdownMenuItem>

              {(order.status === "AGENDADO" ||
                order.status === "AGUARDANDO_APROVACAO") &&
                order.vehicle.customer && (
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        const result = await generateApprovalLink.mutateAsync({
                          orderId: id,
                        });
                        const baseUrl =
                          typeof window !== "undefined"
                            ? window.location.origin
                            : "";
                        const approvalUrl = `${baseUrl}/public/approve/${result.token}`;
                        const customerName =
                          order.vehicle.customer?.name?.split(" ")[0] ||
                          "Cliente";
                        const vehicleName = `${order.vehicle.brand} ${order.vehicle.model}`;
                        const total = new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(order.total));
                        const message = `Olá ${customerName}! 👋\n\nSeu orçamento para o veículo *${vehicleName}* está pronto.\n\n💰 Valor total: *${total}*\n\nAcesse o link abaixo para visualizar os detalhes e aprovar:\n${approvalUrl}\n\nQualquer dúvida estamos à disposição!`;
                        const phone =
                          order.vehicle.customer?.phone?.replace(/\D/g, "") ||
                          "";
                        const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, "_blank");
                        toast.success(
                          "Link de aprovação gerado! WhatsApp aberto.",
                        );
                        utils.order.getById.invalidate({ id });
                      } catch (err: unknown) {
                        const error = err as { message?: string };
                        toast.error(
                          error.message || "Erro ao gerar link de aprovação",
                        );
                      }
                    }}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Enviar Orçamento via WhatsApp
                  </DropdownMenuItem>
                )}
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer & Vehicle Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente e Veículo</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {/* Customer */}
              <div className="space-y-3">
                {!order.vehicle.customer ? (
                  <div className="rounded-md bg-amber-50 p-3 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Falta dados do cliente
                        </h3>
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                          Esta OS não possui cliente vinculado.
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          asChild
                          className="p-0 h-auto mt-2 text-amber-800 dark:text-amber-200 underline"
                        >
                          <Link
                            href={`/dashboard/vehicles/${order.vehicle.id}`}
                          >
                            Vincular Cliente
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Link
                        href={`/dashboard/customers/${order.vehicle.customer.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {order.vehicle.customer.name}
                      </Link>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.vehicle.customer.phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/vehicles/${order.vehicle.id}`}
                      className="font-mono font-medium hover:text-primary hover:underline"
                    >
                      {order.vehicle.plate}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {order.vehicle.brand} {order.vehicle.model} •{" "}
                      {order.vehicle.color}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Serviços</CardTitle>
              <CardDescription>
                {order.items.length} serviço(s) nesta ordem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {item.customName || item.service?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qtd: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                {order.discountValue && Number(order.discountValue) > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Desconto</span>
                    <span>-{formatCurrency(Number(order.discountValue))}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 📦 Products / Peças (Internal View) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Produtos / Peças (Uso Interno)
                </CardTitle>
                <CardDescription>
                  Materiais e peças utilizados nesta OS para cálculo de CMV
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddProductOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              {order.products.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Nenhum produto vinculado a esta ordem.
                </p>
              ) : (
                <div className="space-y-3">
                  {order.products.map((product: any) => (
                    <div
                      key={product.id}
                      className="flex items-start justify-between rounded-lg border border-border p-4 bg-muted/20"
                    >
                      <div>
                        <p className="font-medium">
                          {product.customName || product.product?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-semibold">
                            Qtd:
                          </Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={product.quantity}
                            className="h-7 w-20 text-xs px-2"
                            onChange={(e) => {
                              const qty = Number(e.target.value);
                              if (qty > 0) {
                                updateOrderProductQuantity.mutate({
                                  id: product.id,
                                  quantity: qty,
                                });
                              }
                            }}
                          />
                          <span className="text-[10px] text-muted-foreground italic">
                            • Custo Unitário:{" "}
                            {formatCurrency(Number(product.costPrice))}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="font-semibold text-sm">
                            Total:{" "}
                            {formatCurrency(
                              Number(product.costPrice) * product.quantity,
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (confirm("Deseja remover este produto?")) {
                              removeOrderProduct.mutate({ id: product.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t flex justify-end">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Custo Total de Materiais (CMV)
                      </p>
                      <p className="text-xl font-bold text-amber-600">
                        {formatCurrency(
                          order.products.reduce(
                            (acc: number, p: any) =>
                              acc + Number(p.costPrice) * p.quantity,
                            0,
                          ),
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Product Dialog */}
          <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Produto / Peça</DialogTitle>
                <DialogDescription>
                  Adicione itens para o cálculo de CMV desta OS.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Buscar no Estoque</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Nome do produto..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                  {productSearch &&
                    (productsQuery.data?.products?.length || 0) > 0 && (
                      <div className="border rounded-md divide-y overflow-hidden max-h-52 overflow-y-auto">
                        {productsQuery.data?.products.map((p: any) => (
                          <div
                            key={p.id}
                            className="w-full p-2 hover:bg-muted/50 text-sm flex justify-between items-center group"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[180px]">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Estoque: {p.stock} •{" "}
                                {formatCurrency(Number(p.costPrice))}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Quantity input that is only local to this row */}
                              <input
                                type="number"
                                defaultValue="1"
                                min="1"
                                className="w-12 h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                id={`search-qty-${p.id}`}
                              />
                              <Button
                                size="icon"
                                className="h-8 w-8"
                                disabled={addOrderProduct.isPending}
                                onClick={() => {
                                  const qtyInput = document.getElementById(
                                    `search-qty-${p.id}`,
                                  ) as HTMLInputElement;
                                  const qty = Number(qtyInput?.value || 1);
                                  addOrderProduct.mutate({
                                    orderId: id,
                                    productId: p.id,
                                    quantity: qty,
                                  });
                                }}
                              >
                                {addOrderProduct.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium">Item Manual / Miudezas</p>
                  <div className="space-y-2">
                    <Label className="text-xs">Nome do Item</Label>
                    <Input
                      placeholder="Ex: Parafusos, Estopa, etc."
                      value={customProductData.name}
                      onChange={(e) =>
                        setCustomProductData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Qtd</Label>
                      <Input
                        type="number"
                        value={customProductData.quantity}
                        onChange={(e) =>
                          setCustomProductData((prev) => ({
                            ...prev,
                            quantity: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Custo (R$)</Label>
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={customProductData.costPrice}
                        onChange={(e) =>
                          setCustomProductData((prev) => ({
                            ...prev,
                            costPrice: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full h-8"
                    size="sm"
                    disabled={
                      !customProductData.name ||
                      !customProductData.costPrice ||
                      addOrderProduct.isPending
                    }
                    onClick={() => {
                      addOrderProduct.mutate({
                        orderId: id,
                        customName: customProductData.name,
                        costPrice: Number(customProductData.costPrice),
                        quantity: Number(customProductData.quantity),
                      });
                    }}
                  >
                    {addOrderProduct.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Adicionar Item Manual"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 💰 Financial Breakdown (Owner/Manager Only) */}
          {["OWNER", "MANAGER"].includes(meQuery.data?.role || "") && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Gouvernança Financeira (Lucro Real)
                </CardTitle>
                <CardDescription>
                  Detalhamento de custos e margem líquida desta OS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Receita Bruta
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(Number(order.total))}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                      <Package className="h-3 w-3" /> CMV (Peças)
                    </p>
                    <p className="text-lg font-bold text-amber-600">
                      -
                      {formatCurrency(
                        order.products.reduce(
                          (acc: number, p: any) =>
                            acc + Number(p.costPrice) * p.quantity,
                          0,
                        ),
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" /> Comissões
                    </p>
                    <p className="text-lg font-bold text-amber-600">
                      -
                      {formatCurrency(
                        order.items.reduce(
                          (acc: number, item: any) =>
                            acc +
                            (item.commissions?.reduce(
                              (cAcc: number, c: any) =>
                                cAcc + Number(c.commissionValue),
                              0,
                            ) || 0),
                          0,
                        ),
                      )}
                    </p>
                  </div>
                  <div className="space-y-1 bg-background/50 p-2 rounded-md border border-primary/10">
                    <p className="text-[10px] uppercase font-bold text-primary tracking-wider">
                      Lucro Líquido
                    </p>
                    <p className="text-xl font-black text-primary">
                      {formatCurrency(
                        Number(order.total) -
                          order.products.reduce(
                            (acc: number, p: any) =>
                              acc + Number(p.costPrice) * p.quantity,
                            0,
                          ) -
                          order.items.reduce(
                            (acc: number, item: any) =>
                              acc +
                              (item.commissions?.reduce(
                                (cAcc: number, c: any) =>
                                  cAcc + Number(c.commissionValue),
                                0,
                              ) || 0),
                            0,
                          ),
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pagamentos</CardTitle>
                <CardDescription>
                  {balance > 0
                    ? `Saldo devedor: ${formatCurrency(balance)}`
                    : "Pagamento completo"}
                </CardDescription>
              </div>
              {balance > 0 && (
                <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Registrar Pagamento
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {order.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pagamento registrado
                </p>
              ) : (
                <div className="space-y-3">
                  {order.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {paymentMethodLabels[payment.method] ||
                              payment.method}
                          </Badge>
                          {payment.notes && (
                            <span className="text-sm text-muted-foreground">
                              • {payment.notes}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(payment.paidAt)}
                        </p>
                      </div>
                      <p className="font-semibold text-success">
                        +{formatCurrency(Number(payment.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Payment Summary */}
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Pago</span>
                  <span className="text-success font-medium">
                    {formatCurrency(paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo Devedor</span>
                  <span
                    className={
                      balance > 0
                        ? "text-destructive font-medium"
                        : "text-success font-medium"
                    }
                  >
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspections / Vistorias */}
          <InspectionsSection orderId={id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                currentStatus={order.status}
                scheduledAt={new Date(order.scheduledAt)}
                startedAt={
                  order.startedAt ? new Date(order.startedAt) : undefined
                }
                completedAt={
                  order.completedAt ? new Date(order.completedAt) : undefined
                }
                onReopen={() => reopenOrder.mutate({ id })}
                isReopening={reopenOrder.isPending}
              />
            </CardContent>
          </Card>

          {/* Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Agendada</p>
                  <p className="font-medium">
                    {formatDateTime(order.scheduledAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  <p className="font-medium">{order.assignedTo.name}</p>
                </div>
              </div>

              {order.startedAt && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Iniciado em</p>
                    <p className="font-medium">
                      {formatDateTime(order.startedAt)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        orderId={id}
        totalAmount={Number(order.total)}
        paidAmount={paidAmount}
        payments={order.payments.map((p: any) => ({
          id: p.id,
          method: p.method,
          amount: Number(p.amount),
          paidAt: p.paidAt,
          receivedBy: p.receivedBy,
          notes: p.notes,
        }))}
        onSubmit={handleAddPayment}
      />

      {/* Contract Preview Modal */}
      {order.vehicle.customer && settingsQuery.data?.contractTemplate && (
        <ContractPreviewModal
          open={contractModalOpen}
          onOpenChange={setContractModalOpen}
          template={settingsQuery.data.contractTemplate}
          orderData={{
            customerName: order.vehicle.customer.name,
            customerPhone: order.vehicle.customer.phone,
            vehicleName: `${order.vehicle.brand} ${order.vehicle.model}`,
            vehiclePlate: order.vehicle.plate,
            vehicleColor: order.vehicle.color,
            services: order.items.map((item: any) => ({
              name: item.customName || item.service?.name || "Serviço",
              price: Number(item.price),
              quantity: item.quantity,
            })),
            total: Number(order.total),
            tenantName: settingsQuery.data.name,
            tenantCnpj: settingsQuery.data.cnpj,
          }}
        />
      )}
    </div>
  );
}

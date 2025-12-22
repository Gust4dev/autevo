'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Printer,
  Send,
  Loader2,
  AlertTriangle,
  Eye,
  ClipboardCheck,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { StatusBadge, OrderTimeline, PaymentDialog, ShareOrderButton } from '@/components/orders';
import { trpc } from '@/lib/trpc/provider';
import { toast } from 'sonner';
// Dynamic import for PDF button to avoid strict SSR issues with react-pdf
import dynamic from 'next/dynamic';

const PDFDownloadButton = dynamic(
    () => import('@/components/pdfs/PDFDownloadButton').then(mod => mod.PDFDownloadButton),
    { ssr: false, loading: () => <Button variant="outline" size="sm" disabled>Carregando PDF...</Button> }
);

const ContractDownloadButton = dynamic(
    () => import('@/components/pdfs/ContractDownloadButton').then(mod => mod.ContractDownloadButton),
    { ssr: false, loading: () => <Button variant="outline" size="sm" disabled>Carregando Contrato...</Button> }
);


// Valid status transitions (matching backend)
const validNextStatuses: Record<string, { value: string; label: string }[]> = {
  AGENDADO: [
    { value: 'EM_VISTORIA', label: 'Iniciar Vistoria' },
    { value: 'CANCELADO', label: 'Cancelar OS' },
  ],
  EM_VISTORIA: [
    { value: 'EM_EXECUCAO', label: 'Iniciar Execução' },
    { value: 'CANCELADO', label: 'Cancelar OS' },
  ],
  EM_EXECUCAO: [
    { value: 'AGUARDANDO_PAGAMENTO', label: 'Finalizar Serviço' },
    { value: 'CANCELADO', label: 'Cancelar OS' },
  ],
  AGUARDANDO_PAGAMENTO: [
    { value: 'CONCLUIDO', label: 'Concluir OS' },
  ],
};

const paymentMethodLabels: Record<string, string> = {
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito',
  DINHEIRO: 'Dinheiro',
  TRANSFERENCIA: 'Transferência',
};

const INSPECTION_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  entrada: { label: 'Entrada', emoji: '📥' },
  intermediaria: { label: 'Intermediária', emoji: '🔄' },
  final: { label: 'Saída', emoji: '✅' },
};

function InspectionsSection({ orderId }: { orderId: string }) {
  const { data: inspections, isLoading } = trpc.inspection.list.useQuery({ orderId });

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

  // Get status for each type
  const entradaInspection = inspections?.find(i => i.type === 'entrada');
  const saidaInspection = inspections?.find(i => i.type === 'final');
  
  const entradaStatus = entradaInspection?.status === 'concluida' ? 'ok' : entradaInspection ? 'andamento' : 'pendente';
  const saidaStatus = saidaInspection?.status === 'concluida' ? 'ok' : saidaInspection ? 'andamento' : 'pendente';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Vistorias</CardTitle>
          <CardDescription>
            {entradaStatus === 'ok' && saidaStatus === 'ok' 
              ? 'Todas as vistorias obrigatórias concluídas' 
              : 'Complete as vistorias obrigatórias'
            }
          </CardDescription>
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
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📥</span>
            <div>
              <p className="font-medium group-hover:text-primary transition-colors">
                Entrada
              </p>
              <p className="text-xs text-muted-foreground">Obrigatória</p>
            </div>
          </div>
          <Badge 
            variant={entradaStatus === 'ok' ? 'default' : entradaStatus === 'andamento' ? 'secondary' : 'outline'}
            className={entradaStatus === 'ok' ? 'bg-green-500' : ''}
          >
            {entradaStatus === 'ok' ? '✓ Concluída' : entradaStatus === 'andamento' ? `${entradaInspection?.progress || 0}%` : 'Pendente'}
          </Badge>
        </Link>

        {/* Saída */}
        <Link
          href={`/dashboard/orders/${orderId}/inspection/final`}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-medium group-hover:text-primary transition-colors">
                Saída
              </p>
              <p className="text-xs text-muted-foreground">Obrigatória para concluir OS</p>
            </div>
          </div>
          <Badge 
            variant={saidaStatus === 'ok' ? 'default' : saidaStatus === 'andamento' ? 'secondary' : 'outline'}
            className={saidaStatus === 'ok' ? 'bg-green-500' : ''}
          >
            {saidaStatus === 'ok' ? '✓ Concluída' : saidaStatus === 'andamento' ? `${saidaInspection?.progress || 0}%` : 'Pendente'}
          </Badge>
        </Link>
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
  
  // Queries
  const orderQuery = trpc.order.getById.useQuery({ id });
  const utils = trpc.useUtils();

  // Mutations
  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Status atualizado com sucesso');
      utils.order.getById.invalidate({ id });
      utils.order.list.invalidate(); // Update list too
      utils.order.getStats.invalidate(); // Update dashboard
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });

  const addPayment = trpc.order.addPayment.useMutation({
    onSuccess: () => {
      toast.success('Pagamento registrado com sucesso');
      utils.order.getById.invalidate({ id });
      setPaymentDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao registrar pagamento');
    },
  });

  // Helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const formatDateTime = (dateString: string | Date) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({ 
      id, 
      status: newStatus as any 
    });
  };

  const handleAddPayment = async (data: { method: string; amount: number; paidAt?: Date; notes?: string }) => {
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
      <div className="flexh-[50vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando detalhes da OS...</p>
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-destructive font-medium">Erro ao carregar OS</p>
        <p className="text-muted-foreground">{orderQuery.error?.message || 'OS não encontrada'}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/orders')}>
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
        <div className="flex gap-2 pl-12 sm:pl-0">

          {/* Status Actions */}
          {order.status === 'CONCLUIDO' ? (
            <ContractDownloadButton orderId={id} />
          ) : (
            <PDFDownloadButton orderId={id} />
          )}
          
          {order.vehicle.customer && (
              <ShareOrderButton 
                orderId={id} 
                customerName={order.vehicle.customer.name.split(' ')[0]} 
                vehicleName={`${order.vehicle.brand} ${order.vehicle.model}`}
              />
          )}
            
          {nextStatuses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={updateStatus.isPending}>

                  {updateStatus.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Atualizar Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {nextStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => handleStatusChange(status.value)}
                    className={status.value === 'CANCELADO' ? 'text-destructive focus:text-destructive' : ''}
                  >
                    {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Inspection Button - Highlighted when in inspection status */}
          {(order.status === 'EM_VISTORIA' || order.status === 'AGENDADO') && (
            <Button variant="secondary" asChild>
              <Link href={`/dashboard/orders/${id}/inspection`}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Vistoria
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
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
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Send className="mr-2 h-4 w-4" />
                Enviar WhatsApp
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {order.vehicle.customer && (
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/customers/${order.vehicle.customer.id}`}>
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
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Falta dados do cliente</h3>
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                          Esta OS não possui cliente vinculado.
                        </p>
                        <Button variant="link" size="sm" asChild className="p-0 h-auto mt-2 text-amber-800 dark:text-amber-200 underline">
                          <Link href={`/dashboard/vehicles/${order.vehicle.id}`}>
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
                      {order.vehicle.brand} {order.vehicle.model} • {order.vehicle.color}
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
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
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

          {/* Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pagamentos</CardTitle>
                <CardDescription>
                  {balance > 0 
                    ? `Saldo devedor: ${formatCurrency(balance)}`
                    : 'Pagamento completo'
                  }
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
                  {order.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {paymentMethodLabels[payment.method] || payment.method}
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
                  <span className="text-success font-medium">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo Devedor</span>
                  <span className={balance > 0 ? 'text-destructive font-medium' : 'text-success font-medium'}>
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
                startedAt={order.startedAt ? new Date(order.startedAt) : undefined}
                completedAt={order.completedAt ? new Date(order.completedAt) : undefined}
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
                  <p className="font-medium">{formatDateTime(order.scheduledAt)}</p>
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
                    <p className="font-medium">{formatDateTime(order.startedAt)}</p>
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
        payments={order.payments.map(p => ({
          id: p.id,
          method: p.method,
          amount: Number(p.amount),
          paidAt: p.paidAt,
          receivedBy: p.receivedBy,
          notes: p.notes,
        }))}
        onSubmit={handleAddPayment}
      />
    </div>
  );
}

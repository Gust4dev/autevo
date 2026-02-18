"use client";

import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ClipboardList,
  Calendar,
  Users,
  Loader2,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Crown,
  PartyPopper,
  MessageSquare,
  AlertTriangle,
  History,
} from "lucide-react";
import Link from "next/link";
import { openWhatsApp } from "@/lib/whatsapp";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui";
import { trpc } from "@/lib/trpc/provider";
import { cn } from "@/lib/cn";
import { toast } from "sonner";
import { useState } from "react";

export default function DashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Detect payment success
  const paymentSuccess = searchParams.get("payment") === "success";

  // Get subscription info
  const { data: subscription } = trpc.billing.getSubscription.useQuery();
  const isFounder =
    subscription?.isFounder || (user?.publicMetadata as any)?.isFoundingMember;

  // Show payment success toast
  useEffect(() => {
    if (paymentSuccess) {
      // Remove query param from URL
      router.replace("/dashboard", { scroll: false });

      // Show appropriate celebration toast
      setTimeout(() => {
        if (isFounder) {
          toast.success(
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <Crown className="h-5 w-5 text-amber-500" />
                Parabéns, Membro Fundador!
              </div>
              <p className="text-sm text-muted-foreground">
                Você garantiu acesso vitalício ao plano Premium pelo preço do
                Standard (R$ 140/mês). Obrigado por acreditar no Autevo desde o
                início!
              </p>
            </div>,
            { duration: 8000 },
          );
        } else {
          toast.success(
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <PartyPopper className="h-5 w-5 text-primary" />
                Pagamento Confirmado!
              </div>
              <p className="text-sm text-muted-foreground">
                Sua assinatura está ativa. Aproveite todos os recursos do
                Autevo!
              </p>
            </div>,
            { duration: 6000 },
          );
        }
      }, 500);
    }
  }, [paymentSuccess, isFounder, router]);

  const dashboardQuery = trpc.dashboard.getDashboardOverview.useQuery(
    undefined,
    {
      refetchInterval: 30000,
    },
  );

  // Destructure data with fallbacks
  const stats = dashboardQuery.data?.stats;
  const customerCount = dashboardQuery.data?.customerCount ?? 0;
  const recentOrders = dashboardQuery.data?.recentOrders ?? [];
  const todaySchedule = dashboardQuery.data?.todaySchedule ?? [];
  const tenantSlug = dashboardQuery.data?.tenantSlug;

  const inactiveQuery = trpc.customer.getInactive.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  const inactiveCustomers = inactiveQuery.data ?? [];

  const [isCopying, setIsCopying] = useState(false);

  const bookingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/booking/${tenantSlug}`
      : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl);
    setIsCopying(true);
    toast.success("Link copiado com sucesso!");
    setTimeout(() => setIsCopying(false), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatTime = (date: string | Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const isLoading = dashboardQuery.isLoading || !isUserLoaded;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_: any, i: number) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div
        id="dashboard-welcome"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Olá, {user?.firstName || "Usuário"} 👋
            </h1>
            {isFounder && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm">
                <Crown className="h-3 w-3 mr-1" />
                Fundador
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Aqui está o resumo do seu dia</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova OS
            </Link>
          </Button>
        </div>
      </div>

      {/* Booking Quick Access */}
      <Card className="border-primary/20 bg-primary/5 pb-0">
        <CardContent className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <LinkIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Seu Link de Agendamento Online
              </h3>
              <p className="text-xs text-muted-foreground">
                Compartilhe este link com seus clientes para receber
                agendamentos.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <div className="bg-background border rounded-md px-3 py-2 text-xs font-mono truncate max-w-full sm:max-w-xs lg:max-w-md">
              {bookingUrl}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex-1 sm:flex-none"
              >
                {isCopying ? "Copiado!" : <Copy className="h-4 w-4" />}
              </Button>
              <Button size="sm" asChild className="flex-1 sm:flex-none">
                <Link href={`/booking/${tenantSlug}`} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - 3 columns on lg/xl */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Agendamentos Hoje"
          value={stats?.todayOrders.toString() || "0"}
          description="Para hoje"
          icon={Calendar}
        />
        <StatCard
          title="OS em Andamento"
          value={stats?.inProgress.toString() || "0"}
          description="Em execução/vistoria"
          icon={ClipboardList}
        />
        <StatCard
          title="Clientes Totais"
          value={customerCount.toString()}
          description="Cadastrados"
          icon={Users}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Agenda de Hoje</CardTitle>
              <CardDescription>Próximos agendamentos</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!todaySchedule.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sem agendamentos para hoje.
              </p>
            ) : (
              todaySchedule.map((order: any) => (
                <ScheduleItem
                  key={order.id}
                  time={formatTime(order.scheduledAt)}
                  customer={
                    order.vehicle.customer?.name || "Cliente desconhecido"
                  }
                  vehicle={`${order.vehicle.brand} ${order.vehicle.model}`}
                  service={`${order.items.length} serviço(s)`}
                  status="confirmed"
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Ordens Recentes</CardTitle>
              <CardDescription>Últimas criadas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/orders">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {!recentOrders.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma ordem recente.
              </p>
            ) : (
              recentOrders.map((order: any) => (
                <OrderItem
                  key={order.id}
                  code={order.code}
                  customer={
                    order.vehicle.customer?.name || "Cliente desconhecido"
                  }
                  total={formatCurrency(Number(order.total))}
                  status={order.status}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Inactive Customers Alert */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-orange-500" />
                Clientes Ausentes
              </CardTitle>
              <CardDescription>
                Clientes que não retornam há algum tempo
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-normal">
              {inactiveCustomers.length} alerta
              {inactiveCustomers.length !== 1 ? "s" : ""}
            </Badge>
          </CardHeader>
          <CardContent>
            {inactiveQuery.isLoading ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !inactiveCustomers.length ? (
              <p className="text-sm text-muted-foreground py-8 text-center italic">
                Nenhum cliente ausente ou próximo do retorno no momento.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {inactiveCustomers.slice(0, 6).map((customer: any) => (
                  <InactiveCustomerItem
                    key={customer.id}
                    customer={customer}
                    tenantName={
                      dashboardQuery.data?.tenantName || "nossa oficina"
                    }
                  />
                ))}
              </div>
            )}
            {inactiveCustomers.length > 6 && (
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  E mais {inactiveCustomers.length - 6} clientes aguardando
                  contato.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          href="/dashboard/customers/new"
          title="Novo Cliente"
          description="Cadastrar cliente"
          icon={Users}
        />
        <div id="quick-action-new-os">
          <QuickActionCard
            href="/dashboard/orders/new"
            title="Nova OS"
            description="Criar ordem"
            icon={Calendar}
          />
        </div>
        <QuickActionCard
          href="/dashboard/products"
          title="Produtos"
          description="Controle de estoque"
          icon={ClipboardList}
        />
        <QuickActionCard
          href="/dashboard/services"
          title="Serviços"
          description="Gerenciar catálogo"
          icon={TrendingUp}
        />
      </div>
    </div>
  );
}

// Subcomponents

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  highlight,
  variant,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  highlight?: boolean;
  variant?: "default" | "warning";
}) {
  const iconBgClass =
    variant === "warning"
      ? "bg-orange-500/10"
      : highlight
        ? "bg-green-500/10"
        : "bg-primary/10";

  const iconTextClass =
    variant === "warning"
      ? "text-orange-500"
      : highlight
        ? "text-green-500"
        : "text-primary";

  const valueClass =
    variant === "warning"
      ? "text-orange-600"
      : highlight
        ? "text-green-600"
        : "";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        highlight
          ? "border-green-500/30 bg-green-500/5"
          : variant === "warning"
            ? "border-orange-500/30 bg-orange-500/5"
            : "bg-card/50 backdrop-blur-sm",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`rounded-xl p-2.5 ${iconBgClass} transition-colors duration-300 group-hover:scale-110`}
        >
          <Icon className={`h-4 w-4 ${iconTextClass}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function ScheduleItem({
  time,
  customer,
  vehicle,
  service,
  status,
}: {
  time: string;
  customer: string;
  vehicle: string;
  service: string;
  status: "confirmed" | "pending" | "cancelled";
}) {
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border/40 bg-card/30 p-3 transition-all hover:bg-card/80 hover:shadow-sm hover:border-primary/20">
      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Clock className="h-4 w-4 text-primary group-hover:text-white" />
        <span className="mt-0.5 text-[10px] font-bold text-primary group-hover:text-white">
          {time}
        </span>
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {customer === "Cliente desconhecido" ? (
            <span className="font-medium italic text-muted-foreground">
              Cliente desconhecido
            </span>
          ) : (
            <span className="font-medium">{customer}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {vehicle} • {service}
        </p>
      </div>
    </div>
  );
}

function OrderItem({
  code,
  customer,
  total,
  status,
}: {
  code: string;
  customer: string;
  customerId?: string;
  total: string;
  status: string;
}) {
  const statusConfig: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    AGENDADO: { label: "Agendado", variant: "secondary" },
    EM_VISTORIA: { label: "Em Vistoria", variant: "outline" },
    EM_EXECUCAO: { label: "Em Execução", variant: "default" },
    AGUARDANDO_PAGAMENTO: { label: "Aguardando Pag.", variant: "secondary" },
    CONCLUIDO: { label: "Concluído", variant: "outline" },
    CANCELADO: { label: "Cancelado", variant: "destructive" },
  };

  const config = statusConfig[status] || { label: status, variant: "outline" };

  return (
    <div className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/30 p-3 transition-all hover:bg-card/80 hover:shadow-sm hover:border-primary/20">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">{code}</span>
          <Badge
            variant={config.variant}
            className="text-[10px] uppercase tracking-wider font-bold"
          >
            {config.label}
          </Badge>
        </div>
        {customer === "Cliente desconhecido" ? (
          <p className="text-sm text-muted-foreground italic">
            Cliente desconhecido
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{customer}</p>
        )}
      </div>
      <div className="text-right">
        <span className="font-semibold">{total}</span>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 bg-card/50 backdrop-blur-sm group">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-5 w-5 text-primary group-hover:text-white" />
          </div>
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function InactiveCustomerItem({
  customer,
  tenantName,
}: {
  customer: any;
  tenantName: string;
}) {
  const handleContact = () => {
    const lastDate = new Intl.DateTimeFormat("pt-BR").format(
      new Date(customer.lastServiceAt),
    );
    const message = `Olá ${customer.name}! Tudo bem?\n\nAqui é da ${tenantName}. Notamos que faz cerca de ${customer.daysSinceLastService} dias que você trouxe seu ${customer.vehicleName} para o último serviço (em ${lastDate}).\n\nQue tal agendar uma revisão para garantir que está tudo certo com seu carro?`;

    openWhatsApp(customer.phone, message);
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/20 hover:bg-card/50 transition-colors group">
      <div className="flex-1 min-w-0 mr-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold truncate">{customer.name}</span>
          {customer.status === "inactive" ? (
            <Badge
              variant="destructive"
              className="h-4 px-1 text-[8px] uppercase font-black"
            >
              Crítico
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="h-4 px-1 text-[8px] uppercase font-black bg-orange-100 text-orange-700 border-orange-200"
            >
              Próximo
            </Badge>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
          <span className="truncate">
            {customer.vehicleName} • {customer.daysSinceLastService} dias
            ausente
          </span>
          <span className="truncate italic">
            Último:{" "}
            {new Date(customer.lastServiceAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0 rounded-full shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
        onClick={handleContact}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
    </div>
  );
}

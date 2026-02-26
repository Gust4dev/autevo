"use client";

import {
  TrendingUp,
  Wallet,
  Receipt,
  ArrowLeft,
  Users,
  DollarSign,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { exportToExcel, formatFilenameDate } from "@/lib/export";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/provider";
import { cn } from "@/lib/cn";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useUser } from "@clerk/nextjs";

const RevenueChart = dynamic(() => import("@/components/charts/RevenueChart"), {
  loading: () => <Skeleton className="h-[300px] w-full" />,
  ssr: false,
});

export default function FinancialDashboardPage() {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role as string | undefined;

  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data, isLoading } = trpc.dashboard.getFinancialOverview.useQuery(
    {
      from: dateRange.from,
      to: dateRange.to,
    },
    {
      refetchInterval: 30000,
    },
  );

  const { data: topServices, isLoading: isLoadingServices } =
    trpc.report.getTopServices.useQuery(
      {
        from: dateRange.from,
        to: dateRange.to,
      },
      { enabled: !!data },
    );

  const { data: topCustomers, isLoading: isLoadingCustomers } =
    trpc.report.getCustomerReport.useQuery(
      {
        from: dateRange.from,
        to: dateRange.to,
      },
      { enabled: !!data },
    );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleExport = () => {
    if (!data) return;

    const rows: any[][] = [];

    // --- SECTION 1: CABEÇALHO PRINCIPAL ---
    rows.push(["RELATÓRIO FINANCEIRO MESTRE"]);
    rows.push([
      "Período:",
      `${format(dateRange.from, "dd/MM/yyyy")} a ${format(
        dateRange.to,
        "dd/MM/yyyy",
      )}`,
    ]);
    rows.push([]); // Spacing

    // --- SECTION 2: RESUMO EXECUTIVO (Em colunas como solicitado) ---
    rows.push(["RESUMO EXECUTIVO"]);
    rows.push([
      "Faturamento (OS)",
      "Pagamentos Recebidos",
      "Ticket Médio",
      "OS Concluídas",
      "OS Abertas",
      "Custo de Equipe",
    ]);
    rows.push([
      formatCurrency(data.stats.revenue),
      formatCurrency(data.stats.revenue), // Baseado no faturamento do período
      formatCurrency(data.stats.avgTicket),
      data.stats.completedOrders,
      data.openOrdersCount,
      formatCurrency(data.team.totalPayroll),
    ]);
    rows.push([]); // Spacing
    rows.push([]); // Spacing

    // --- SECTION 3: DETALHAMENTO DE FATURAMENTO (OS CONCLUÍDAS) ---
    rows.push(["DETALHAMENTO DE FATURAMENTO (OS CONCLUÍDAS)"]);
    rows.push(["Código OS", "Cliente", "Data Conclusão", "Valor OS", "Status"]);
    if (data.detailedCompletedOrders?.length) {
      data.detailedCompletedOrders.forEach((os: any) => {
        rows.push([
          os.code,
          os.vehicle?.customer?.name || "N/A",
          format(new Date(os.completedAt), "dd/MM/yyyy"),
          formatCurrency(Number(os.total)),
          "Concluída",
        ]);
      });
    } else {
      rows.push(["Nenhuma OS concluída no período"]);
    }
    rows.push([]); // Spacing
    rows.push([]); // Spacing

    // --- SECTION 4: DETALHAMENTO DE PAGAMENTOS RECEBIDOS ---
    rows.push(["DETALHAMENTO DE PAGAMENTOS RECEBIDOS"]);
    rows.push([
      "Data Pagamento",
      "Código OS",
      "Cliente",
      "Valor Recebido",
      "Forma de Pagamento",
      "Recebido Por",
    ]);
    if (data.detailedPayments?.length) {
      data.detailedPayments.forEach((p: any) => {
        rows.push([
          format(new Date(p.paidAt), "dd/MM/yyyy HH:mm"),
          p.order.code,
          p.order.vehicle?.customer?.name || "N/A",
          formatCurrency(Number(p.amount)),
          p.method,
          p.receivedBy || "-",
        ]);
      });
    } else {
      rows.push(["Nenhum pagamento registrado no período"]);
    }
    rows.push([]); // Spacing
    rows.push([]); // Spacing

    // --- SECTION 5: CUSTO E PERFORMANCE DE EQUIPE ---
    rows.push(["CUSTO E PERFORMANCE DE EQUIPE"]);
    rows.push([
      "Funcionário",
      "Cargo",
      "OS Realizadas",
      "Receita Gerada",
      "Salário Fixo",
      "Comissão",
      "Total a Pagar",
      "ROI",
    ]);
    if (data.team.users?.length) {
      data.team.users.forEach((u: any) => {
        rows.push([
          u.name,
          u.jobTitle,
          u.ordersCount,
          formatCurrency(u.revenueGenerated),
          formatCurrency(u.fixedSalary),
          formatCurrency(u.commissions),
          formatCurrency(u.totalPayout),
          u.roi.toFixed(2),
        ]);
      });
    }
    rows.push([]); // Spacing
    rows.push([]); // Spacing

    // --- SECTION 6: ORDENS DE SERVIÇO ABERTAS (BACKLOG) ---
    rows.push(["ORDENS DE SERVIÇO ABERTAS (BACKLOG)"]);
    rows.push([
      "Código OS",
      "Cliente",
      "Data Agendada",
      "Valor Previsto",
      "Status Atual",
    ]);
    if (data.detailedOpenOrders?.length) {
      data.detailedOpenOrders.forEach((os: any) => {
        rows.push([
          os.code,
          os.vehicle?.customer?.name || "N/A",
          format(new Date(os.scheduledAt), "dd/MM/yyyy"),
          formatCurrency(Number(os.total)),
          os.status,
        ]);
      });
    } else {
      rows.push(["Nenhuma OS aberta no momento"]);
    }

    exportToExcel(
      rows,
      `Relatorio_Financeiro_Mestre_${formatFilenameDate()}`,
      "Financeiro Completo",
    );
  };

  return (
    <RoleGuard
      allowed={["ADMIN_SAAS", "OWNER", "MANAGER", "ADMIN", "admin"]}
      fallback={<AccessDenied />}
    >
      <div className="space-y-8">
        <Header
          dateRange={dateRange}
          setDateRange={setDateRange}
          onExport={handleExport}
          isExportDisabled={!data || isLoading}
        />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="team">Equipe & RH</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab
              stats={data?.stats}
              chartData={data?.chartData}
              topServices={topServices}
              topCustomers={topCustomers}
              isLoading={isLoading || isLoadingServices || isLoadingCustomers}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <TeamTab
              data={data?.team}
              isLoading={isLoading}
              formatCurrency={formatCurrency}
            />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}

function Header({ dateRange, setDateRange, onExport, isExportDisabled }: any) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Financeiro
        </h1>
        <p className="text-muted-foreground">
          Gestão completa de faturamento, despesas e equipe.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border bg-card p-1">
          <input
            type="date"
            className="bg-transparent px-2 py-1 text-sm focus:outline-none"
            value={format(dateRange.from, "yyyy-MM-dd")}
            onChange={(e) =>
              setDateRange((prev: any) => ({
                ...prev,
                from: new Date(e.target.value + "T00:00:00"),
              }))
            }
          />
          <span className="text-muted-foreground px-1">até</span>
          <input
            type="date"
            className="bg-transparent px-2 py-1 text-sm focus:outline-none"
            value={format(dateRange.to, "yyyy-MM-dd")}
            onChange={(e) =>
              setDateRange((prev: any) => ({
                ...prev,
                to: new Date(e.target.value + "T23:59:59"),
              }))
            }
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExportDisabled}
        >
          <Receipt className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
      <p className="text-muted-foreground">
        Você não tem permissão para visualizar dados financeiros.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Voltar ao Dashboard</Link>
      </Button>
    </div>
  );
}

// --- Overview Components ---

function OverviewTab({
  stats,
  chartData,
  topServices,
  topCustomers,
  isLoading,
  formatCurrency,
}: any) {
  if (isLoading) return <OverviewSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Faturamento Bruto"
          value={formatCurrency(stats?.revenue || 0)}
          description="Total recebido no período"
          icon={TrendingUp}
          highlight
        />
        <StatCard
          title="CMV (Peças)"
          value={formatCurrency(stats?.cogs || 0)}
          description="Custo de materiais utilizados"
          icon={DollarSign}
          variant="danger"
        />
        <StatCard
          title="Comissões"
          value={formatCurrency(stats?.commissions || 0)}
          description="Total gerado para equipe"
          icon={Users}
          variant="warning"
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(stats?.profit || 0)}
          description="Margem real pós-custos"
          icon={TrendingUp}
          highlight
        />
        <StatCard
          title="A Receber"
          value={formatCurrency(stats?.receivables || 0)}
          description="Saldo pendente global"
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Evolução de Receita</CardTitle>
            <CardDescription>
              Faturamento diário no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <RevenueChart data={chartData || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Serviços Mais Vendidos</CardTitle>
            <CardDescription>Top 10 serviços por receita</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices?.map((service: any) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {service.count} ordens
                    </p>
                  </div>
                  <p className="font-bold text-sm">
                    {formatCurrency(service.totalRevenue)}
                  </p>
                </div>
              ))}
              {!topServices?.length && (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum serviço encontrado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de Clientes</CardTitle>
          <CardDescription>
            Clientes que mais geraram receita no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Qtd. Ordens</TableHead>
                <TableHead className="text-right">Total Gasto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCustomers?.map((customer: any) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.orderCount}</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>
                </TableRow>
              ))}
              {!topCustomers?.length && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}

// --- Team Tab Components ---

function TeamTab({ data, isLoading, formatCurrency }: any) {
  if (isLoading) return <TeamSkeleton />;

  return (
    <div className="space-y-6">
      {/* Top Cards for HR */}
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard
          title="Custo Total RH"
          value={formatCurrency(data?.totalPayroll || 0)}
          description="Salários Fixos + Comissões (Mês)"
          icon={Users}
          variant="danger" // Redrish for cost
        />
        <StatCard
          title="Fixo Comprometido"
          value={formatCurrency(data?.totalFixed || 0)}
          description="Soma dos salários base"
          icon={Briefcase}
        />
        <StatCard
          title="Comissões Geradas"
          value={formatCurrency(data?.totalCommissions || 0)}
          description="Variável baseada em produtividade"
          icon={DollarSign}
          highlight // Greenish for productivity (even though it's a cost, it implies revenue)
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance da Equipe</CardTitle>
          <CardDescription>
            Detalhamento de produtividade e custos por funcionário neste mês.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>OS Realizadas</TableHead>
                <TableHead>Receita Gerada</TableHead>
                <TableHead>Salário Fixo</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead className="text-right">Total a Pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          {user.jobTitle}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.jobTitle}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{user.ordersCount}</span>
                      <span className="text-muted-foreground text-xs">
                        ordens
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatCurrency(user.revenueGenerated)}
                  </TableCell>
                  <TableCell>{formatCurrency(user.fixedSalary)}</TableCell>
                  <TableCell>{formatCurrency(user.commissions)}</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(user.totalPayout)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CTA: Acerto de Comissões */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-lg">Acerto de Comissões</p>
              <p className="text-sm text-muted-foreground">
                Selecione, revise e pague as comissões pendentes da equipe.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="shadow-md w-full sm:w-auto">
            <Link href="/dashboard/financial/commissions">
              <Receipt className="mr-2 h-4 w-4" />
              Gerenciar Comissões
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}

// --- Shared Components ---

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
  variant?: "default" | "warning" | "danger";
}) {
  let bgClass = "bg-card/50 backdrop-blur-sm";
  let borderClass = "";
  let iconBgClass = "bg-primary/10";
  let iconTextClass = "text-primary";
  let valueClass = "";

  if (highlight) {
    bgClass = "bg-green-500/5";
    borderClass = "border-green-500/30";
    iconBgClass = "bg-green-500/10";
    iconTextClass = "text-green-500";
    valueClass = "text-green-600";
  } else if (variant === "warning") {
    bgClass = "bg-orange-500/5";
    borderClass = "border-orange-500/30";
    iconBgClass = "bg-orange-500/10";
    iconTextClass = "text-orange-500";
    valueClass = "text-orange-600";
  } else if (variant === "danger") {
    bgClass = "bg-red-500/5";
    borderClass = "border-red-500/30";
    iconBgClass = "bg-red-500/10";
    iconTextClass = "text-red-500";
    valueClass = "text-red-600";
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        bgClass,
        borderClass,
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

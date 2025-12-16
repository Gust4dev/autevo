'use client';

import { 
  TrendingUp, 
  Wallet, 
  Receipt,
  ArrowLeft,
  Users,
  DollarSign,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/provider';
import { cn } from '@/lib/cn';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useUser } from '@clerk/nextjs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function FinancialDashboardPage() {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role as string | undefined;

  const financialStatsQuery = trpc.dashboard.getFinancialStats.useQuery(undefined, { refetchInterval: 30000 });
  const chartDataQuery = trpc.dashboard.getFinancialChartData.useQuery();
  const teamStatsQuery = trpc.dashboard.getTeamFinancials.useQuery(undefined, { refetchInterval: 60000 });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <RoleGuard allowed={['OWNER', 'MANAGER']} fallback={<AccessDenied />}>
      <div className="space-y-8">
        <Header />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="team">Equipe & RH</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab 
              stats={financialStatsQuery.data} 
              chartData={chartDataQuery.data} 
              isLoading={financialStatsQuery.isLoading || chartDataQuery.isLoading} 
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <TeamTab 
              data={teamStatsQuery.data} 
              isLoading={teamStatsQuery.isLoading} 
              formatCurrency={formatCurrency}
            />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}

function Header() {
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
      <div className="flex gap-2">
        <Button variant="ghost" asChild>
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
      <p className="text-muted-foreground">Você não tem permissão para visualizar dados financeiros.</p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Voltar ao Dashboard</Link>
      </Button>
    </div>
  );
}

// --- Overview Components ---

function OverviewTab({ stats, chartData, isLoading, formatCurrency }: any) {
  if (isLoading) return <OverviewSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Faturamento Mês"
          value={formatCurrency(stats?.revenue || 0)}
          description="Recebido em pagamentos (Pix/Cartão)"
          icon={TrendingUp}
          highlight
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(stats?.avgTicket || 0)}
          description="Valor médio por OS concluída"
          icon={Receipt}
        />
        <StatCard
          title="A Receber"
          value={formatCurrency(stats?.receivables || 0)}
          description="Saldo pendente de OS finalizadas"
          icon={Wallet}
          variant="warning"
        />
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Evolução de Receita</CardTitle>
          <CardDescription>Faturamento diário neste mês</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={10} 
                  fontSize={12}
                  tickFormatter={(value) => value.split('/')[0]} // Show just the day
                />
                <YAxis 
                   tickLine={false} 
                   axisLine={false} 
                   tickFormatter={(val) => `R$${val}`}
                   fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Receita']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
                        <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs text-muted-foreground md:hidden">{user.jobTitle}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.jobTitle}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <span className="font-bold">{user.ordersCount}</span>
                       <span className="text-muted-foreground text-xs">ordens</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">{formatCurrency(user.revenueGenerated)}</TableCell>
                  <TableCell>{formatCurrency(user.fixedSalary)}</TableCell>
                  <TableCell>{formatCurrency(user.commissions)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(user.totalPayout)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
  variant?: 'default' | 'warning' | 'danger';
}) {
  let bgClass = 'bg-card/50 backdrop-blur-sm';
  let borderClass = '';
  let iconBgClass = 'bg-primary/10';
  let iconTextClass = 'text-primary';
  let valueClass = '';

  if (highlight) {
    bgClass = 'bg-green-500/5';
    borderClass = 'border-green-500/30';
    iconBgClass = 'bg-green-500/10';
    iconTextClass = 'text-green-500';
    valueClass = 'text-green-600';
  } else if (variant === 'warning') {
    bgClass = 'bg-orange-500/5';
    borderClass = 'border-orange-500/30';
    iconBgClass = 'bg-orange-500/10';
    iconTextClass = 'text-orange-500';
    valueClass = 'text-orange-600';
  } else if (variant === 'danger') {
    bgClass = 'bg-red-500/5';
    borderClass = 'border-red-500/30';
    iconBgClass = 'bg-red-500/10';
    iconTextClass = 'text-red-500';
    valueClass = 'text-red-600';
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      bgClass,
      borderClass
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-xl p-2.5 ${iconBgClass} transition-colors duration-300 group-hover:scale-110`}>
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

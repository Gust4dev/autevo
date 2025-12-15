'use client';

import { 
  TrendingUp, 
  Wallet, 
  Receipt,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/provider';
import { cn } from '@/lib/cn';
import { RoleGuard } from '@/components/auth/RoleGuard';

import { useUser } from '@clerk/nextjs';

// ...

export default function FinancialDashboardPage() {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role as string | undefined;
  const canAccess = userRole && ['OWNER', 'MANAGER'].includes(userRole);

  const financialStatsQuery = trpc.dashboard.getFinancialStats.useQuery(undefined, {
    enabled: !!canAccess,
    refetchInterval: 30000,
    retry: false, 
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isLoading = financialStatsQuery.isLoading;
  const isError = financialStatsQuery.isError;
  const error = financialStatsQuery.error;

  return (
    <RoleGuard allowed={['OWNER', 'MANAGER']} fallback={
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para visualizar dados financeiros.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Voltar ao Dashboard</Link>
        </Button>
      </div>
    }>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Financeiro
            </h1>
            <p className="text-muted-foreground">
              Visão geral de faturamento e recebíveis
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

        {isError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            Erro ao carregar dados: {error?.message}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatCard
                title="Faturamento Mês"
                value={formatCurrency(financialStatsQuery.data?.revenue || 0)}
                description="Recebido em pagamentos"
                icon={TrendingUp}
                highlight
              />
              <StatCard
                title="Ticket Médio"
                value={formatCurrency(financialStatsQuery.data?.avgTicket || 0)}
                description="Por OS concluída"
                icon={Receipt}
              />
              <StatCard
                title="A Receber"
                value={formatCurrency(financialStatsQuery.data?.receivables || 0)}
                description="Saldo em aberto"
                icon={Wallet}
                variant="warning"
              />
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}

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
  variant?: 'default' | 'warning';
}) {
  const iconBgClass = variant === 'warning' 
    ? 'bg-orange-500/10' 
    : highlight 
      ? 'bg-green-500/10' 
      : 'bg-primary/10';
  
  const iconTextClass = variant === 'warning' 
    ? 'text-orange-500' 
    : highlight 
      ? 'text-green-500' 
      : 'text-primary';

  const valueClass = variant === 'warning'
    ? 'text-orange-600'
    : highlight
      ? 'text-green-600'
      : '';

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      highlight ? 'border-green-500/30 bg-green-500/5' : variant === 'warning' ? 'border-orange-500/30 bg-orange-500/5' : 'bg-card/50 backdrop-blur-sm'
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

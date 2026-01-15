"use client";

import { trpc } from "@/lib/trpc/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  UserPlus,
  AlertCircle,
  Calendar,
  BarChart3,
  Zap,
  Settings,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } =
    trpc.admin.getDashboardStats.useQuery();
  const { data: pending, isLoading: pendingLoading } =
    trpc.admin.getPendingActivations.useQuery();
  const { data: expiring, isLoading: expiringLoading } =
    trpc.admin.getExpiringTrials.useQuery({ daysAhead: 7 });
  const { data: recentLogs } = trpc.admin.listAuditLogs.useQuery({ limit: 5 });
  const { data: sysConfig } = trpc.admin.getSystemConfig.useQuery();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const totalActive =
    (stats?.byStatus.active || 0) + (stats?.byStatus.trial || 0);
  const monthlyPrice = sysConfig
    ? Number(sysConfig.pro_monthly_price.value)
    : 297;
  const mrr = (stats?.byStatus.active || 0) * monthlyPrice;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Visão geral do Autevo •{" "}
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-slate-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
            asChild
          >
            <Link href="/admin/settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {((pending?.length || 0) > 0 || (expiring?.length || 0) > 0) && (
        <div className="mb-6 space-y-3">
          {(pending?.length || 0) > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900">
                  {pending?.length} cliente(s) aguardando ativação do Pix
                </p>
                <p className="text-sm text-amber-700">
                  Clientes que pagaram e precisam ter o trial ativado
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
                asChild
              >
                <Link href="/admin/tenants?status=PENDING_ACTIVATION">
                  Ver lista
                </Link>
              </Button>
            </div>
          )}

          {(expiring?.length || 0) > 0 && (
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-orange-900">
                  {expiring?.length} trial(s) expirando nos próximos 7 dias
                </p>
                <p className="text-sm text-orange-700">
                  Oportunidade para converter em clientes pagantes
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
                asChild
              >
                <Link href="/admin/tenants?status=TRIAL">Ver lista</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total de Clientes"
          value={stats?.totalTenants || 0}
          icon={Users}
          subtitle="Todas as contas"
          trend={{ value: 12, isPositive: true }}
          color="indigo"
        />
        <StatCard
          title="Clientes Ativos"
          value={totalActive}
          icon={CheckCircle}
          subtitle="Trial + Pagantes"
          trend={{ value: 8, isPositive: true }}
          color="emerald"
        />
        <StatCard
          title="MRR Estimado"
          value={`R$ ${mrr.toLocaleString("pt-BR")}`}
          icon={DollarSign}
          subtitle="Receita mensal recorrente"
          trend={{ value: 15, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Aguardando"
          value={stats?.byStatus.pendingActivation || 0}
          icon={Clock}
          subtitle="Pendentes de ativação"
          color="amber"
          urgent={(stats?.byStatus.pendingActivation || 0) > 0}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <MiniStatCard
          label="Em Trial"
          value={stats?.byStatus.trial || 0}
          icon={Activity}
          color="blue"
        />
        <MiniStatCard
          label="Ativos (Pagantes)"
          value={stats?.byStatus.active || 0}
          icon={CheckCircle}
          color="emerald"
        />
        <MiniStatCard
          label="Suspensos"
          value={stats?.byStatus.suspended || 0}
          icon={AlertTriangle}
          color="orange"
        />
        <MiniStatCard
          label="Cancelados"
          value={stats?.byStatus.canceled || 0}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Activations */}
        <Card className="lg:col-span-1 bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Aguardando Ativação
              </CardTitle>
              <p className="text-sm text-slate-500">
                Pagaram Pix, precisam ativar
              </p>
            </div>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
              {pending?.length || 0}
            </Badge>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : pending?.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-10 w-10 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhum pendente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending?.slice(0, 5).map((tenant) => (
                  <Link
                    key={tenant.id}
                    href={`/admin/tenants/${tenant.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <UserPlus className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {tenant.owner?.email}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
                {(pending?.length || 0) > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    asChild
                  >
                    <Link href="/admin/tenants?status=PENDING_ACTIVATION">
                      Ver todos ({pending?.length})
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Trials */}
        <Card className="lg:col-span-1 bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Trials Expirando
              </CardTitle>
              <p className="text-sm text-slate-500">Próximos 7 dias</p>
            </div>
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
              {expiring?.length || 0}
            </Badge>
          </CardHeader>
          <CardContent>
            {expiringLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : expiring?.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhum expirando</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expiring?.slice(0, 5).map((tenant) => (
                  <Link
                    key={tenant.id}
                    href={`/admin/tenants/${tenant.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-orange-600 font-medium">
                        {tenant.daysRemaining}d restantes
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1 bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Atividade Recente
              </CardTitle>
              <p className="text-sm text-slate-500">Últimas ações no sistema</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-indigo-600 hover:text-indigo-700"
              asChild
            >
              <Link href="/admin/logs">Ver tudo</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!recentLogs?.logs.length ? (
              <div className="text-center py-8">
                <Activity className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhuma atividade</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs?.logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 truncate">
                        {log.action.replace(/_/g, " ").toLowerCase()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {log.tenantName} •{" "}
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickActionCard
            href="/admin/tenants"
            icon={Users}
            title="Gerenciar Tenants"
            description="Ver todos os clientes"
          />
          <QuickActionCard
            href="/admin/tenants?status=PENDING_ACTIVATION"
            icon={UserPlus}
            title="Ativar Trials"
            description="Clientes pendentes"
            badge={pending?.length}
          />
          <QuickActionCard
            href="/admin/logs"
            icon={Activity}
            title="Audit Logs"
            description="Histórico de ações"
          />
          <QuickActionCard
            href="/admin/tenants?status=TRIAL"
            icon={BarChart3}
            title="Trials Ativos"
            description="Acompanhar conversão"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  color,
  urgent,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
  trend?: { value: number; isPositive: boolean };
  color: "indigo" | "emerald" | "green" | "amber" | "blue" | "orange" | "red";
  urgent?: boolean;
}) {
  const colorStyles = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <Card
      className={`bg-white border-slate-200 shadow-sm ${
        urgent ? "ring-2 ring-amber-400 ring-offset-2" : ""
      }`}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center ${colorStyles[color]}`}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
          {value}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 truncate">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function MiniStatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "emerald" | "orange" | "red";
}) {
  const colorStyles = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    orange: "text-orange-600 bg-orange-50",
    red: "text-red-600 bg-red-50",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`h-7 w-7 rounded-lg flex items-center justify-center ${colorStyles[color]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xl font-bold text-slate-900">{value}</span>
      </div>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
          <Icon className="h-5 w-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
        </div>
        {badge !== undefined && badge > 0 && (
          <Badge className="bg-amber-100 text-amber-700">{badge}</Badge>
        )}
      </div>
      <h3 className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </Link>
  );
}

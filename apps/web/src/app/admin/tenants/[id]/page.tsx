"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Users,
  ClipboardList,
  Car,
  Wrench,
  Calendar,
  Timer,
  Hourglass,
  Ban,
  CreditCard,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TenantStatus } from "@prisma/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [extendDays, setExtendDays] = useState(30);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [newPlan, setNewPlan] = useState<string>("");

  const {
    data: tenant,
    isLoading,
    refetch,
  } = trpc.admin.getTenantDetails.useQuery({ tenantId });

  const activateMutation = trpc.admin.activateTrial.useMutation({
    onSuccess: () => {
      toast.success("Trial ativado com sucesso!");
      refetch();
      setShowActivateDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const extendMutation = trpc.admin.extendTrial.useMutation({
    onSuccess: () => {
      toast.success(`Trial estendido em ${extendDays} dias!`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const suspendMutation = trpc.admin.suspendTenant.useMutation({
    onSuccess: () => {
      toast.success("Conta suspensa");
      refetch();
      setShowSuspendDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const reactivateMutation = trpc.admin.reactivateTenant.useMutation({
    onSuccess: () => {
      toast.success("Conta reativada!");
      refetch();
      setShowReactivateDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelMutation = trpc.admin.cancelTenant.useMutation({
    onSuccess: () => {
      toast.success("Conta cancelada permanentemente");
      refetch();
      setShowCancelDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePlanMutation = trpc.admin.updateTenantPlan.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado!");
      refetch();
      setShowPlanDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-4 sm:p-8">
        <p className="text-slate-600">Tenant não encontrado</p>
      </div>
    );
  }

  const status = statusConfig[tenant.status];
  const StatusIcon = status.icon;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 self-start"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {tenant.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Globe className="h-3.5 w-3.5" />
                <span>{tenant.slug}</span>
              </div>
            </div>
          </div>
        </div>
        <Badge
          className={`${status.bgColor} ${status.color} border-0 text-sm px-3 py-1.5 font-medium self-start sm:self-center`}
        >
          <StatusIcon className="h-4 w-4 mr-1.5" />
          {status.label}
        </Badge>
      </div>

      {/* Trial Countdown Banner */}
      {tenant.trialTimeRemaining && tenant.status === "TRIAL" && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6 overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Timer className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-0.5">
                    Tempo restante do Trial
                  </p>
                  {tenant.trialTimeRemaining.isExpired ? (
                    <p className="text-2xl sm:text-3xl font-bold text-red-600">
                      Expirado
                    </p>
                  ) : (
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                      {tenant.trialTimeRemaining.days}d{" "}
                      {tenant.trialTimeRemaining.hours}h{" "}
                      {tenant.trialTimeRemaining.minutes}m
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-1 sm:max-w-xs">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Progresso do trial</span>
                  <span className="font-medium text-slate-700">
                    {tenant.trialProgress}%
                  </span>
                </div>
                <Progress
                  value={tenant.trialProgress}
                  className="h-2.5 bg-blue-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Usage Banner */}
      {tenant.systemUsageTime && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-slate-100 rounded-xl">
          <Hourglass className="h-5 w-5 text-slate-500" />
          <span className="text-sm text-slate-600">
            Usando o sistema há{" "}
            <span className="text-slate-900 font-semibold">
              {tenant.systemUsageTime.totalDays} dias
            </span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg text-slate-900">
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100">
              <InfoRow label="ID" value={tenant.id} mono />
              <InfoRow label="Nome" value={tenant.name} />
              <InfoRow label="Slug" value={tenant.slug} />
              <InfoRow
                label="Plano"
                value={tenant.plan.replace("_", " ").toUpperCase()}
                badge
              />
              <InfoRow
                label="Criado em"
                value={format(
                  new Date(tenant.createdAt),
                  "dd/MM/yyyy 'às' HH:mm",
                  { locale: ptBR }
                )}
              />
              {tenant.trialStartedAt && (
                <InfoRow
                  label="Trial iniciado"
                  value={format(new Date(tenant.trialStartedAt), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                />
              )}
              {tenant.trialEndsAt && (
                <InfoRow
                  label="Trial expira"
                  value={`${format(new Date(tenant.trialEndsAt), "dd/MM/yyyy", {
                    locale: ptBR,
                  })} (${formatDistanceToNow(new Date(tenant.trialEndsAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })})`}
                />
              )}
            </CardContent>
          </Card>

          {/* Users */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-slate-900">Usuários</CardTitle>
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-600"
              >
                {tenant.users.length}
              </Badge>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {tenant.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-medium text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-slate-200 text-slate-700 border-0 self-start sm:self-center shrink-0">
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg text-slate-900">
                Métricas de Uso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <UsageStat
                  icon={ClipboardList}
                  label="Ordens"
                  value={tenant.usage.orders}
                  color="indigo"
                />
                <UsageStat
                  icon={Users}
                  label="Clientes"
                  value={tenant.usage.customers}
                  color="blue"
                />
                <UsageStat
                  icon={Car}
                  label="Veículos"
                  value={tenant.usage.vehicles}
                  color="purple"
                />
                <UsageStat
                  icon={Wrench}
                  label="Serviços"
                  value={tenant.usage.services}
                  color="emerald"
                />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                Última atividade:{" "}
                <span className="text-slate-700 font-medium">
                  {formatDistanceToNow(new Date(tenant.lastActivity), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg text-slate-900">Ações</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {tenant.status === "PENDING_ACTIVATION" && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={() => setShowActivateDialog(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Ativar Trial (60 dias)
                </Button>
              )}

              {tenant.status === "TRIAL" && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl">
                  <p className="text-sm font-medium text-slate-700">
                    Estender Trial
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={extendDays}
                      onChange={(e) => setExtendDays(Number(e.target.value))}
                      className="bg-white border-slate-200"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        extendMutation.mutate({
                          tenantId,
                          additionalDays: extendDays,
                        })
                      }
                      disabled={extendMutation.isPending}
                      className="shrink-0 border-slate-200"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Dias
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setNewPlan(tenant.plan);
                  setShowPlanDialog(true);
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Alterar Plano
              </Button>

              {["TRIAL", "ACTIVE", "PAST_DUE"].includes(tenant.status) && (
                <Button
                  variant="outline"
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                  onClick={() => setShowSuspendDialog(true)}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Suspender Conta
                </Button>
              )}

              {tenant.status === "SUSPENDED" && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  onClick={() => setShowReactivateDialog(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reativar Conta
                </Button>
              )}

              {tenant.status !== "CANCELED" && (
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Cancelar Permanentemente
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg text-slate-900">Contato</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {tenant.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <span className="text-slate-700">{tenant.email}</span>
                </div>
              )}
              {tenant.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-slate-500" />
                  </div>
                  <span className="text-slate-700">{tenant.phone}</span>
                </div>
              )}
              {!tenant.email && !tenant.phone && (
                <p className="text-sm text-slate-400 text-center py-2">
                  Nenhuma informação de contato
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AlertDialog
        open={showActivateDialog}
        onOpenChange={setShowActivateDialog}
      >
        <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">
              Ativar Trial
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Isso ativará o trial de 60 dias para{" "}
              <span className="text-slate-900 font-medium">{tenant.name}</span>.
              O cliente poderá acessar o sistema imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-slate-200">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                activateMutation.mutate({ tenantId, trialDays: 60 })
              }
              disabled={activateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {activateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ativar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">
              Suspender Conta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Isso suspenderá imediatamente o acesso de{" "}
              <span className="text-slate-900 font-medium">{tenant.name}</span>{" "}
              ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-slate-200">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => suspendMutation.mutate({ tenantId })}
              disabled={suspendMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {suspendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Suspender"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
      >
        <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">
              Reativar Conta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Escolha como reativar a conta de{" "}
              <span className="text-slate-900 font-medium">{tenant.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2">
            <AlertDialogCancel className="border-slate-200">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                reactivateMutation.mutate({
                  tenantId,
                  asStatus: "TRIAL",
                  trialDays: 60,
                })
              }
              disabled={reactivateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Como Trial (60 dias)
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() =>
                reactivateMutation.mutate({ tenantId, asStatus: "ACTIVE" })
              }
              disabled={reactivateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Como Ativo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Cancelar Conta Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Esta ação marcará a conta de{" "}
              <span className="text-slate-900 font-medium">{tenant.name}</span>{" "}
              como cancelada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-slate-200">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate({ tenantId })}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Cancelar Conta"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">
              Alterar Plano
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Selecione o novo plano para{" "}
              <span className="text-slate-900 font-medium">{tenant.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="pro_monthly">
                  Pro Mensal (R$ 297/mês)
                </SelectItem>
                <SelectItem value="pro_yearly">
                  Pro Anual (R$ 2.970/ano)
                </SelectItem>
                <SelectItem value="enterprise">
                  Enterprise (Sob consulta)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-slate-200">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                updatePlanMutation.mutate({
                  tenantId,
                  newPlan: newPlan as
                    | "pro_monthly"
                    | "pro_yearly"
                    | "enterprise",
                })
              }
              disabled={updatePlanMutation.isPending || !newPlan}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {updatePlanMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 px-6 py-4">
      <span className="text-sm text-slate-500">{label}</span>
      {badge ? (
        <Badge className="bg-indigo-100 text-indigo-700 border-0 w-fit">
          {value}
        </Badge>
      ) : (
        <span
          className={`text-sm text-slate-900 ${
            mono
              ? "font-mono text-xs bg-slate-100 px-2 py-1 rounded"
              : "font-medium"
          }`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

function UsageStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: "indigo" | "blue" | "purple" | "emerald";
}) {
  const colorStyles = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
      <div
        className={`h-10 w-10 rounded-xl ${colorStyles[color]} flex items-center justify-center mx-auto mb-2`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  );
}

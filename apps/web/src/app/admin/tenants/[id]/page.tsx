"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const statusConfig: Record<
  TenantStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING_ACTIVATION: {
    label: "Pendente",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Clock,
  },
  TRIAL: {
    label: "Trial",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Clock,
  },
  ACTIVE: {
    label: "Ativo",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle,
  },
  SUSPENDED: {
    label: "Suspenso",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: AlertTriangle,
  },
  PAST_DUE: {
    label: "Atrasado",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: AlertTriangle,
  },
  CANCELED: {
    label: "Cancelado",
    color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-8">
        <p className="text-zinc-300">Tenant não encontrado</p>
      </div>
    );
  }

  const status = statusConfig[tenant.status];
  const StatusIcon = status.icon;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
          <p className="text-zinc-300">{tenant.slug}</p>
        </div>
        <Badge
          variant="outline"
          className={`${status.color} text-sm px-3 py-1 font-medium`}
        >
          <StatusIcon className="h-4 w-4 mr-1" />
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="ID" value={tenant.id} mono />
              <InfoRow label="Nome" value={tenant.name} />
              <InfoRow label="Slug" value={tenant.slug} mono />
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
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">
                Usuários ({tenant.users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenant.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/80 rounded-lg border border-zinc-700/50"
                  >
                    <div>
                      <p className="font-medium text-zinc-100">{user.name}</p>
                      <p className="text-sm text-zinc-300">{user.email}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs bg-zinc-950 text-zinc-300 border-zinc-700"
                    >
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">
                Métricas de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <UsageStat
                  icon={ClipboardList}
                  label="Ordens"
                  value={tenant.usage.orders}
                />
                <UsageStat
                  icon={Users}
                  label="Clientes"
                  value={tenant.usage.customers}
                />
                <UsageStat
                  icon={Car}
                  label="Veículos"
                  value={tenant.usage.vehicles}
                />
                <UsageStat
                  icon={Wrench}
                  label="Serviços"
                  value={tenant.usage.services}
                />
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  Última atividade:{" "}
                  {formatDistanceToNow(new Date(tenant.lastActivity), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tenant.status === "PENDING_ACTIVATION" && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowActivateDialog(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Ativar Trial (60 dias)
                </Button>
              )}

              {tenant.status === "TRIAL" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={extendDays}
                      onChange={(e) => setExtendDays(Number(e.target.value))}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
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
                      className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Estender
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Adicionar dias ao trial
                  </p>
                </div>
              )}

              {["TRIAL", "ACTIVE", "PAST_DUE"].includes(tenant.status) && (
                <Button
                  variant="outline"
                  className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
                  onClick={() => setShowSuspendDialog(true)}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Suspender Conta
                </Button>
              )}

              {tenant.status === "SUSPENDED" && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setShowReactivateDialog(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reativar Conta
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activate Dialog */}
      <AlertDialog
        open={showActivateDialog}
        onOpenChange={setShowActivateDialog}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Ativar Trial
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Isso ativará o trial de 60 dias para{" "}
              <span className="text-white font-medium">{tenant.name}</span>. O
              cliente poderá acessar o sistema imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                activateMutation.mutate({ tenantId, trialDays: 60 })
              }
              disabled={activateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
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

      {/* Suspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Suspender Conta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Isso suspenderá imediatamente o acesso de{" "}
              <span className="text-white font-medium">{tenant.name}</span> ao
              sistema. Os dados serão mantidos e a conta pode ser reativada
              depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => suspendMutation.mutate({ tenantId })}
              disabled={suspendMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
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

      {/* Reactivate Dialog */}
      <AlertDialog
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Reativar Conta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Escolha como reativar a conta de{" "}
              <span className="text-white font-medium">{tenant.name}</span>:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 hover:text-white">
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Como Trial (60 dias)
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() =>
                reactivateMutation.mutate({ tenantId, asStatus: "ACTIVE" })
              }
              disabled={reactivateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Como Ativo
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
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-sm text-zinc-400 font-medium">{label}</span>
      <span
        className={`text-sm text-zinc-100 ${
          mono ? "font-mono bg-zinc-800 px-2 py-0.5 rounded text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function UsageStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors">
      <div className="p-2 bg-zinc-900 rounded-md">
        <Icon className="h-5 w-5 text-zinc-300" />
      </div>
      <div>
        <p className="text-xl font-bold text-white leading-none mb-1">
          {value}
        </p>
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
          {label}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/provider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  DollarSign,
  Clock,
  Bell,
  Shield,
  Server,
  CheckCircle,
  AlertCircle,
  Save,
  RefreshCw,
  Mail,
  Smartphone,
  Database,
  Zap,
  Users,
  CreditCard,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  // Fetch current config
  const {
    data: config,
    isLoading,
    refetch,
  } = trpc.admin.getSystemConfig.useQuery();
  const updateMutation = trpc.admin.updateSystemConfig.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Local state for form
  const [trialDays, setTrialDays] = useState(60);
  const [proMonthlyPrice, setProMonthlyPrice] = useState(297);
  const [proYearlyPrice, setProYearlyPrice] = useState(2970);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newSignupsEnabled, setNewSignupsEnabled] = useState(true);
  const [autoSuspendOnExpiry, setAutoSuspendOnExpiry] = useState(true);

  // Notification Settings (local only for now)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(false);

  // Sync from server data
  useEffect(() => {
    if (config) {
      setTrialDays(Number(config.trial_days.value));
      setProMonthlyPrice(Number(config.pro_monthly_price.value));
      setProYearlyPrice(Number(config.pro_yearly_price.value));
      setMaintenanceMode(config.maintenance_mode.value === "true");
      setNewSignupsEnabled(config.new_signups_enabled.value === "true");
      setAutoSuspendOnExpiry(config.auto_suspend_on_expiry.value === "true");
    }
  }, [config]);

  const handleSave = () => {
    updateMutation.mutate({
      configs: [
        {
          key: "trial_days",
          value: String(trialDays),
          label: "Dias de Trial",
          type: "number",
        },
        {
          key: "pro_monthly_price",
          value: String(proMonthlyPrice),
          label: "Preço Pro Mensal",
          type: "number",
        },
        {
          key: "pro_yearly_price",
          value: String(proYearlyPrice),
          label: "Preço Pro Anual",
          type: "number",
        },
        {
          key: "maintenance_mode",
          value: String(maintenanceMode),
          label: "Modo Manutenção",
          type: "boolean",
        },
        {
          key: "new_signups_enabled",
          value: String(newSignupsEnabled),
          label: "Novos Cadastros",
          type: "boolean",
        },
        {
          key: "auto_suspend_on_expiry",
          value: String(autoSuspendOnExpiry),
          label: "Suspender ao Expirar",
          type: "boolean",
        },
      ],
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Settings className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Configurações
            </h1>
            <p className="text-sm text-slate-500">
              Gerenciar configurações do sistema
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <div className="space-y-6">
        {/* System Status */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-lg text-slate-900">
                Status do Sistema
              </CardTitle>
            </div>
            <CardDescription>Visão geral da saúde do sistema</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatusItem label="API" status="online" />
              <StatusItem label="Database" status="online" />
              <StatusItem label="Clerk Auth" status="online" />
              <StatusItem label="Uploads" status="online" />
            </div>
          </CardContent>
        </Card>

        {/* Plan Pricing */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-lg text-slate-900">
                Preços dos Planos
              </CardTitle>
            </div>
            <CardDescription>
              Estes valores são usados no cálculo do MRR e na landing page
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="trialDays"
                  className="text-sm font-medium text-slate-700"
                >
                  Dias de Trial
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="trialDays"
                    type="number"
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                    className="pl-10 bg-white border-slate-200"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Período padrão para novos trials
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="proMonthly"
                  className="text-sm font-medium text-slate-700"
                >
                  Pro Mensal (R$)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="proMonthly"
                    type="number"
                    value={proMonthlyPrice}
                    onChange={(e) => setProMonthlyPrice(Number(e.target.value))}
                    className="pl-10 bg-white border-slate-200"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Usado no cálculo do MRR
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="proYearly"
                  className="text-sm font-medium text-slate-700"
                >
                  Pro Anual (R$)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="proYearly"
                    type="number"
                    value={proYearlyPrice}
                    onChange={(e) => setProYearlyPrice(Number(e.target.value))}
                    className="pl-10 bg-white border-slate-200"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Exibido na landing page
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Controls */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-lg text-slate-900">
                Controles do Sistema
              </CardTitle>
            </div>
            <CardDescription>
              Configurações de funcionamento do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <SettingToggle
              icon={Server}
              title="Modo de Manutenção"
              description="Bloqueia acesso ao sistema para todos os usuários (exceto admins)"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
              dangerous
            />

            <Separator />

            <SettingToggle
              icon={Users}
              title="Novos Cadastros"
              description="Permitir que novos usuários se cadastrem na plataforma"
              checked={newSignupsEnabled}
              onCheckedChange={setNewSignupsEnabled}
            />

            <Separator />

            <SettingToggle
              icon={Clock}
              title="Suspender ao Expirar"
              description="Suspender automaticamente tenants quando o trial expirar"
              checked={autoSuspendOnExpiry}
              onCheckedChange={setAutoSuspendOnExpiry}
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-lg text-slate-900">
                Notificações Admin
              </CardTitle>
            </div>
            <CardDescription>
              Configure como receber alertas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <SettingToggle
              icon={Mail}
              title="Notificações por Email"
              description="Receber alertas importantes por email"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />

            <Separator />

            <SettingToggle
              icon={Smartphone}
              title="Notificações Slack"
              description="Enviar alertas para canal do Slack (requer configuração)"
              checked={slackNotifications}
              onCheckedChange={setSlackNotifications}
            />
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-white border-red-200 shadow-sm">
          <CardHeader className="border-b border-red-100 bg-red-50/50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg text-red-900">
                Zona de Perigo
              </CardTitle>
            </div>
            <CardDescription className="text-red-600">
              Ações irreversíveis - use com cuidado
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">Limpar Cache</p>
                <p className="text-sm text-slate-500">
                  Remove todos os caches do sistema
                </p>
              </div>
              <Button variant="outline" className="border-slate-200">
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
              <div>
                <p className="font-medium text-red-900">Reiniciar Sistema</p>
                <p className="text-sm text-red-600">
                  Força reinicialização de todos os serviços
                </p>
              </div>
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-100"
              >
                <Zap className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  status,
}: {
  label: string;
  status: "online" | "offline" | "degraded";
}) {
  const statusConfig = {
    online: {
      color: "bg-emerald-100 text-emerald-700",
      label: "Online",
      icon: CheckCircle,
    },
    offline: {
      color: "bg-red-100 text-red-700",
      label: "Offline",
      icon: AlertCircle,
    },
    degraded: {
      color: "bg-amber-100 text-amber-700",
      label: "Degraded",
      icon: AlertCircle,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    </div>
  );
}

function SettingToggle({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  dangerous,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  dangerous?: boolean;
}) {
  return (
    <div className="flex items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
            dangerous ? "bg-red-100" : "bg-slate-100"
          }`}
        >
          <Icon
            className={`h-4 w-4 ${
              dangerous ? "text-red-600" : "text-slate-500"
            }`}
          />
        </div>
        <div>
          <p
            className={`font-medium ${
              dangerous ? "text-red-900" : "text-slate-900"
            }`}
          >
            {title}
          </p>
          <p
            className={`text-sm ${
              dangerous ? "text-red-600" : "text-slate-500"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={dangerous ? "data-[state=checked]:bg-red-600" : ""}
      />
    </div>
  );
}

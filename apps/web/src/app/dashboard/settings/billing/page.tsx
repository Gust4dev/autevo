"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lexend_Deca } from "next/font/google";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/cn";
import {
  CreditCard,
  Loader2,
  Check,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Crown,
  Receipt,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlanSelectionModal } from "@/components/billing/PlanSelectionModal";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function TrialCountdownBanner({
  trialEndsAt,
  isFounder,
}: {
  trialEndsAt: Date | string | null;
  isFounder: boolean;
}) {
  if (!trialEndsAt) return null;

  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const daysRemaining = differenceInDays(endDate, now);
  const hoursRemaining = differenceInHours(endDate, now) % 24;

  if (daysRemaining < 0) {
    return (
      <Card className="p-4 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-800 dark:text-red-200">
              Período de teste encerrado
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              Assine agora para continuar usando todas as funcionalidades
            </p>
          </div>
          <Button size="sm" className="bg-red-600 hover:bg-red-700">
            Assinar Agora
          </Button>
        </div>
      </Card>
    );
  }

  if (isFounder) {
    return (
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Membro Fundador - Acesso Vitalício
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Você possui benefícios exclusivos permanentes
            </p>
          </div>
          <Badge className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Fundador
          </Badge>
        </div>
      </Card>
    );
  }

  const urgency =
    daysRemaining <= 3 ? "high" : daysRemaining <= 7 ? "medium" : "low";

  const bgClass = {
    high: "bg-gradient-to-r from-red-50 to-orange-50 border-red-200 dark:from-red-950/20 dark:to-orange-950/20 dark:border-red-800",
    medium:
      "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800",
    low: "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 dark:from-indigo-950/20 dark:to-purple-950/20 dark:border-indigo-800",
  }[urgency];

  const iconBgClass = {
    high: "bg-red-100 dark:bg-red-900/30",
    medium: "bg-amber-100 dark:bg-amber-900/30",
    low: "bg-indigo-100 dark:bg-indigo-900/30",
  }[urgency];

  const iconClass = {
    high: "text-red-600 dark:text-red-400",
    medium: "text-amber-600 dark:text-amber-400",
    low: "text-indigo-600 dark:text-indigo-400",
  }[urgency];

  const textClass = {
    high: "text-red-800 dark:text-red-200",
    medium: "text-amber-800 dark:text-amber-200",
    low: "text-indigo-800 dark:text-indigo-200",
  }[urgency];

  const subtextClass = {
    high: "text-red-600 dark:text-red-400",
    medium: "text-amber-600 dark:text-amber-400",
    low: "text-indigo-600 dark:text-indigo-400",
  }[urgency];

  return (
    <Card className={cn("p-4", bgClass)}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-full", iconBgClass)}>
          <Clock className={cn("h-5 w-5", iconClass)} />
        </div>
        <div className="flex-1">
          <p className={cn("font-semibold", textClass)}>
            Plano Atual: <span className="font-bold">Período de Teste</span>
          </p>
          <p className={cn("text-sm", subtextClass)}>
            {daysRemaining === 0
              ? `Expira em ${hoursRemaining}h`
              : daysRemaining === 1
                ? "Expira amanhã"
                : `${daysRemaining} dias restantes`}
            {" • "}
            Até {format(endDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("text-2xl font-bold", textClass)}>
            {daysRemaining}
          </div>
          <div className={cn("text-xs leading-tight", subtextClass)}>
            dias
            <br />
            restantes
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function BillingSettingsPage() {
  const router = useRouter();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const { data: subscription, isLoading } =
    trpc.billing.getSubscription.useQuery();
  const { data: payments } = trpc.billing.getPayments.useQuery({ limit: 5 });

  const openCustomerPortal = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening portal:", error);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      ACTIVE: { label: "Ativo", variant: "default" },
      TRIALING: { label: "Trial", variant: "secondary" },
      TRIAL: { label: "Trial", variant: "secondary" },
      PAST_DUE: { label: "Pagamento Pendente", variant: "destructive" },
      CANCELED: { label: "Cancelado", variant: "outline" },
      INCOMPLETE: { label: "Incompleto", variant: "outline" },
    };
    const config = statusConfig[status] || {
      label: status,
      variant: "outline" as const,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          lexendDeca.className,
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isTrial =
    subscription?.tenantStatus === "TRIAL" ||
    (subscription?.trialEndsAt && !subscription?.status);

  const showTrialBanner = isTrial && subscription?.trialEndsAt;

  return (
    <div className={cn("space-y-6", lexendDeca.className)}>
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e métodos de pagamento
        </p>
      </div>

      {/* Trial Status Banner */}
      {showTrialBanner && (
        <TrialCountdownBanner
          trialEndsAt={subscription.trialEndsAt}
          isFounder={subscription.isFounder}
        />
      )}

      {/* Current Plan */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Plano Pro</h2>
              {subscription?.isFounder && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  Fundador
                </Badge>
              )}
              {subscription?.status && getStatusBadge(subscription.status)}
            </div>
            <p className="text-muted-foreground text-sm">
              {subscription?.billingInterval === "YEARLY"
                ? "Cobrança anual"
                : "Cobrança mensal"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              R$ {subscription?.customMonthlyPrice || 140}
              <span className="text-sm font-normal text-muted-foreground">
                /mês
              </span>
            </div>
          </div>
        </div>

        {/* Founder Banner */}
        {subscription?.isFounder && subscription.founderExpiresAt && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-800">
              <Crown className="h-4 w-4" />
              <span className="font-medium">Benefício de Membro Fundador</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Você mantém o preço especial até{" "}
              {format(
                new Date(subscription.founderExpiresAt),
                "dd 'de' MMMM 'de' yyyy",
                { locale: ptBR },
              )}
            </p>
          </div>
        )}

        {/* Promo Code Info */}
        {subscription?.promoDiscountApplied &&
          subscription.promoMonthsRemaining > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800">
                <Check className="h-4 w-4" />
                <span className="font-medium">Código promocional ativo</span>
              </div>
              <p className="text-sm text-emerald-700 mt-1">
                Desconto aplicado por mais {subscription.promoMonthsRemaining}{" "}
                {subscription.promoMonthsRemaining === 1 ? "mês" : "meses"}
              </p>
            </div>
          )}

        {/* Cancel Warning */}
        {subscription?.cancelAtPeriodEnd && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Cancelamento agendado</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Sua assinatura será cancelada em{" "}
              {subscription.currentPeriodEnd &&
                format(
                  new Date(subscription.currentPeriodEnd),
                  "dd 'de' MMMM 'de' yyyy",
                  { locale: ptBR },
                )}
            </p>
          </div>
        )}

        {/* Next Billing */}
        {subscription?.currentPeriodEnd &&
          subscription.status === "ACTIVE" &&
          !subscription.cancelAtPeriodEnd && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Próxima cobrança em{" "}
                {format(
                  new Date(subscription.currentPeriodEnd),
                  "dd 'de' MMMM",
                  { locale: ptBR },
                )}
              </span>
            </div>
          )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          {isTrial ? (
            <Button onClick={() => setShowPlanModal(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Escolher Plano
            </Button>
          ) : (
            <Button onClick={openCustomerPortal} disabled={isLoadingPortal}>
              {isLoadingPortal ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Gerenciar Assinatura
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          )}
        </div>
      </Card>

      {/* Payment History */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Histórico de Pagamentos</h2>
        </div>

        {payments && payments.length > 0 ? (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">
                    R$ {Number(payment.amount).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.paidAt
                      ? format(new Date(payment.paidAt), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                      : "Pendente"}
                  </p>
                </div>
                <Badge
                  variant={
                    payment.status === "succeeded"
                      ? "default"
                      : payment.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {payment.status === "succeeded"
                    ? "Pago"
                    : payment.status === "failed"
                      ? "Falhou"
                      : "Pendente"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nenhum pagamento registrado ainda.
          </p>
        )}
      </Card>

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
      />
    </div>
  );
}

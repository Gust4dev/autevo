"use client";

import { useState } from "react";
import { Lexend_Deca } from "next/font/google";
import { useUser } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/cn";
import {
  Check,
  Crown,
  Sparkles,
  Star,
  Zap,
  Lock,
  Loader2,
  ArrowRight,
  Gift,
  Shield,
  Rocket,
  Trash2,
  ArrowUp,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CancelSubscriptionModal } from "@/components/billing/CancelSubscriptionModal";
import { FounderUpgradeModal } from "@/components/billing/FounderUpgradeModal";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const FOUNDER_FEATURES = [
  "Ordens de serviço ilimitadas",
  "Vistorias com fotos",
  "Agendamento online",
  "Comissionamento automático",
  "Relatórios financeiros",
  "Suporte prioritário",
  "Badge de Membro Fundador",
  "Preço travado para sempre",
];

const STANDARD_FEATURES = [
  "Ordens de serviço ilimitadas",
  "Vistorias com fotos",
  "Agendamento online",
  "Comissionamento automático",
  "Relatórios financeiros",
  "Suporte por email",
];

const PREMIUM_FEATURES = [
  "Tudo do plano Standard",
  "CRM integrado",
  "DRE automatizado",
  "Dashboard avançado",
  "Relatórios personalizados",
  "Suporte prioritário 24/7",
  "Aplicativo para Android e iOS",
  "Recursos exclusivos em desenvolvimento",
];

function TrialCountdownBanner({
  trialEndsAt,
}: {
  trialEndsAt: Date | string | null;
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
        </div>
      </Card>
    );
  }

  const urgency =
    daysRemaining <= 3 ? "high" : daysRemaining <= 7 ? "medium" : "low";

  const styles = {
    high: {
      bg: "bg-gradient-to-r from-red-50 to-orange-50 border-red-200 dark:from-red-950/20 dark:to-orange-950/20 dark:border-red-800",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      icon: "text-red-600 dark:text-red-400",
      text: "text-red-800 dark:text-red-200",
      subtext: "text-red-600 dark:text-red-400",
    },
    medium: {
      bg: "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      icon: "text-amber-600 dark:text-amber-400",
      text: "text-amber-800 dark:text-amber-200",
      subtext: "text-amber-600 dark:text-amber-400",
    },
    low: {
      bg: "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 dark:from-indigo-950/20 dark:to-purple-950/20 dark:border-indigo-800",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      icon: "text-indigo-600 dark:text-indigo-400",
      text: "text-indigo-800 dark:text-indigo-200",
      subtext: "text-indigo-600 dark:text-indigo-400",
    },
  }[urgency];

  return (
    <Card className={cn("p-4", styles.bg)}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-full", styles.iconBg)}>
          <Clock className={cn("h-5 w-5", styles.icon)} />
        </div>
        <div className="flex-1">
          <p className={cn("font-semibold", styles.text)}>
            Plano Atual: <span className="font-bold">Período de Teste</span>
          </p>
          <p className={cn("text-sm", styles.subtext)}>
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
          <div className={cn("text-2xl font-bold", styles.text)}>
            {daysRemaining}
          </div>
          <div className={cn("text-xs leading-tight", styles.subtext)}>
            dias
            <br />
            restantes
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function PricingPage() {
  const { user } = useUser();
  const [isLoadingFounder, setIsLoadingFounder] = useState(false);
  const [isLoadingStandard, setIsLoadingStandard] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: founderStats, refetch: refetchFounderStats } =
    trpc.admin.getFoundingMemberStats.useQuery();
  const { data: subscription, isLoading: isLoadingSub } =
    trpc.billing.getSubscription.useQuery();
  const { data: cancellationStats } =
    trpc.billing.getCancellationStats.useQuery();

  const usedSlots = founderStats?.count || 0;
  const totalSlots = 15;
  const remainingSlots = Math.max(0, totalSlots - usedSlots);
  const progress = Math.min(100, (usedSlots / totalSlots) * 100);
  const slotsExhausted = remainingSlots === 0;

  const hasActiveSubscription =
    subscription?.status &&
    ["ACTIVE", "TRIALING"].includes(subscription.status);
  const isFounder =
    subscription?.isFounder || (user?.publicMetadata as any)?.isFoundingMember;
  const isStandardSubscriber = hasActiveSubscription && !isFounder;

  const handleCheckout = async (isFounderPlan: boolean) => {
    if (isFounderPlan) {
      setIsLoadingFounder(true);
    } else {
      setIsLoadingStandard(true);
    }

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingInterval: "monthly",
          isFounder: isFounderPlan,
          successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&founder=${isFounderPlan}`,
          cancelUrl: `${window.location.origin}/dashboard/settings/pricing?canceled=true`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Erro ao criar sessão de pagamento");
      }
    } catch {
      toast.error("Erro ao processar pagamento");
    } finally {
      setIsLoadingFounder(false);
      setIsLoadingStandard(false);
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch("/api/stripe/upgrade-to-founder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Parabéns! Você agora é um Membro Fundador! 🎉");
        setShowUpgradeModal(false);
        refetchFounderStats();
        // Give time for toast and then reload to update everything (Clerk, sidebar, etc)
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(data.error || "Erro ao fazer upgrade");
      }
    } catch {
      toast.error("Erro ao processar upgrade");
    } finally {
      setIsUpgrading(false);
    }
  };

  // Special view for Founders
  if (isFounder && hasActiveSubscription) {
    return (
      <div className={cn("space-y-8", lexendDeca.className)}>
        <div>
          <h1 className="text-2xl font-bold">Seu Plano</h1>
          <p className="text-muted-foreground">
            Você é um Membro Fundador do Autevo!
          </p>
        </div>

        {/* Founder Hero Card */}
        <Card className="p-8 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/50 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Badge className="bg-amber-500 text-amber-950 font-bold">
              <Crown className="h-3 w-3 mr-1" />
              MEMBRO FUNDADOR
            </Badge>
          </div>

          <div className="flex items-start gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                Parabéns, {user?.firstName}!
              </h2>
              <p className="text-muted-foreground mb-4">
                Você faz parte do seleto grupo de{" "}
                <strong>{usedSlots} Membros Fundadores</strong> do Autevo. Seu
                apoio ajudou a construir esta plataforma desde o início.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border">
                  <Gift className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Preço Vitalício</h4>
                    <p className="text-sm text-muted-foreground">
                      R$ 140/mês para sempre, mesmo quando aumentar
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border">
                  <Rocket className="h-5 w-5 text-indigo-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Acesso Premium</h4>
                    <p className="text-sm text-muted-foreground">
                      Todas as funcionalidades Premium incluídas
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border">
                  <Shield className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Suporte Prioritário</h4>
                    <p className="text-sm text-muted-foreground">
                      Acesso direto ao time de desenvolvimento
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border">
                  <Star className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Features Exclusivas</h4>
                    <p className="text-sm text-muted-foreground">
                      Acesso antecipado a novas funcionalidades
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Premium Coming Soon */}
        <Card className="p-6 border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 to-transparent">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-indigo-500/10">
              <Rocket className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                Plano Premium em Desenvolvimento
              </h3>
              <p className="text-sm text-muted-foreground">
                Você terá acesso automático quando lançarmos!
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PREMIUM_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground text-center">
            Obrigado por acreditar no Autevo desde o início. Seu feedback é
            essencial para construirmos a melhor plataforma para estéticas
            automotivas do Brasil.
          </p>
        </Card>

        {/* Cancellation Section for Founders */}
        <Card className="p-6 border-destructive/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-destructive">
                Cancelar Assinatura
              </h3>
              <p className="text-sm text-muted-foreground">
                Ao cancelar, você perderá seu status de Membro Fundador
                permanentemente.
              </p>
            </div>
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
              onClick={() => setShowCancelModal(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancelar Assinatura
            </Button>
          </div>
        </Card>

        {/* Cancel Subscription Modal */}
        <CancelSubscriptionModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          stats={cancellationStats ?? undefined}
          isFounder={true}
        />
      </div>
    );
  }

  // Regular view with plans
  const isTrial =
    subscription?.tenantStatus === "TRIAL" && !hasActiveSubscription;

  return (
    <div className={cn("space-y-8", lexendDeca.className)}>
      <div>
        <h1 className="text-2xl font-bold">Planos</h1>
        <p className="text-muted-foreground">
          Conheça os planos disponíveis e suas funcionalidades
        </p>
      </div>

      {/* Trial Status Banner */}
      {isTrial && subscription?.trialEndsAt && (
        <TrialCountdownBanner trialEndsAt={subscription.trialEndsAt} />
      )}

      {/* Active Subscription Notice */}
      {hasActiveSubscription && !isFounder && (
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-600">
            <Check className="h-5 w-5" />
            <span className="font-medium">
              Você já possui uma assinatura ativa - Plano Standard
            </span>
          </div>
        </Card>
      )}

      {/* Founder Slots Progress - Only show if slots available */}
      {!slotsExhausted && !hasActiveSubscription && (
        <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-600 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              VAGAS DE MEMBRO FUNDADOR
            </span>
            <span className="text-sm font-bold">
              {usedSlots} / {totalSlots} vagas preenchidas
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Restam apenas{" "}
            <span className="font-bold text-amber-600">{remainingSlots}</span>{" "}
            vagas com preço vitalício garantido.
          </p>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Founder Plan - Only show if slots available and no subscription */}
        {!slotsExhausted && (
          <Card
            className={cn(
              "p-6 relative overflow-hidden flex flex-col",
              hasActiveSubscription
                ? "opacity-50 border-muted"
                : "border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent",
            )}
          >
            <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1 rounded-bl-lg">
              LIMITADO
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-bold">Membro Fundador</h2>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">R$ 97</span>
                <span className="text-muted-foreground">/60 dias</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Depois:{" "}
                <span className="font-semibold text-foreground">
                  R$ 140/mês
                </span>{" "}
                para sempre
              </p>
            </div>

            <Badge
              variant="secondary"
              className="mb-4 bg-amber-100 text-amber-800 w-fit"
            >
              {remainingSlots} vagas restantes
            </Badge>

            <ul className="space-y-2.5 flex-1">
              {FOUNDER_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-amber-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleCheckout(true)}
              disabled={!!isLoadingFounder || !!hasActiveSubscription}
              className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold"
            >
              {isLoadingFounder ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasActiveSubscription ? (
                "Você já é assinante"
              ) : (
                <>
                  Garantir Vaga <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </Card>
        )}

        {/* Standard Plan */}
        <Card
          className={cn(
            "p-6 flex flex-col relative",
            slotsExhausted && "md:col-start-1",
            hasActiveSubscription &&
              !isFounder &&
              "border-primary ring-2 ring-primary/20",
          )}
        >
          {hasActiveSubscription && !isFounder && (
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
              SEU PLANO
            </div>
          )}
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Standard</h2>
          </div>

          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">R$ 140</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Tudo que você precisa para começar
            </p>
          </div>

          <ul className="space-y-2.5 flex-1">
            {STANDARD_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <Button
            onClick={() => handleCheckout(false)}
            disabled={!!isLoadingStandard || !!hasActiveSubscription}
            variant={hasActiveSubscription ? "outline" : "default"}
            className="w-full mt-6"
          >
            {isLoadingStandard ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasActiveSubscription ? (
              "Plano Atual"
            ) : (
              <>
                Assinar Standard <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </Card>

        {/* Premium Plan */}
        <Card className="p-6 relative border-indigo-500/50 bg-gradient-to-b from-indigo-500/5 to-transparent flex flex-col">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
            <Lock className="h-3 w-3" />
            EM BREVE
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-6 w-6 text-indigo-500" />
            <h2 className="text-xl font-bold">Premium</h2>
          </div>

          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">R$ 190</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Para quem quer o máximo do sistema
            </p>
          </div>

          <Badge
            variant="secondary"
            className="mb-4 bg-indigo-100 text-indigo-800 w-fit"
          >
            <Lock className="h-3 w-3 mr-1" />
            Fundadores terão acesso incluso
          </Badge>

          <ul className="space-y-2.5 flex-1">
            {PREMIUM_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="h-4 w-4 text-indigo-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <Button disabled variant="outline" className="w-full mt-6 opacity-50">
            <Lock className="h-4 w-4 mr-2" />
            Em Breve
          </Button>
        </Card>
      </div>

      {/* Info Footer */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">
          <strong>Membros Fundadores</strong> terão acesso ao plano Premium pelo
          preço do Standard (R$ 140/mês) para sempre, mesmo quando o Premium
          custar R$ 190/mês ou mais.
        </p>
      </Card>

      {/* Upgrade Banner for Standard Subscribers */}
      {isStandardSubscriber && !slotsExhausted && (
        <Card className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Crown className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  Faça upgrade para Membro Fundador!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Apenas <strong>{remainingSlots} vagas</strong> restantes.
                  Garanta seu preço vitalício de R$ 140/mês!
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              disabled={!!isUpgrading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shrink-0"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Fazer Upgrade
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Cancellation Section */}
      {hasActiveSubscription && (
        <Card className="p-6 border-destructive/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-destructive">
                Cancelar Assinatura
              </h3>
              <p className="text-sm text-muted-foreground">
                Ao cancelar, sua conta e todos os dados serão excluídos
                permanentemente.
              </p>
            </div>
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
              onClick={() => setShowCancelModal(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancelar Assinatura
            </Button>
          </div>
        </Card>
      )}

      {/* Modals */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        stats={cancellationStats ?? undefined}
        isFounder={!!isFounder}
      />

      <FounderUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onConfirm={handleUpgrade}
        isUpgrading={isUpgrading}
        remainingSlots={remainingSlots}
      />
    </div>
  );
}

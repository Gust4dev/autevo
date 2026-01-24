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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function BillingSettingsPage() {
  const router = useRouter();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

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

  return (
    <div className={cn("space-y-6", lexendDeca.className)}>
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e métodos de pagamento
        </p>
      </div>

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
              {subscription && getStatusBadge(subscription.status)}
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
          <Button onClick={openCustomerPortal} disabled={isLoadingPortal}>
            {isLoadingPortal ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Gerenciar Assinatura
            <ExternalLink className="h-3 w-3 ml-2" />
          </Button>
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
    </div>
  );
}

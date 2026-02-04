"use client";

import { useState } from "react";
import { Zap, Star, Check, Lock, ArrowRight, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STANDARD_FEATURES = [
  "Ordens de serviço ilimitadas",
  "Vistorias com fotos",
  "Agendamento online",
  "Comissionamento automático",
  "Relatórios financeiros",
  "Suporte por email",
];

const PREMIUM_FEATURES = [
  "Tudo do Standard",
  "CRM integrado",
  "DRE automatizado",
  "Dashboard avançado",
  "Relatórios personalizados",
  "Suporte prioritário 24/7",
  "App móvel nativo",
];

export function PlanSelectionModal({
  isOpen,
  onClose,
}: PlanSelectionModalProps) {
  const [isLoadingStandard, setIsLoadingStandard] = useState(false);

  const handleSelectStandard = async () => {
    setIsLoadingStandard(true);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingInterval: "monthly",
          isFounder: false,
          successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/dashboard/settings?tab=sistema&canceled=true`,
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
      setIsLoadingStandard(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <div className="p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Escolha seu Plano
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Selecione o plano ideal para sua estética automotiva
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Standard Plan */}
            <Card className="p-5 border-2 hover:border-primary/50 transition-colors cursor-pointer relative flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Standard</h3>
                  <p className="text-xs text-muted-foreground">
                    Para estéticas em crescimento
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">R$ 140</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-4">
                {STANDARD_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleSelectStandard}
                disabled={isLoadingStandard}
                className="w-full"
              >
                {isLoadingStandard ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    Assinar Standard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </Card>

            {/* Premium Plan - Em desenvolvimento */}
            <Card className="p-5 border-2 border-indigo-500/30 bg-gradient-to-b from-indigo-500/5 to-transparent relative flex flex-col opacity-75">
              <Badge className="absolute -top-2 -right-2 bg-indigo-500 text-white">
                <Lock className="h-3 w-3 mr-1" />
                EM BREVE
              </Badge>

              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Star className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Premium</h3>
                  <p className="text-xs text-muted-foreground">
                    Para estéticas de alto volume
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">R$ 190</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-4">
                {PREMIUM_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button disabled variant="outline" className="w-full opacity-50">
                <Lock className="h-4 w-4 mr-2" />
                Em Desenvolvimento
              </Button>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Você pode alterar ou cancelar seu plano a qualquer momento pelo
            portal do cliente
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

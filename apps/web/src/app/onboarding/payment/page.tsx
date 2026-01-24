"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { Lexend_Deca } from "next/font/google";
import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  CreditCard,
  Loader2,
  Check,
  Shield,
  Tag,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const MONTHLY_PRICE = 140;

interface PromoCodeResponse {
  valid: boolean;
  code?: string;
  discountPercent?: number;
  monthlyDuration?: number;
  referrerName?: string | null;
  error?: string;
}

export default function OnboardingPaymentPage() {
  return (
    <Suspense
      fallback={
        <div
          className={cn(
            "min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center",
            lexendDeca.className,
          )}
        >
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <OnboardingPaymentContent />
    </Suspense>
  );
}

function OnboardingPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  const [promoCode, setPromoCode] = useState("");
  const [promoValidation, setPromoValidation] =
    useState<PromoCodeResponse | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canceled = searchParams.get("canceled") === "true";

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;

    setIsValidatingPromo(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/validate-promo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });

      const data: PromoCodeResponse = await response.json();
      setPromoValidation(data);

      if (!data.valid && data.error) {
        setError(data.error);
      }
    } catch {
      setError("Erro ao validar código promocional");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleCheckout = async () => {
    setIsCreatingCheckout(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: promoValidation?.valid ? promoValidation.code : undefined,
          billingInterval: "monthly",
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Erro ao criar sessão de pagamento");
      }
    } catch {
      setError("Erro ao processar pagamento");
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const finalPrice =
    promoValidation?.valid && promoValidation.discountPercent
      ? MONTHLY_PRICE * (1 - promoValidation.discountPercent / 100)
      : MONTHLY_PRICE;

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center",
          lexendDeca.className,
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-[#0A0A0B] text-white selection:bg-indigo-500/30",
        lexendDeca.className,
      )}
    >
      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-white">A</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Autevo</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400">
              <Shield className="h-3 w-3" />
              <span>Pagamento Seguro</span>
            </div>
            <SignOutButton>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-white/5"
              >
                Sair
              </Button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
              <CreditCard className="h-4 w-4" />
              Última etapa
            </div>
            <h1 className="text-3xl font-bold mb-3">Ative sua assinatura</h1>
            <p className="text-zinc-400">
              Seja bem-vindo, {user?.firstName || "empreendedor"}! Complete o
              pagamento para liberar o acesso completo.
            </p>
          </div>

          {/* Canceled Warning */}
          {canceled && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-medium">
                  Pagamento cancelado
                </p>
                <p className="text-sm text-zinc-400">
                  Tente novamente quando estiver pronto.
                </p>
              </div>
            </div>
          )}

          {/* Plan Card */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Plano Pro Mensal</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                Recomendado
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              {promoValidation?.valid && (
                <span className="text-xl text-zinc-500 line-through mr-2">
                  R$ {MONTHLY_PRICE}
                </span>
              )}
              <span className="text-4xl font-bold">
                R$ {finalPrice.toFixed(0)}
              </span>
              <span className="text-zinc-400">/mês</span>
            </div>

            {promoValidation?.valid && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <Check className="h-4 w-4" />
                  {promoValidation.discountPercent}% de desconto aplicado
                  {promoValidation.referrerName && (
                    <span className="text-zinc-400">
                      via {promoValidation.referrerName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Válido por {promoValidation.monthlyDuration}{" "}
                  {promoValidation.monthlyDuration === 1 ? "mês" : "meses"}
                </p>
              </div>
            )}

            <ul className="space-y-2.5 text-sm">
              {[
                "Ordens de serviço ilimitadas",
                "Vistorias com fotos",
                "Agendamento online",
                "Comissionamento automático",
                "Relatórios financeiros",
                "Suporte prioritário",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-zinc-300"
                >
                  <Check className="h-4 w-4 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Promo Code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Código promocional (opcional)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Ex: FILMTECH15"
                  className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
                  disabled={promoValidation?.valid}
                />
              </div>
              <Button
                variant="outline"
                onClick={validatePromoCode}
                disabled={
                  !promoCode.trim() ||
                  isValidatingPromo ||
                  promoValidation?.valid
                }
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                {isValidatingPromo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : promoValidation?.valid ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  "Aplicar"
                )}
              </Button>
            </div>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={isCreatingCheckout}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
          >
            {isCreatingCheckout ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Pagar R$ {finalPrice.toFixed(0)}{" "}
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-zinc-500">
            <p>
              Ao prosseguir, você concorda com os{" "}
              <Link href="/terms" className="text-indigo-400 hover:underline">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link href="/privacy" className="text-indigo-400 hover:underline">
                Política de Privacidade
              </Link>
            </p>
            <p className="mt-2 flex items-center justify-center gap-1.5">
              <Shield className="h-3 w-3" />
              Pagamento processado com segurança via Stripe
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { Lexend_Deca } from "next/font/google";
import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  AlertTriangle,
  MessageCircle,
  Loader2,
  Check,
  Shield,
  Zap,
  TrendingUp,
  CreditCard,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const WHATSAPP_NUMBER = "5561998031185";
const MONTHLY_PRICE = 297;
const ANNUAL_PRICE = 2970; // 12 x 247.50
const ANNUAL_SAVINGS = MONTHLY_PRICE * 12 - ANNUAL_PRICE; // 3564 - 2970 = 594

export default function SuspendedPage() {
  const { user, isLoaded } = useUser();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "annual"
  );

  const getWhatsappUrl = (plan: "monthly" | "annual") => {
    const message =
      plan === "monthly"
        ? `Olá! Minha conta está suspensa e quero reativar com o *Plano Mensal (R$ 297/mês)*. Meu email: ${
            user?.emailAddresses?.[0]?.emailAddress || "N/A"
          }`
        : `Olá! Minha conta está suspensa e quero aproveitar o desconto do *Plano Anual (R$ 2.970/ano)*. Meu email: ${
            user?.emailAddresses?.[0]?.emailAddress || "N/A"
          }`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;
  };

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center",
          lexendDeca.className
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
        lexendDeca.className
      )}
    >
      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-white">A</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Autevo</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400">
              <Lock className="h-3 w-3" />
              <span>Ambiente Seguro</span>
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

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Copy & Value */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Acesso temporariamente suspenso
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">
                Não pare a gestão da <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                  sua oficina agora
                </span>
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed max-w-lg">
                Seus dados estão seguros e aguardando seu retorno. Regularize
                sua assinatura hoje para retomar o controle total do seu
                negócio.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    Continue crescendo
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Não perca o histórico dos seus clientes e ordens.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Dados Protegidos</h3>
                  <p className="text-sm text-zinc-400">
                    Garantimos a segurança das suas informações por 30 dias.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    Setup já realizado
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Você já configurou tudo. É só reativar e usar.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Pricing Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-[2rem] blur-2xl -z-10" />

            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Billing Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-zinc-950 p-1 rounded-xl border border-white/10 flex items-center relative">
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-medium transition-all relative z-10",
                      billingPeriod === "monthly"
                        ? "text-white"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setBillingPeriod("annual")}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-medium transition-all relative z-10 flex items-center gap-2",
                      billingPeriod === "annual"
                        ? "text-white"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    Anual
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      -16% OFF
                    </span>
                  </button>
                  <div
                    className={cn(
                      "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-800 rounded-lg shadow-sm transition-all duration-300",
                      billingPeriod === "monthly" ? "left-1" : "left-[50%]"
                    )}
                  />
                </div>
              </div>

              {/* Price Display */}
              <div className="text-center mb-8">
                <div className="text-sm text-zinc-400 mb-2 font-medium uppercase tracking-wider">
                  {billingPeriod === "monthly"
                    ? "Plano Profissional"
                    : "Plano Anual (Recomendado)"}
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold tracking-tight text-white">
                    R$ {billingPeriod === "monthly" ? MONTHLY_PRICE : 247}
                  </span>
                  <span className="text-xl text-zinc-400">/mês</span>
                </div>
                {billingPeriod === "annual" && (
                  <p className="text-sm text-emerald-400 mt-2 font-medium">
                    Cobrado R$ {ANNUAL_PRICE.toLocaleString("pt-BR")} anualmente
                    <br />
                    <span className="text-zinc-500">
                      (Economia de R$ {ANNUAL_SAVINGS.toLocaleString("pt-BR")})
                    </span>
                  </p>
                )}
              </div>

              {/* Action Button */}
              <a
                href={getWhatsappUrl(billingPeriod)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-center gap-2 w-full font-bold text-lg px-6 py-4 rounded-xl transition-all shadow-lg transform hover:-translate-y-1",
                  billingPeriod === "annual"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
                )}
              >
                <MessageCircle className="h-6 w-6" />
                {billingPeriod === "annual"
                  ? "Reativar com Desconto"
                  : "Reativar Mensal"}
              </a>

              {/* Features Grid */}
              <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                {[
                  "Acesso Imediato",
                  "Suporte Prioritário",
                  "Backup Automático",
                  "Gestão Financeira",
                  "Ordens Ilimitadas",
                  "Multi-usuários",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-sm text-zinc-300"
                  >
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500 bg-zinc-950/50 py-2 rounded-lg">
                <CreditCard className="h-3 w-3" />
                Pagamento seguro via PIX ou Cartão
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

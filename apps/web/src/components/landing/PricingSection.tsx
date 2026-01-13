"use client";

import { useState } from "react";
import { Check, MessageCircle, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

const WHATSAPP_NUMBER = "5561998031185";

export function PricingSection() {
  const [period, setPeriod] = useState<"monthly" | "annual">("annual");

  const getWhatsappUrl = (plan: "monthly" | "annual") => {
    const message =
      plan === "monthly"
        ? "Olá! Gostaria de assinar o *Plano Mensal* do Autevo."
        : "Olá! Gostaria de aproveitar a oferta do *Plano Anual* do Autevo.";
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;
  };

  return (
    <section className="py-24 px-6 relative overflow-hidden" id="pricing">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Investimento que se paga
            <br />
            <span className="text-red-500">na primeira semana</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Escolha o plano ideal para sua oficina. Sem taxas escondidas, sem
            fidelidade no plano mensal.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex bg-zinc-900/50 rounded-full p-1 border border-zinc-800">
            <button
              onClick={() => setPeriod("monthly")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                period === "monthly"
                  ? "bg-zinc-800 text-white shadow-lg"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriod("annual")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                period === "annual"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              Anual
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                -20% OFF
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition-colors relative group">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-2 text-zinc-200">
                Plano Mensal
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">R$ 297</span>
                <span className="text-zinc-500">/mês</span>
              </div>
              <p className="text-zinc-500 text-sm mt-4">
                Ideal para quem está começando e quer flexibilidade total.
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Gestão Completa de OS",
                "CRM e Clientes",
                "Vistorias Ilimitadas",
                "Financeiro Básico",
                "Suporte via WhatsApp",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-zinc-300 text-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={getWhatsappUrl("monthly")}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-center transition-colors"
            >
              Começar Mensal
            </a>
          </div>

          {/* Annual Card */}
          <div className="bg-zinc-900/80 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden group hover:border-red-500/40 transition-colors shadow-2xl shadow-red-900/10">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

            <div className="absolute top-4 right-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Mais Vendido
            </div>

            <div className="mb-8 relative z-10">
              <h3 className="text-xl font-semibold mb-2 text-white">
                Plano Anual
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-lg text-zinc-500 line-through">
                  R$ 3.564
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-red-500">
                  R$ 2.970
                </span>
                <span className="text-zinc-500">/ano</span>
              </div>
              <p className="text-red-400/80 text-sm mt-4 font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Economia de R$ 594,00
              </p>
            </div>

            <ul className="space-y-4 mb-8 relative z-10">
              {[
                "Tudo do Plano Mensal",
                "Setup Gratuito Assistido",
                "Migração de Dados",
                "Treinamento da Equipe",
                "Prioridade no Suporte",
                "Garantia de 30 Dias",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-white text-sm font-medium"
                >
                  <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={getWhatsappUrl("annual")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-center transition-all shadow-lg shadow-red-600/25 relative z-10 hover:scale-[1.02]"
            >
              <MessageCircle className="w-5 h-5" />
              Garantir Oferta Anual
            </a>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="w-3 h-3 text-red-500" />
              Garantia de reembolso de 30 dias (Exclusivo Anual)
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

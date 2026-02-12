"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

const WHATSAPP_NUMBER = "5561998031185";

export function PricingSection() {
  const [period, setPeriod] = useState<"monthly" | "founder">("founder");

  return (
    <section className="py-24 px-6 relative overflow-hidden" id="pricing">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
            Investimento que se paga
            <br />
            <span className="text-red-500">na primeira semana</span>
          </h2>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Comece agora seu trial de 14 dias sem cartão de crédito e veja o
            poder da gestão profissional. Cancele quando quiser.
          </p>

          <div className="mt-8 inline-flex bg-zinc-900/50 rounded-full p-1 border border-zinc-800">
            <button
              onClick={() => setPeriod("monthly")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                period === "monthly"
                  ? "bg-zinc-800 text-white shadow-lg"
                  : "text-zinc-500 hover:text-white",
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriod("founder")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                period === "founder"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                  : "text-zinc-500 hover:text-white",
              )}
            >
              Fundador
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                OFERTA
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition-colors relative group">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 text-zinc-100">
                Plano Mensal
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">R$ 140</span>
                <span className="text-zinc-500">/mês</span>
              </div>
              <p className="text-zinc-500 text-sm mt-4 leading-relaxed">
                Ideal para quem quer flexibilidade total e gestão profissional.
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Gestão Completa de OS",
                "CRM e Clientes",
                "Vistorias Ilimitadas",
                "Financeiro Completo",
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

            <Link
              href="/sign-up"
              className="block w-full py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center transition-all"
            >
              Começar Agora
            </Link>
          </div>

          {/* Founder Card */}
          <div className="bg-zinc-900/80 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden group hover:border-red-500/40 transition-colors shadow-2xl shadow-red-900/10 transform-gpu">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

            <div className="absolute top-4 right-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              Apenas 15 Vagas
            </div>

            <div className="mb-8 relative z-10">
              <h3 className="text-xl font-black mb-2 text-white">
                Plano Fundador
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-red-500">R$ 97</span>
                <span className="text-zinc-400 font-bold">/60 dias</span>
              </div>
              <p className="text-red-400/80 text-sm mt-4 font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current" />
                Acesso antecipado exclusivo
              </p>
            </div>

            <ul className="space-y-4 mb-8 relative z-10">
              {[
                "Tudo do Plano Mensal",
                "Primeiros 60 dias por R$ 97",
                "Setup Assistido Especial",
                "Prioridade Vitalícia no Suporte",
                "Selo de Membro Fundador",
                "Garantia de Satisfação",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-white text-sm font-semibold"
                >
                  <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/sign-up"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-center transition-all shadow-lg shadow-red-600/25 relative z-10 hover:scale-[1.02]"
            >
              <Zap className="w-5 h-5 text-white animate-pulse" />
              Garantir Minha Vaga
            </Link>

            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3 text-red-500" />
              Oferta limitada por ordem de chegada
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Play, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden min-h-screen flex flex-col justify-center bg-[#050505] text-white"
    >
      {/* Abstract Background Shapes - Refined for Dark Mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <motion.div
          style={{ y: y1 }}
          className="absolute -top-[5%] -left-[10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-red-900/20 via-zinc-900/10 to-transparent rounded-full blur-[80px] md:blur-[120px] opacity-40"
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute top-[10%] -right-[5%] w-[350px] h-[350px] md:w-[500px] md:h-[500px] bg-gradient-to-tr from-zinc-900/20 via-red-900/10 to-transparent rounded-full blur-[80px] md:blur-[120px] opacity-40"
        />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,black,rgba(0,0,0,0))] opacity-[0.2] invert" />
      </div>

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-20">
        {/* Left Column: Content */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[13px] font-semibold text-zinc-300 mb-8 backdrop-blur-sm transition-colors cursor-default">
            <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
            Teste grátis por 14 dias sem cartão
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white leading-[1.1] [text-wrap:balance]">
            A gestão completa para <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
              seu centro automotivo.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed">
            Ordens de serviço, vistorias fotográficas e financeiro em um só
            lugar. Evolua sua oficina para o próximo nível com a plataforma mais
            moderna do mercado.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-10 text-base bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_15px_35px_-10px_rgba(220,38,38,0.6)] hover:-translate-y-1 font-bold"
              >
                Começar Teste Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#funcionalidades" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base rounded-full border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white transition-all font-semibold backdrop-blur-sm"
              >
                Ver tudo que faz
              </Button>
            </Link>
          </motion.div>
          {/* Social Proof / Features List */}
          <div className="mt-12 pt-8 border-t border-white/5 w-full flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-8 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-red-600" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-red-600" />
              <span>Set-up em 2 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-red-600" />
              <span>Suporte especializado</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual/Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="relative mt-12 lg:mt-0 px-4 md:px-0"
        >
          {/* Main "Quadro" (Mockup) */}
          <div className="relative rounded-2xl bg-white/[0.02] p-1.5 backdrop-blur-sm border border-white/[0.05] shadow-2xl transition-all duration-700 ease-out max-w-2xl mx-auto">
            <div className="w-full rounded-xl bg-[#0a0a0a] shadow-inner overflow-hidden border border-white/5 relative">
              {/* Fake UI Header */}
              <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-600/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-600/50" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="w-24 h-2 bg-white/5 rounded-full" />
                </div>
              </div>

              {/* Main Content Area - Dashboard Layout */}
              <div className="p-6 md:p-8">
                {/* User Welcome */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                      Visão Geral
                    </div>
                    <div className="text-xl font-bold text-white">
                      Bem-vindo, Gustavo
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10" />
                </div>

                {/* Dashboard Summary Row */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                  {[
                    {
                      label: "Faturamento",
                      val: "R$ 48.2k",
                      color: "text-red-500",
                    },
                    {
                      label: "Ticket Médio",
                      val: "R$ 1.150",
                      color: "text-zinc-300",
                    },
                    { label: "Novos Clientes", val: "24", color: "text-white" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl"
                    >
                      <div className="text-[8px] uppercase font-black text-zinc-600 mb-1">
                        {item.label}
                      </div>
                      <div
                        className={`text-sm md:text-base font-black ${item.color}`}
                      >
                        {item.val}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart/Activity Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-600 border-b border-white/5 pb-2">
                    <span>Atividade Recente</span>
                    <span className="text-red-500">Ver Todas</span>
                  </div>
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-white/[0.01] rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                          BMW
                        </div>
                        <div className="text-[11px] font-bold text-zinc-300">
                          Ord. {868440 + i}
                        </div>
                      </div>
                      <div className="text-[11px] font-black text-white">
                        R$ 2.450,00
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overlay Gradient for Depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-red-600/5 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Popups EXTERNAL to the frame */}
          {/* Bottom Left Popup */}
          <motion.div
            animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute -left-4 md:-left-12 -bottom-6 bg-[#0a0a0a] p-4 md:p-6 rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] border border-white/10 z-30 flex items-center gap-4 transition-all transform-gpu"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <div className="text-[9px] md:text-[10px] font-black uppercase text-zinc-500 mb-0.5 tracking-widest">
                Aumento Lucro
              </div>
              <div className="text-lg md:text-2xl font-black text-white">
                +24.8%
              </div>
            </div>
          </motion.div>

          {/* Top Right Popup */}
          <motion.div
            animate={{ y: [0, 10, 0], rotate: [0, 2, 0] }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute -right-4 md:-right-16 -top-4 bg-[#0a0a0a] p-4 md:p-6 rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] border border-white/10 z-30 flex flex-col gap-1 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-[#0a0a0a] bg-zinc-800 overflow-hidden"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-bold text-zinc-400">
                +12 novos hoje
              </span>
            </div>
            <div className="text-xs font-black text-white px-3 py-1 bg-red-600 shadow-lg shadow-red-900/40 rounded-full w-fit">
              Clientes Ativos
            </div>
          </motion.div>

          {/* Center Floating Card (Ticket Médio) */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
            className="absolute top-1/2 -right-12 md:-right-24 bg-zinc-900/90 backdrop-blur-xl p-4 md:p-5 rounded-2xl border border-white/5 z-20 hidden lg:block"
          >
            <div className="text-[9px] uppercase font-black text-zinc-500 mb-2">
              Ticket Médio
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
              <div className="text-xl font-black text-white tracking-tighter">
                R$ 2.450
              </div>
            </div>
          </motion.div>

          {/* Glow Shadow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-red-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        </motion.div>
      </div>
    </section>
  );
}

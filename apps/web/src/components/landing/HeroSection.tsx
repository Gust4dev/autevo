"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Calendar,
  DollarSign,
  Users,
  Car,
  Bell,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";

function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        {value.toLocaleString("pt-BR")}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

function DashboardMockup() {
  return (
    <div className="w-full h-full bg-white rounded-xl overflow-hidden flex">
      {/* Sidebar */}
      <div className="w-[52px] bg-white border-r border-slate-100 flex-shrink-0 hidden sm:flex flex-col items-center py-3 gap-3">
        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
          <img src="/icon.svg" alt="" className="w-4 h-4" />
        </div>
        <div className="w-6 h-0.5 bg-slate-100 my-1" />
        {[LayoutDashboard, ClipboardCheck, Calendar, Users, Car, DollarSign].map(
          (Icon, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? "bg-red-50" : "hover:bg-slate-50"}`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${i === 0 ? "text-red-600" : "text-slate-400"}`}
              />
            </div>
          ),
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] sm:text-[13px] font-bold text-slate-900">
              Dashboard
            </div>
            <div className="text-[8px] sm:text-[10px] text-slate-400">
              Resumo do seu dia
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: "spring" }}
            className="relative"
          >
            <Bell className="w-3.5 h-3.5 text-slate-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          </motion.div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
          {[
            {
              label: "Agendamentos",
              value: "12",
              sub: "Para hoje",
              color: "bg-blue-50",
              textColor: "text-blue-600",
              icon: Calendar,
            },
            {
              label: "OS em Andamento",
              value: "8",
              sub: "Em execucao",
              color: "bg-amber-50",
              textColor: "text-amber-600",
              icon: ClipboardCheck,
            },
            {
              label: "Clientes",
              value: "247",
              sub: "Cadastrados",
              color: "bg-emerald-50",
              textColor: "text-emerald-600",
              icon: Users,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.15 }}
              className="bg-white border border-slate-100 rounded-lg p-2 sm:p-2.5"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[7px] sm:text-[9px] text-slate-500 font-medium truncate">
                  {stat.label}
                </span>
                <div
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${stat.textColor}`}
                  />
                </div>
              </div>
              <div className="text-sm sm:text-lg font-bold text-slate-900">
                {stat.value}
              </div>
              <div className="text-[7px] sm:text-[8px] text-slate-400">
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chart Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-white border border-slate-100 rounded-lg p-2.5 sm:p-3 mb-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-700">
              Faturamento Semanal
            </span>
            <div className="flex items-center gap-1 text-emerald-500">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[8px] font-bold">+23%</span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-12 sm:h-16">
            {[35, 55, 40, 70, 60, 85, 75].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 1.2 + i * 0.08, duration: 0.6 }}
                className={`flex-1 rounded-t ${i === 5 ? "bg-red-500" : "bg-red-100"}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((d) => (
              <span key={d} className="text-[6px] sm:text-[7px] text-slate-300 flex-1 text-center">
                {d}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="bg-white border border-slate-100 rounded-lg p-2.5 sm:p-3"
        >
          <div className="text-[9px] sm:text-[10px] font-bold text-slate-700 mb-2">
            Ordens Recentes
          </div>
          {[
            {
              code: "AG-001847",
              client: "Carlos Silva",
              car: "BMW X5",
              status: "Em Andamento",
              statusColor: "bg-amber-100 text-amber-700",
              value: "R$ 2.850",
            },
            {
              code: "AG-001846",
              client: "Ana Costa",
              car: "Civic 2024",
              status: "Concluido",
              statusColor: "bg-emerald-100 text-emerald-700",
              value: "R$ 1.200",
            },
            {
              code: "AG-001845",
              client: "Pedro Lima",
              car: "Corolla",
              status: "Aprovado",
              statusColor: "bg-blue-100 text-blue-700",
              value: "R$ 4.500",
            },
          ].map((order, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.7 + i * 0.15 }}
              className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[8px] sm:text-[9px] font-bold text-slate-900">
                  {order.code}
                </span>
                <span className="text-[7px] sm:text-[8px] text-slate-400 truncate">
                  {order.client} - {order.car}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className={`text-[6px] sm:text-[7px] font-bold px-1.5 py-0.5 rounded-full ${order.statusColor}`}
                >
                  {order.status}
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-slate-900">
                  {order.value}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative z-10 pt-32 pb-20 lg:pt-44 lg:pb-32 px-6 overflow-hidden min-h-screen flex flex-col justify-center bg-white text-slate-900"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <motion.div
          style={{ y: y1 }}
          className="absolute -top-[5%] -left-[10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-red-100/40 via-indigo-100/30 to-purple-100/40 rounded-full blur-[60px] md:blur-[80px] opacity-70 mix-blend-multiply"
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute top-[10%] -right-[5%] w-[350px] h-[350px] md:w-[500px] md:h-[500px] bg-gradient-to-tr from-pink-100/40 via-red-50/30 to-rose-100/40 rounded-full blur-[60px] md:blur-[80px] opacity-70 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.4]" />
      </div>

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-20">
        {/* Left Column */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/[0.03] border border-black/[0.08] text-[13px] font-semibold text-slate-900 mb-8 backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
            Plataforma #1 para Esteticas Automotivas
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-slate-900 leading-[1.1] [text-wrap:balance]"
          >
            Sua oficina nunca mais sera{" "}
            <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500">
              a mesma.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed"
          >
            De oficina comum a referencia no mercado. Otimize seus processos,
            fidelize seus clientes e garanta previsibilidade financeira todos os
            meses.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-10 text-base bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_15px_35px_-10px_rgba(220,38,38,0.6)] hover:-translate-y-1 font-bold"
              >
                Comecar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#pricing" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all font-semibold backdrop-blur-sm"
              >
                Ver planos
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 pt-8 border-t border-slate-100 w-full flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-6 sm:gap-8 text-sm text-slate-500"
          >
            {[
              "Instalacao imediata",
              "Sem cartao de credito",
              "Suporte via WhatsApp",
            ].map((text) => (
              <div key={text} className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-red-500" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Column: Animated Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="relative mt-8 lg:mt-0"
        >
          <div className="relative rounded-2xl bg-slate-900/5 p-2 md:p-3 backdrop-blur-sm border border-slate-200/50 shadow-2xl">
            {/* Browser Chrome */}
            <div className="w-full rounded-xl bg-white shadow-inner overflow-hidden border border-slate-100 relative">
              <div className="h-8 border-b border-slate-100 flex items-center px-3 gap-2 bg-slate-50/80">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <div className="flex-1 mx-4">
                  <div className="h-4 bg-slate-100 rounded-full flex items-center px-2 max-w-[200px] mx-auto">
                    <span className="text-[7px] text-slate-400">
                      autevo.com.br/dashboard
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-[320px] sm:h-[380px] md:h-[420px]">
                <DashboardMockup />
              </div>
            </div>
          </div>

          {/* Floating notification card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2 }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut",
              }}
              className="absolute -right-2 md:-right-6 top-16 md:top-20 bg-white p-3 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.1)] border border-slate-100 max-w-[160px] md:max-w-[200px]"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div className="text-[10px] font-semibold text-slate-700">
                  Faturamento
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900">+127%</div>
              <div className="text-[8px] text-slate-400">vs. mes anterior</div>
            </motion.div>
          </motion.div>

          {/* Floating OS card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.3 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 5,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -left-2 md:-left-6 bottom-16 md:bottom-20 bg-white p-3 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.1)] border border-slate-100 max-w-[160px] md:max-w-none"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">Nova OS Criada</div>
                  <div className="text-[10px] font-bold text-slate-900">
                    BMW X5 - Polimento
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

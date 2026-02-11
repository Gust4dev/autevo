"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { DollarSign, TrendingUp, Users, Wallet, Check } from "lucide-react";

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  delay = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      const duration = 1500;
      const steps = 30;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayed(value);
          clearInterval(interval);
        } else {
          setDisplayed(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [isInView, value, delay]);

  return (
    <span ref={ref}>
      {prefix}
      {displayed.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

export function FeatureFinance() {
  return (
    <section
      id="financeiro"
      className="py-24 md:py-32 px-6 bg-slate-50 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="order-2 lg:order-1"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-6">
            <DollarSign className="w-4 h-4" />
            Lucro Real
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight leading-tight">
            Voce realmente sabe <br />
            <span className="text-emerald-600">quanto esta ganhando?</span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-8">
            Chega de misturar CPF com CNPJ. Tenha controle financeiro
            profissional e saiba exatamente quanto sua oficina lucra no fim do
            mes.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Fluxo de Caixa",
                desc: "Entradas e saidas diarias, semanais e mensais. Previsibilidade total.",
                icon: Wallet,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                title: "Comissoes",
                desc: "Calculo automatico de comissao por servico ou peca para cada mecanico.",
                icon: Users,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}
                >
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  {card.title}
                </h4>
                <p className="text-slate-500 text-sm">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="order-1 lg:order-2 relative"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-slate-500">
                  Lucro Liquido (Mes Atual)
                </div>
                <div className="text-3xl md:text-4xl font-bold text-slate-900">
                  R$ <AnimatedNumber value={24580} delay={0.5} />
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                {
                  label: "Faturamento",
                  value: 38200,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                  border: "border-emerald-100",
                },
                {
                  label: "Ticket Medio",
                  value: 1850,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                  border: "border-blue-100",
                },
                {
                  label: "A Receber",
                  value: 12400,
                  color: "text-red-600",
                  bg: "bg-red-50",
                  border: "border-red-100",
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-3 rounded-xl ${stat.bg} border ${stat.border}`}
                >
                  <div className="text-[10px] text-slate-500 mb-1">
                    {stat.label}
                  </div>
                  <div className={`text-sm font-bold ${stat.color}`}>
                    R$ <AnimatedNumber value={stat.value} delay={1 + i * 0.2} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chart */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700">
                  Evolucao de Receita
                </span>
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +34%
                </div>
              </div>
              <div className="flex items-end gap-2 h-32">
                {[30, 45, 35, 55, 40, 70, 55, 80, 65, 90, 75, 85].map(
                  (h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ duration: 0.6, delay: 0.5 + i * 0.06 }}
                      viewport={{ once: true }}
                      className={`flex-1 rounded-t-md ${
                        i === 9 ? "bg-emerald-500" : "bg-emerald-200"
                      }`}
                    />
                  ),
                )}
              </div>
            </div>

            {/* Top Employees */}
            <div className="border-t border-slate-100 pt-4">
              <div className="text-xs font-bold text-slate-700 mb-3">
                Top Mecanicos do Mes
              </div>
              {[
                { name: "Joao P.", value: "R$ 4.200", os: 18 },
                { name: "Carlos M.", value: "R$ 3.800", os: 15 },
                { name: "Rafael S.", value: "R$ 2.950", os: 12 },
              ].map((emp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 + i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {emp.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {emp.os} OS
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {emp.value}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Background */}
          <div className="absolute inset-0 bg-emerald-500/5 blur-3xl transform -skew-y-6 rounded-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
}

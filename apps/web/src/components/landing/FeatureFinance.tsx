"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp } from "lucide-react";

export function FeatureFinance() {
  return (
    <section
      id="financeiro"
      className="py-24 px-6 bg-[#050505] relative overflow-hidden"
    >
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="order-2 lg:order-1 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/20 text-emerald-500 text-sm font-semibold mb-6 border border-emerald-500/20">
            <DollarSign className="w-4 h-4" />
            Lucro Real & Gestão Profissional
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight leading-tight">
            Você realmente sabe <br />
            <span className="text-emerald-500">quanto está ganhando?</span>
          </h2>
          <p className="text-zinc-500 text-lg leading-relaxed mb-8">
            Chega de misturar CPF com CNPJ. Tenha controle financeiro
            profissional e saiba exatamente quanto sua oficina lucra no fim do
            mês, descontando cada parafuso e hora técnica.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-lg mx-auto lg:mx-0">
            <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
              <h4 className="text-lg font-bold text-white mb-2">
                Fluxo de Caixa
              </h4>
              <p className="text-zinc-500 text-sm">
                Entradas e saídas diárias, semanais e mensais. Previsibilidade
                total do seu caixa.
              </p>
            </div>
            <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
              <h4 className="text-lg font-bold text-white mb-2">Comissões</h4>
              <p className="text-zinc-500 text-sm">
                Cálculo automático de comissão por serviço ou peça para cada
                membro da sua equipe.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Visual Abstract Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="order-1 lg:order-2 relative"
        >
          <div className="bg-zinc-900 rounded-3xl shadow-2xl border border-white/10 p-8 relative z-10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-sm text-zinc-500">
                  Lucro Líquido (Mês Atual)
                </div>
                <div className="text-3xl font-bold text-white">
                  R$ 24.580,00
                </div>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Abstract Chart Bars */}
            <div className="flex items-end gap-3 h-48 w-full border-b border-white/5 pb-2">
              {[40, 65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${height}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`flex-1 rounded-t-lg ${
                    i % 2 === 0 ? "bg-emerald-600" : "bg-emerald-400"
                  }`}
                />
              ))}
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-6 -right-6 bg-zinc-800 p-4 rounded-2xl shadow-2xl border border-white/10 hidden sm:block">
              <div className="text-xs text-zinc-500 mb-1">Mecânico do Mês</div>
              <div className="font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                João P. (R$ 4.2k comissão)
              </div>
            </div>
          </div>
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-emerald-600/10 blur-[100px] transform -skew-y-6 rounded-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
}

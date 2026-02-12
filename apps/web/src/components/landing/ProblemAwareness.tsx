"use client";

import { motion } from "framer-motion";
import { XCircle, CheckCircle } from "lucide-react";

export function ProblemAwareness() {
  return (
    <section className="py-24 px-6 bg-[#050505] relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center bg-fixed [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.02] invert" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white tracking-tight">
            Sua oficina vive nesse <span className="text-red-600">caos?</span>
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed">
            A maioria dos donos de oficina trabalha muito e vê pouco dinheiro. O
            problema não é o trabalho, é a falta de gestão.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* The Problem */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-red-950/20 border border-red-900/30"
          >
            <h3 className="text-2xl font-bold text-red-500 mb-6 flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              Como é hoje:
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-red-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                OS em papel que somem ou ficam ilegíveis.
              </li>
              <li className="flex items-start gap-3 text-red-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                Cliente ligando toda hora perguntando "tá pronto?".
              </li>
              <li className="flex items-start gap-3 text-red-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                Prejuízo com peças esquecidas no orçamento.
              </li>
              <li className="flex items-start gap-3 text-red-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                Mistura das contas pessoais com as da oficina.
              </li>
            </ul>
          </motion.div>

          {/* The Solution */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-emerald-950/20 border border-emerald-900/30 relative"
          >
            <div className="absolute -top-4 -right-4 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg transform rotate-3">
              Com o Autevo
            </div>
            <h3 className="text-2xl font-bold text-emerald-500 mb-6 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              Como vai ficar:
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                OS Digital enviada no WhatsApp em segundos.
              </li>
              <li className="flex items-start gap-3 text-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                Cliente recebe status automático e confia em você.
              </li>
              <li className="flex items-start gap-3 text-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                Controle total de peças, serviços e lucro real.
              </li>
              <li className="flex items-start gap-3 text-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                Financeiro organizado e previsibilidade de caixa.
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

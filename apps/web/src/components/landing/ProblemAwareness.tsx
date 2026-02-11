"use client";

import { motion } from "framer-motion";
import { XCircle, CheckCircle, ArrowRight } from "lucide-react";

const problems = [
  "OS em papel que somem ou ficam ilegiveis.",
  "Cliente ligando toda hora perguntando \"ta pronto?\".",
  "Prejuizo com pecas esquecidas no orcamento.",
  "Mistura das contas pessoais com as da oficina.",
  "Sem controle de comissao dos mecanicos.",
  "Vistoria na base da confianca, sem registro.",
];

const solutions = [
  "OS Digital enviada no WhatsApp em segundos.",
  "Cliente recebe status automatico e confia em voce.",
  "Controle total de pecas, servicos e lucro real.",
  "Financeiro organizado e previsibilidade de caixa.",
  "Comissoes calculadas automaticamente por servico.",
  "Vistoria com fotos, checklist e assinatura digital.",
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

export function ProblemAwareness() {
  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center bg-fixed [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight">
            Sua oficina vive nesse <span className="text-red-600">caos?</span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
            A maioria dos donos de oficina trabalha muito e ve pouco dinheiro. O
            problema nao e o trabalho, e a falta de gestao.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* The Problem */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-red-50 to-red-50/50 border border-red-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 rounded-full blur-3xl" />
            <h3 className="text-2xl font-bold text-red-900 mb-8 flex items-center gap-3 relative">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              Como e hoje
            </h3>
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-4 relative"
            >
              {problems.map((item, i) => (
                <motion.li
                  key={i}
                  variants={itemVariants}
                  className="flex items-start gap-3 text-red-800/80 bg-white/60 p-3 rounded-xl border border-red-100/50"
                >
                  <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  </span>
                  <span className="font-medium text-[15px]">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* The Solution */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl" />
            <div className="absolute -top-3 -right-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg transform rotate-3">
              Com a Autevo
            </div>
            <h3 className="text-2xl font-bold text-emerald-900 mb-8 flex items-center gap-3 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              Como vai ficar
            </h3>
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-4 relative"
            >
              {solutions.map((item, i) => (
                <motion.li
                  key={i}
                  variants={itemVariants}
                  className="flex items-start gap-3 text-emerald-800/80 bg-white/60 p-3 rounded-xl border border-emerald-100/50"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  </span>
                  <span className="font-medium text-[15px]">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </div>

        {/* Transition CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-slate-500 text-lg mb-4">
            A mudanca comeca com a ferramenta certa.
          </p>
          <div className="inline-flex items-center gap-2 text-red-600 font-bold text-lg">
            Veja como funciona
            <ArrowRight className="w-5 h-5" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const comparison = [
  {
    feature: "Controle de Ordens de Serviço",
    oldWay: "Papéis perdidos, pastas bagunçadas",
    newWay: "Digital, organizado e acessível de qualquer lugar",
  },
  {
    feature: "Vistoria de Veículos",
    oldWay: "Anotações manuais sujeitas a erros",
    newWay: "Checklist fotográfico com prova irrefutável",
  },
  {
    feature: "Gestão Financeira",
    oldWay: "Calculadora e caderninho no fim do dia",
    newWay: "Fluxo de caixa automático e relatórios em tempo real",
  },
  {
    feature: "Comunicação com Cliente",
    oldWay: "Ligações chatas e mensagens soltas",
    newWay: "WhatsApp automático com link de acompanhamento",
  },
  {
    feature: "Previsibilidade de Lucro",
    oldWay: "Sensação de 'não sei quanto sobrou'",
    newWay: "Métricas claras de ticket médio e performance",
  },
];

export function FeatureComparison() {
  return (
    <section className="py-24 px-6 bg-[#0a0a0a] relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            O jeito antigo está <br />
            <span className="text-red-600">matando seu negócio.</span>
          </h2>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
            Compare como sua oficina funciona hoje e como ela pode evoluir com o
            Autevo em apenas 2 minutos.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-white/5 bg-white/[0.03] py-4 px-6 gap-4">
            <div className="hidden md:block text-sm font-bold text-zinc-400 uppercase tracking-widest">
              Funcionalidade
            </div>
            <div className="text-sm font-bold text-red-500 uppercase tracking-widest">
              Métodos Antigos
            </div>
            <div className="text-sm font-bold text-emerald-500 uppercase tracking-widest">
              Com Autevo
            </div>
          </div>

          {comparison.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 border-b border-white/5 py-6 px-6 gap-6 hover:bg-white/[0.01] transition-colors"
            >
              <div className="text-white font-bold md:text-base">
                {item.feature}
              </div>
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-900/50 mt-1 shrink-0" />
                <span className="text-zinc-500 text-sm leading-relaxed">
                  {item.oldWay}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
                <span className="text-zinc-300 text-sm leading-relaxed font-medium">
                  {item.newWay}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-zinc-500 text-sm italic italic">
            * Baseado no feedback de +50 gestores que migraram para o digital.
          </p>
        </div>
      </div>
    </section>
  );
}

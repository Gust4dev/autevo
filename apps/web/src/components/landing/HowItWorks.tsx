"use client";

import { motion } from "framer-motion";
import { UserPlus, Settings, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Crie sua conta",
    description:
      "Cadastro em menos de 2 minutos. Sem cartao de credito, sem complicacao. Ja sai usando.",
    color: "from-red-500 to-red-600",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    number: "02",
    icon: Settings,
    title: "Configure sua oficina",
    description:
      "Cadastre seus servicos, equipe e personalize o sistema com a cara do seu negocio.",
    color: "from-indigo-500 to-indigo-600",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Comece a evoluir",
    description:
      "Crie sua primeira OS, faca vistorias digitais e veja seu faturamento crescer.",
    color: "from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight">
            Comece em <span className="text-red-600">3 passos</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Nao precisa ser expert em tecnologia. Se voce sabe usar um celular,
            voce sabe usar o Autevo.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection line */}
          <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-red-200 via-indigo-200 to-emerald-200 hidden md:block" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
              className="relative text-center"
            >
              {/* Step Number */}
              <div className="relative inline-flex mb-6">
                <div
                  className={`w-16 h-16 rounded-2xl ${step.iconBg} flex items-center justify-center relative z-10`}
                >
                  <step.icon className={`w-7 h-7 ${step.iconColor}`} />
                </div>
                <div
                  className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-[10px] font-bold shadow-lg z-20`}
                >
                  {step.number}
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {step.title}
              </h3>
              <p className="text-slate-500 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

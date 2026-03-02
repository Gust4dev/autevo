"use client";

import {
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  MessageSquare,
  ScanLine,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Ordem de Serviço Digital",
    description:
      "Crie, edite e envie OS profissionais em segundos. Status em tempo real, fotos do antes/depois e checklist de entrada.",
    icon: ClipboardCheck,
    color: "text-red-500",
    bg: "bg-red-40",
  },
  {
    title: "Vistoria Mobile",
    description:
      "Faça vistorias detalhadas pelo celular. Marque avarias em um diagrama interativo e garanta segurança jurídica.",
    icon: ScanLine,
    color: "text-slate-700",
    bg: "bg-slate-100",
  },
  {
    title: "Gestão Financeira",
    description:
      "Fluxo de caixa, comissões automáticas, contas a pagar e receber. Saiba exatamente o lucro da sua oficina.",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Cadastro de Clientes",
    description:
      "Mantenha o histórico completo de cada veículo e cliente. Acesse dados importantes em segundos.",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Automação WhatsApp",
    description:
      "Notifique seu cliente automaticamente quando o carro estiver pronto. Mude o status da OS e o cliente recebe na hora.",
    icon: MessageSquare,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Agendamento Inteligente",
    description:
      "Organize seu pátio e sua equipe. Evite conflitos de horário e tenha visão clara da semana.",
    icon: CalendarDays,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function FeaturesGrid() {
  return (
    <section
      id="funcionalidades"
      className="py-24 px-6 relative bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-6 tracking-tight text-black"
          >
            Uma plataforma completa,
            <br />
            <span className="text-red-600">sem gambiarras</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-600 max-w-2xl mx-auto text-lg leading-relaxed"
          >
            Cada funcionalidade foi pensada para eliminar o caos da sua oficina
            e colocar dinheiro no seu bolso.
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={item}
              className="group p-8 rounded-3xl bg-white border border-zinc-200 hover:border-red-600/30 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors ${feature.bg}`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-black mb-3 group-hover:text-red-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-zinc-600 leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

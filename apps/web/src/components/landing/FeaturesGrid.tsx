"use client";

import {
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  MessageSquare,
  ScanLine,
  Users,
  Smartphone,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Ordem de Servico Digital",
    description:
      "Crie, edite e envie OS profissionais em segundos. Status em tempo real, fotos do antes/depois e envio automatico por WhatsApp.",
    icon: ClipboardCheck,
    color: "text-red-500",
    bg: "bg-red-50",
    borderHover: "hover:border-red-200",
  },
  {
    title: "Vistoria Mobile",
    description:
      "Faca vistorias detalhadas pelo celular com checklist customizavel, fotos com marca d'agua e assinatura digital do cliente.",
    icon: ScanLine,
    color: "text-slate-700",
    bg: "bg-slate-100",
    borderHover: "hover:border-slate-300",
  },
  {
    title: "Gestao Financeira",
    description:
      "Fluxo de caixa, comissoes automaticas, contas a pagar e receber. Saiba exatamente o lucro da sua oficina.",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    borderHover: "hover:border-emerald-200",
  },
  {
    title: "Cadastro de Clientes",
    description:
      "Historico completo de cada veiculo e cliente. Acesse dados, revisoes anteriores e preferencias em segundos.",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    borderHover: "hover:border-blue-200",
  },
  {
    title: "Automacao WhatsApp",
    description:
      "Notifique seu cliente automaticamente quando o carro estiver pronto. Mude o status e o cliente recebe na hora.",
    icon: MessageSquare,
    color: "text-green-600",
    bg: "bg-green-50",
    borderHover: "hover:border-green-200",
  },
  {
    title: "Agendamento Online",
    description:
      "Link exclusivo para seus clientes agendarem online. Organize seu patio e evite conflitos de horario.",
    icon: CalendarDays,
    color: "text-purple-600",
    bg: "bg-purple-50",
    borderHover: "hover:border-purple-200",
  },
  {
    title: "100% Responsivo",
    description:
      "Funciona perfeitamente no celular, tablet e computador. Faca vistorias no patio e gerencie do escritorio.",
    icon: Smartphone,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    borderHover: "hover:border-indigo-200",
  },
  {
    title: "Relatorios Inteligentes",
    description:
      "Dashboards com metricas reais: faturamento, ticket medio, servicos mais vendidos e ranking de mecanicos.",
    icon: BarChart3,
    color: "text-amber-600",
    bg: "bg-amber-50",
    borderHover: "hover:border-amber-200",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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
      className="py-24 md:py-32 px-6 relative bg-slate-50 text-slate-900 overflow-hidden"
    >
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-slate-900"
          >
            Uma plataforma completa,
            <br />
            <span className="text-red-600">sem gambiarras.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed"
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
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={item}
              className={`group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${feature.borderHover}`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-colors ${feature.bg}`}
              >
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

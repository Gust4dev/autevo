"use client";

import {
  CalendarDays,
  CarFront,
  ClipboardCheck,
  DollarSign,
  LayoutDashboard,
  MessageSquare,
  ScanLine,
  Users,
} from "lucide-react";

const features = [
  {
    title: "Ordem de Serviço Digital",
    description:
      "Crie, edite e envie OS profissionais em segundos. Status em tempo real, fotos do antes/depois e checklist de entrada.",
    icon: ClipboardCheck,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "group-hover:border-red-500/50",
  },
  {
    title: "Vistoria Mobile",
    description:
      "Faça vistorias detalhadas pelo celular. Marque avarias em um diagrama interativo e garanta segurança jurídica.",
    icon: ScanLine,
    color: "text-zinc-200",
    bg: "bg-zinc-800",
    border: "group-hover:border-zinc-500/50",
  },
  {
    title: "Gestão Financeira",
    description:
      "Fluxo de caixa, comissões automáticas, contas a pagar e receber. Saiba exatamente o lucro da sua oficina.",
    icon: DollarSign,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "group-hover:border-green-500/50",
  },
  {
    title: "CRM e Clientes",
    description:
      "Histórico completo de cada veículo. Saiba quem são seus melhores clientes e quando eles devem voltar.",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "group-hover:border-blue-500/50",
  },
  {
    title: "Automação WhatsApp",
    description:
      "Notifique seu cliente automaticamente quando o carro estiver pronto. Mude o status da OS e o cliente recebe na hora.",
    icon: MessageSquare,
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "group-hover:border-green-400/50",
  },
  {
    title: "Agendamento Inteligente",
    description:
      "Organize seu pátio e sua equipe. Evite conflitos de horário e tenha visão clara da semana.",
    icon: CalendarDays,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "group-hover:border-purple-500/50",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-24 px-6 relative bg-zinc-950/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Uma plataforma completa,
            <br />
            <span className="text-red-500">sem gambiarras</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Cada funcionalidade foi pensada para eliminar o caos da sua oficina
            e colocar dinheiro no seu bolso.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group p-8 rounded-3xl bg-[#0A0A0B] border border-zinc-800 transition-all duration-300 hover:-translate-y-1 ${feature.border}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bg}`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

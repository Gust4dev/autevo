"use client";

import { motion } from "framer-motion";
import { Users, Bell, ArrowUpRight, MessageCircle } from "lucide-react";

export function RetentionSection() {
  return (
    <section className="py-24 px-6 bg-[#050505] relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main Recovery Card */}
            <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative z-10 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-white font-bold">
                    Alertas de Retenção
                  </span>
                </div>
                <span className="px-3 py-1 bg-red-600/10 text-red-500 rounded-full text-[10px] font-black uppercase">
                  1 alerta crítico
                </span>
              </div>

              {/* The "Cleber" Item from Screenshot 5 */}
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl relative group hover:border-red-600/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-white">
                        Cleber
                      </span>
                      <span className="px-2 py-0.5 bg-red-600/20 text-red-500 rounded text-[10px] font-bold">
                        CRÍTICO
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      BMW X1 • 41 dias ausente
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-600">
                  Última OS: 02/01/2026
                </div>

                {/* Floating Prompt */}
                <div className="absolute top-2 -right-4 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg transform rotate-3 scale-0 group-hover:scale-110 transition-transform">
                  Recuperar agora?
                </div>
              </div>

              {/* Growth Stat */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl">
                  <div className="text-[10px] text-emerald-500 font-bold uppercase mb-1">
                    Receita Recuperável
                  </div>
                  <div className="text-xl font-bold text-white">R$ 12.450</div>
                </div>
                <div className="p-4 bg-zinc-800/50 border border-white/5 rounded-2xl flex items-end justify-between">
                  <div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">
                      Taxa de Retorno
                    </div>
                    <div className="text-xl font-bold text-white">+24%</div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-emerald-500 mb-1" />
                </div>
              </div>
            </div>

            {/* Decorative BG */}
            <div className="absolute inset-0 bg-red-600/10 blur-[100px] rounded-full -z-10" />
          </motion.div>

          {/* Text Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/20 text-emerald-500 text-sm font-semibold mb-6 border border-emerald-500/20">
              <Users className="w-4 h-4" />
              Recuperação Automática de Clientes
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight leading-tight">
              Pare de deixar <br />
              <span className="text-emerald-500">dinheiro na mesa.</span>
            </h2>
            <p className="text-zinc-500 text-lg leading-relaxed mb-8">
              O Autevo monitora o comportamento dos seus clientes e te avisa
              quem está há muito tempo sem voltar. Recupere faturamento
              esquecido com um clique e aumente a recorrência da sua oficina.
            </p>

            <div className="grid gap-6">
              {[
                {
                  title: "Alertas Pró-ativos",
                  desc: "Saiba exatamente quem precisa de uma nova revisão ou troca de óleo.",
                },
                {
                  title: "Histórico Unificado",
                  desc: "Cada veículo tem sua vida documentada, facilitando a venda de novos serviços.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{item.title}</h4>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

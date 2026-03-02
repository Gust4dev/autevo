"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Calendar,
} from "lucide-react";

export function SystemPreviewSection() {
  return (
    <section className="py-24 px-6 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 text-sm font-medium mb-6">
              <LayoutDashboard className="w-4 h-4" />
              Gestão em Tempo Real
            </div>
            <h2 className="text-3xl md:text-6xl font-black text-black mb-6 tracking-tight">
              O controle que sua <br />
              <span className="text-red-600 font-serif italic">
                oficina merece.
              </span>
            </h2>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-8 bg-zinc-900 rounded-3xl border border-white/10 p-2 shadow-2xl overflow-hidden"
          >
            <div className="bg-[#0a0a0a] rounded-2xl h-[500px] relative overflow-hidden flex flex-col">
              {/* Fake System UI */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="w-32 h-4 bg-white/5 rounded" />
                  <div className="w-12 h-4 bg-white/5 rounded" />
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800" />
              </div>

              <div className="p-8 grid grid-cols-3 gap-6">
                {[
                  {
                    label: "Ticket Médio",
                    val: "R$ 1.240",
                    color: "text-emerald-500",
                    icon: TrendingUp,
                  },
                  {
                    label: "Lucro Estimado",
                    val: "R$ 42.150",
                    color: "text-red-500",
                    icon: CreditCard,
                  },
                  {
                    label: "Agendamentos",
                    val: "18 hoje",
                    color: "text-blue-500",
                    icon: Calendar,
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl shadow-inner"
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
                    <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">
                      {stat.label}
                    </div>
                    <div className="text-2xl font-black text-white">
                      {stat.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Service History List (BMW Image reference) */}
              <div className="px-8 flex-1">
                <div className="text-[10px] uppercase font-bold text-zinc-600 mb-4 border-b border-white/5 pb-2">
                  Histórico de Ordens Recentes
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-white/[0.01] rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                          BMW
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            BMW 320i • AG-{868440 + i}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Full Detail Especial
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-white">
                          R$ 23.233,33
                        </div>
                        <div className="text-[10px] text-zinc-600">
                          04/02/2026
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent pointer-events-none" />
            </div>
          </motion.div>

          {/* Side Features */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 bg-zinc-50 rounded-3xl border border-zinc-200 hover:border-red-600/30 shadow-sm transition-all group"
            >
              <h3 className="text-xl font-bold text-black mb-2">
                Histórico Vitalício
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed mb-4">
                Registre cada visita, cada serviço e cada centavo gasto por
                veículo. Tenha o poder dos dados nas suas mãos.
              </p>
              <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "70%" }}
                  className="h-full bg-red-600"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="p-8 bg-zinc-50 rounded-3xl border border-zinc-200 hover:border-emerald-600/30 shadow-sm transition-all group"
            >
              <h3 className="text-xl font-bold text-black mb-2">
                Saúde Financeira
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed mb-4">
                Visualize lucro real, comissões e ticket médio em segundos.
                Decisões baseadas em números, não em achismo.
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 10 }}
                    whileInView={{ height: [10, 20 + i * 5, 10] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      delay: i * 0.1,
                    }}
                    className="w-1 bg-emerald-500 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

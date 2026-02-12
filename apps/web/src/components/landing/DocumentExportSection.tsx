"use client";

import { motion } from "framer-motion";
import { FileText, Download, QrCode, ShieldCheck } from "lucide-react";

export function DocumentExportSection() {
  return (
    <section className="py-24 px-6 bg-[#050505] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/20 text-red-500 text-sm font-semibold mb-6 border border-red-500/20">
            <FileText className="w-4 h-4" />
            Profissionalismo & Segurança
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight leading-tight">
            Relatórios que <br />
            <span className="text-red-600">geram confiança instantânea.</span>
          </h2>
          <p className="text-zinc-500 text-lg leading-relaxed mb-8">
            Saia do amadorismo dos papéis rasgados e mensagens soltas. Entregue
            um **Relatório de Vistoria Profissional** em PDF para seu cliente,
            com fotos em alta definição, laudo de avarias e assinatura digital.
          </p>

          <div className="space-y-4">
            {[
              "Checklist fotográfico de entrada e saída",
              "QR Code para acompanhamento online",
              "Assinatura digital do cliente no celular",
              "Laudo detalhado de avarias e observações",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                </div>
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all group">
              <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              Ver Modelo de Relatório
            </button>
          </div>
        </motion.div>

        {/* PDF Mockup Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Main Paper */}
          <div className="bg-white rounded-xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] p-12 text-zinc-900 aspect-[1/1.4] relative overflow-hidden">
            {/* Header Content inspired by Image 1 */}
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 flex items-center justify-center rounded">
                  <span className="text-white font-black text-2xl italic">
                    A
                  </span>
                </div>
                <div className="text-lg font-black tracking-tighter">
                  Autevo
                </div>
              </div>
              <div className="text-right">
                <QrCode className="w-12 h-12 ml-auto mb-1 text-zinc-800" />
                <div className="text-[8px] font-bold uppercase text-zinc-400">
                  Vistoria On-line
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border-l-4 border-red-600 p-4 mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-900">
                Relatório de Vistoria Profissional
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Cliente
                </div>
                <div className="text-sm font-black">Gustavo Gomes</div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  61 3390-****
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Veículo
                </div>
                <div className="text-sm font-black">BMW 320i</div>
                <div className="text-[10px] font-bold text-red-600 mt-1">
                  AGENDADO
                </div>
              </div>
            </div>

            <div className="mb-12">
              <div className="text-[10px] uppercase font-bold text-zinc-400 mb-3 border-b border-zinc-100 pb-1">
                Vistoria de Entrada (Avarias)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 border border-zinc-200 rounded p-3">
                  <div className="text-xs font-black">Frente Completa</div>
                  <div className="text-[10px] text-zinc-500">
                    Arranhão • Leve
                  </div>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded p-3">
                  <div className="text-xs font-black">Lateral Esquerda</div>
                  <div className="text-[10px] text-zinc-500">
                    Amassado • Moderado
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-12 border-t border-zinc-100 italic font-serif text-3xl opacity-60 text-center">
              Gustavo Gomes
              <div className="text-[8px] font-sans non-italic uppercase font-bold text-zinc-400 mt-2">
                Assinatura do Cliente
              </div>
            </div>

            {/* Float Badge Over PDF */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-1/2 -right-8 bg-black text-white p-4 rounded-2xl shadow-2xl border border-white/10 hidden md:block"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold">PDF Gerado</div>
              </div>
              <div className="text-[10px] text-zinc-400">
                Enviado via WhatsApp
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

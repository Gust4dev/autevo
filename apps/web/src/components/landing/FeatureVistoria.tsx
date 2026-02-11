"use client";

import { motion } from "framer-motion";
import { ScanLine, ShieldCheck, Camera, Check, AlertTriangle } from "lucide-react";

const checklistItems = [
  {
    label: "Frente Completa",
    status: "avaria",
    detail: "Arranhao abaixo da lanterna",
    tags: ["Arranhao", "Leve"],
    delay: 0.3,
  },
  {
    label: "Traseira Completa",
    status: "ok",
    delay: 0.6,
  },
  {
    label: "Lateral Esquerda",
    status: "ok",
    delay: 0.9,
  },
  {
    label: "Para-brisa",
    status: "ok",
    delay: 1.2,
  },
  {
    label: "Teto",
    status: "checking",
    delay: 1.5,
  },
];

export function FeatureVistoria() {
  return (
    <section
      id="vistoria"
      className="py-24 md:py-32 px-6 bg-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Mobile Mockup */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="order-1 relative flex justify-center lg:justify-end"
        >
          <div className="relative">
            {/* Phone Frame */}
            <div className="w-[300px] sm:w-[320px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[3px] border-slate-800">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10" />

              {/* Screen */}
              <div className="w-full bg-slate-50 rounded-[2.2rem] overflow-hidden relative flex flex-col">
                {/* Header */}
                <div className="h-16 bg-white border-b border-slate-100 flex items-center px-4 gap-3 pt-4">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <ScanLine className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800 leading-none">
                      Vistoria de Entrada
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      BMW X5 - Carlos Silva
                    </div>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="h-1.5 bg-slate-100 relative">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: "80%" }}
                    transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-r-full"
                  />
                </div>

                {/* Progress Text */}
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Exterior Geral</span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    viewport={{ once: true }}
                    className="text-[10px] font-bold text-slate-600"
                  >
                    4/5
                  </motion.span>
                </div>

                {/* Checklist */}
                <div className="flex-1 px-3 pb-3 space-y-2 min-h-[380px]">
                  {checklistItems.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: item.delay,
                        type: "spring",
                        stiffness: 200,
                      }}
                      viewport={{ once: true }}
                      className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                        item.status === "avaria"
                          ? "border-amber-200"
                          : item.status === "checking"
                            ? "border-slate-200 border-dashed"
                            : "border-green-100"
                      }`}
                    >
                      <div className="p-2.5 flex items-center gap-3">
                        {/* Icon */}
                        {item.status === "avaria" ? (
                          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                          </div>
                        ) : item.status === "checking" ? (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"
                          >
                            <Camera className="w-5 h-5 text-slate-400" />
                          </motion.div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                            <Check className="w-5 h-5 text-green-500" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[12px] font-bold text-slate-800">
                              {item.label}
                            </span>
                            <span
                              className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                item.status === "avaria"
                                  ? "bg-red-500 text-white"
                                  : item.status === "checking"
                                    ? "bg-slate-200 text-slate-500"
                                    : "bg-emerald-500 text-white"
                              }`}
                            >
                              {item.status === "avaria"
                                ? "Com Avaria"
                                : item.status === "checking"
                                  ? "Pendente"
                                  : "OK"}
                            </span>
                          </div>
                          {item.tags && (
                            <div className="flex gap-1">
                              {item.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[8px] font-bold text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.detail && (
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              {item.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Signature Section */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm mt-3"
                  >
                    <div className="text-[11px] font-bold text-slate-800 mb-2">
                      Assinatura do Cliente
                    </div>
                    <div className="h-14 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
                      <motion.svg
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 2.3, duration: 1.5 }}
                        viewport={{ once: true }}
                        className="w-24 h-10 text-slate-800"
                        viewBox="0 0 100 40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <motion.path
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          transition={{ delay: 2.3, duration: 1.5 }}
                          viewport={{ once: true }}
                          d="M10,25 Q30,15 45,25 T85,20"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    </div>
                  </motion.div>
                </div>

                {/* Action Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5 }}
                  viewport={{ once: true }}
                  className="p-3 bg-white border-t border-slate-100"
                >
                  <div className="w-full h-11 bg-red-600 rounded-full flex items-center justify-center text-white text-[12px] font-bold shadow-lg shadow-red-200">
                    Concluir Vistoria
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-50 rounded-full blur-3xl -z-10" />
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="order-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            Amparo Juridico
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight leading-tight">
            Vistoria digital <br />
            <span className="text-red-600">sem complicacoes.</span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-8">
            Evite dores de cabeca com clientes que alegam avarias que ja
            existiam. Faca um checklist completo com fotos e assinatura digital
            direto do seu celular.
          </p>

          <ul className="space-y-5">
            {[
              {
                text: "Checklist profissional e customizavel.",
                desc: "Crie seus proprios itens de vistoria para cada tipo de servico.",
              },
              {
                text: "Marcacao detalhada de avarias.",
                desc: "Registre tipo, gravidade e localizacao exata de cada dano.",
              },
              {
                text: "Fotos ilimitadas com marca d'agua.",
                desc: "Comprovacao visual com data e hora automatica.",
              },
              {
                text: "Assinatura digital do cliente na tela.",
                desc: "Validade juridica. O cliente assina direto no celular.",
              },
            ].map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 mt-0.5 flex-shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-800 font-semibold">
                    {item.text}
                  </span>
                  <p className="text-slate-500 text-sm mt-0.5">{item.desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

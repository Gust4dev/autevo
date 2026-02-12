"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  ShieldCheck,
  Camera,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

const steps = [
  { id: "vehicle", label: "Dados do Veículo" },
  { id: "photos", label: "Evidência Fotográfica" },
  { id: "checklist", label: "Laudo de Avarias" },
  { id: "signature", label: "Assinatura Digital" },
];

export function FeatureVistoria() {
  const [activeStep, setActiveStep] = useState(0);

  // Auto-cycle steps for the demo
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="vistoria"
      className="py-24 px-6 bg-[#050505] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center border-b border-white/5 pb-24">
        {/* Visual Mobile Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="order-1 relative flex justify-center lg:justify-end transform-gpu will-change-transform"
        >
          <div className="relative w-[320px] h-[640px] bg-black rounded-[3rem] p-4 shadow-[0_0_100px_-20px_rgba(220,38,38,0.2)] border-[8px] border-zinc-900 ring-1 ring-white/10">
            {/* Screen Content */}
            <div className="w-full h-full bg-[#0a0a0a] rounded-[2rem] overflow-hidden relative flex flex-col border border-white/5">
              {/* Top Bar Indicators */}
              <div className="flex gap-1 p-2 bg-white/[0.02] border-b border-white/5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      i <= activeStep ? "bg-red-600" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              {/* Header */}
              <div className="h-14 flex items-center px-4 justify-between border-b border-white/5">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                  {steps[activeStep].label}
                </span>
                <span className="text-[10px] text-zinc-600 font-bold">
                  Step {activeStep + 1}/4
                </span>
              </div>

              {/* Dynamic Content Area */}
              <div className="flex-1 relative p-4">
                <AnimatePresence mode="wait">
                  {activeStep === 0 && (
                    <motion.div
                      key="step0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                        <div className="text-[8px] uppercase text-zinc-500 font-bold mb-1">
                          Cliente
                        </div>
                        <div className="text-sm font-bold text-white">
                          Gustavo Gomes
                        </div>
                      </div>
                      <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                        <div className="text-[8px] uppercase text-zinc-500 font-bold mb-1">
                          Veículo
                        </div>
                        <div className="text-sm font-bold text-white italic">
                          BMW 320i • PRETO
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-2 gap-2"
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-white/5 relative"
                        >
                          <div className="absolute inset-0 bg-red-600/10" />
                          <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {activeStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-3"
                    >
                      <div className="bg-red-950/20 p-3 rounded-xl border border-red-900/30 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] font-bold text-red-500">
                            Frente Completa
                          </div>
                          <div className="text-[8px] text-red-300/60">
                            Arranhão • Leve
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] font-bold text-emerald-500">
                            Teto
                          </div>
                          <div className="text-[8px] text-emerald-300/60">
                            Sem avarias
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col justify-center items-center text-center px-4"
                    >
                      <div className="w-full h-32 bg-zinc-900/50 rounded-2xl border border-dashed border-white/20 relative overflow-hidden mb-4">
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">
                          Assine aqui
                        </div>
                        <motion.svg
                          className="absolute inset-0 w-full h-full text-white"
                          viewBox="0 0 200 100"
                        >
                          <motion.path
                            d="M40,60 C60,40 100,40 120,60 S160,80 180,50"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                          />
                        </motion.svg>
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-red-600 px-4 py-2 rounded-full shadow-lg">
                        Confirmar Vistoria
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fake Bottom Buttons */}
              <div className="p-4 bg-white/[0.01] border-t border-white/5 flex gap-2">
                <div className="flex-1 h-8 rounded-lg bg-zinc-900 border border-white/10" />
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="order-2 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 text-red-500 text-sm font-semibold mb-6 border border-red-500/20">
            <ShieldCheck className="w-4 h-4" />
            Amparo Jurídico & Profissionalismo
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight leading-tight">
            Vistoria digital <br />
            <span className="text-red-500">transparência total.</span>
          </h2>
          <p className="text-zinc-500 text-lg leading-relaxed mb-8">
            Evite dores de cabeça com clientes que alegam avarias que já
            existiam. Faça um checklist completo com fotos em alta definição e
            assinatura digital direto do seu celular.
          </p>

          <div className="grid gap-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-left">
                <h4 className="text-white font-bold mb-1">Evidência em Alta</h4>
                <p className="text-zinc-500 text-sm">
                  Registre cada detalhe do veículo com fotos nítidas por ângulo.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 text-red-600 font-bold">
                OS
              </div>
              <div className="text-left">
                <h4 className="text-white font-bold mb-1">Certeza Jurídica</h4>
                <p className="text-zinc-500 text-sm">
                  Assinatura digital que protege sua oficina e dá segurança ao
                  cliente.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

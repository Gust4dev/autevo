"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function FinalCTA() {
  return (
    <section className="py-24 px-6 relative overflow-hidden bg-[#050505]">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] bg-center invert" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-red-600 to-red-700 rounded-[3rem] p-12 md:p-20 shadow-2xl shadow-red-600/20"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
            Pronto para profissionalizar <br className="hidden md:block" />
            sua gestão de verdade?
          </h2>
          <p className="text-red-100 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Junte-se a dezenas de oficinas que já estão economizando horas de
            burocracia e faturando mais todos os meses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-16 px-12 text-lg bg-black text-white hover:bg-zinc-900 rounded-full font-bold shadow-xl transition-all hover:-translate-y-1"
              >
                Começar Teste Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-red-100/80 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>14 dias grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Cancele a qualquer momento</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

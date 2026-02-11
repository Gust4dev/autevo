"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ricardo Almeida",
    role: "Dono - Auto Center Premium",
    text: "Antes eu perdia horas fazendo OS no papel. Hoje, em 2 minutos ta tudo pronto e o cliente ja recebe no WhatsApp. Meu faturamento cresceu 40% em 3 meses.",
    stars: 5,
    highlight: "faturamento cresceu 40%",
  },
  {
    name: "Fernanda Costa",
    role: "Gerente - Estetica AutoBrilho",
    text: "A vistoria digital acabou com aquele problema de cliente reclamando de avaria que ja existia. Hoje tenho tudo documentado com foto e assinatura.",
    stars: 5,
    highlight: "tudo documentado",
  },
  {
    name: "Marcos Oliveira",
    role: "Proprietario - MO Detailing",
    text: "O controle financeiro mudou minha vida. Eu nao sabia exatamente quanto estava ganhando. Agora vejo o lucro real todo dia e consigo planejar o crescimento.",
    stars: 5,
    highlight: "lucro real todo dia",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight">
            Quem usa, <span className="text-red-600">recomenda.</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Veja o que donos de oficinas como a sua dizem sobre o Autevo.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 relative hover:shadow-lg transition-shadow"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6">
                <Quote className="w-8 h-8 text-red-100" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-slate-600 leading-relaxed mb-6 text-[15px]">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {t.name}
                  </div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { MessageSquare, Bell, CheckCheck } from "lucide-react";

const messages = [
  {
    type: "received",
    text: "Olá João! O orçamento da sua revisão ficou pronto. 🛠️\n\nValor total: R$ 850,00\nClique abaixo para ver os detalhes e aprovar:\nautevo.com/orc/123",
    time: "10:42",
  },
  {
    type: "sent",
    text: "Opa, maravilha! Já aprovei aí pelo link. Podem começar 👍",
    time: "10:45",
  },
  {
    type: "received",
    text: "Perfeito! Já iniciamos o serviço. Te aviso assim que estiver pronto para você buscar. 🚗💨",
    time: "10:45",
  },
];

export function FeatureWhatsapp() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 1.5, // Faster time between messages
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  const textVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        delay: i * 0.015, // Faster typing speed
      },
    }),
  };

  return (
    <section className="py-24 px-6 bg-zinc-50 relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-6">
            <MessageSquare className="w-4 h-4" />
            Automação Inteligente & WhatsApp
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-black tracking-tight leading-tight">
            Seu cliente avisado <br />
            <span className="text-emerald-600">sem você perder tempo.</span>
          </h2>
          <p className="text-zinc-600 text-lg leading-relaxed">
            Pare de gastar o dia no WhatsApp respondendo "tá pronto?". O sistema
            avisa automaticamente quando o orçamento for criado, aprovado ou
            quando o carro estiver pronto para retirada.
          </p>
        </motion.div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* Fake WhatsApp Interface (Dark Mode) */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-[#0b141a] rounded-[2.5rem] p-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-[8px] border-zinc-900 relative overflow-hidden min-h-[500px] z-10"
        >
          {/* Header */}
          <div className="bg-[#202c33] p-4 -mx-4 -mt-4 mb-6 flex items-center gap-3 text-white border-b border-white/5">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm">
              AO
            </div>
            <div>
              <div className="font-bold text-sm">Autevo Oficina</div>
              <div className="text-[10px] text-green-500">Online</div>
            </div>
          </div>

          {/* Chat Messages */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6 font-sans text-sm pb-8 h-full"
          >
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={`p-3 rounded-xl shadow-sm text-[#e9edef] relative ${
                  msg.type === "received"
                    ? "bg-[#202c33] rounded-tl-none mr-auto max-w-[85%]"
                    : "bg-[#005c4b] rounded-tr-none ml-auto max-w-[85%]"
                }`}
              >
                {/* Typing effect simulation - USING SPREAD TO FIX EMOJI HYDRATION */}
                <div className="whitespace-pre-line leading-relaxed">
                  {[...msg.text].map((char, charIdx) => (
                    <motion.span
                      key={charIdx}
                      variants={textVariants}
                      custom={charIdx}
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>

                <div className="flex justify-end gap-1 mt-2 items-center opacity-60">
                  <span className="text-[10px]">{msg.time}</span>
                  {msg.type === "sent" && (
                    <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
                  )}
                </div>

                {/* Bubble Tip */}
                <div
                  className={`absolute top-0 w-2 h-2 ${
                    msg.type === "received"
                      ? "-left-1.5 bg-[#202c33] [clip-path:polygon(100%_0,0_0,100%_100%)]"
                      : "-right-1.5 bg-[#005c4b] [clip-path:polygon(0_0,100%_0,0_100%)]"
                  }`}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating Notification - OUTSIDE the overflow hidden container */}
        <motion.div
          initial={{ scale: 0, opacity: 0, x: 20 }}
          whileInView={{
            scale: 1,
            opacity: 1,
            x: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 3.5, // Sync with the "sent" message
          }}
          viewport={{ once: true }}
          className="absolute top-1/2 -right-4 md:-right-32 transform -translate-y-1/2 z-20 transform-gpu will-change-transform"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              // Omnidirectional Glow Animation
              boxShadow: [
                "0 0 0px rgba(16, 185, 129, 0)",
                "0 0 30px rgba(16, 185, 129, 0.4)",
                "0 0 15px rgba(16, 185, 129, 0.2)",
              ],
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "easeInOut",
            }}
            className="bg-zinc-900/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl flex items-center gap-4 w-72 border border-emerald-500/30"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <motion.div
                animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 5 }}
              >
                <Bell className="w-6 h-6" />
              </motion.div>
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-tight mb-0.5">
                Orçamento Aprovado
              </div>
              <div className="text-[11px] text-zinc-400 font-medium">
                João aprovou a revisão agora pelo WhatsApp.
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Blur */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />
    </section>
  );
}

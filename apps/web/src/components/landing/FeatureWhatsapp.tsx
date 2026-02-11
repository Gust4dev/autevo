"use client";

import { motion } from "framer-motion";
import { MessageSquare, Bell, CheckCheck, Send } from "lucide-react";

const messages = [
  {
    type: "sent" as const,
    text: "Ola Joao! O orcamento da sua revisao ficou pronto.",
    time: "10:42",
    delay: 0.3,
  },
  {
    type: "sent" as const,
    text: "Valor total: R$ 850,00\nClique abaixo para ver os detalhes e aprovar:",
    link: "autevo.com/orcamento/123",
    time: "10:42",
    delay: 0.8,
  },
  {
    type: "received" as const,
    text: "Opa, maravilha! Ja aprovei ai. Podem comecar",
    time: "10:45",
    delay: 1.8,
  },
  {
    type: "sent" as const,
    text: "Perfeito! Ja iniciamos o servico. Te aviso assim que estiver pronto.",
    time: "10:45",
    delay: 2.8,
  },
  {
    type: "sent" as const,
    text: "Joao, seu carro esta pronto! Pode retirar a qualquer momento. Obrigado pela preferencia!",
    time: "16:30",
    delay: 3.8,
  },
];

function TypingIndicator({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay }}
      viewport={{ once: true }}
      className="bg-white p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm max-w-[100px]"
    >
      <div className="flex gap-1 items-center h-4">
        {[0, 0.15, 0.3].map((d, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{
              repeat: Infinity,
              duration: 0.6,
              delay: d,
              ease: "easeInOut",
            }}
            className="w-2 h-2 rounded-full bg-slate-300"
          />
        ))}
      </div>
    </motion.div>
  );
}

export function FeatureWhatsapp() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-6"
        >
          <MessageSquare className="w-4 h-4" />
          Automacao Inteligente
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight leading-tight"
        >
          Seu cliente avisado <br />
          <span className="text-green-600">sem voce perder tempo.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto"
        >
          Pare de gastar o dia no WhatsApp respondendo "ta pronto?". O sistema
          avisa automaticamente quando o orcamento for criado, aprovado ou
          quando o carro estiver pronto.
        </motion.p>
      </div>

      <div className="max-w-md mx-auto relative">
        {/* Phone Frame */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Phone body */}
          <div className="bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[3px] border-slate-800">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10" />

            {/* Screen */}
            <div className="bg-[#E5DDD5] rounded-[2.2rem] overflow-hidden relative">
              {/* WhatsApp Header */}
              <div className="bg-[#008069] p-4 pt-8 flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <img src="/icon.svg" alt="" className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">Autevo Oficina</div>
                  <div className="text-[11px] opacity-80">online</div>
                </div>
              </div>

              {/* Chat Background Pattern */}
              <div
                className="p-4 space-y-3 font-sans text-sm min-h-[420px] relative"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8c8c8' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }}
              >
                {/* Date Pill */}
                <div className="flex justify-center mb-2">
                  <div className="bg-white/80 text-[10px] text-slate-500 px-3 py-1 rounded-full shadow-sm font-medium">
                    Hoje
                  </div>
                </div>

                {/* Messages with typing animation */}
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: msg.delay,
                      duration: 0.3,
                      type: "spring",
                      stiffness: 200,
                    }}
                    viewport={{ once: true }}
                    className={`${msg.type === "received" ? "" : "flex justify-end"}`}
                  >
                    <div
                      className={`p-3 shadow-sm max-w-[85%] text-slate-800 ${
                        msg.type === "received"
                          ? "bg-[#D9FDD3] rounded-tl-xl rounded-bl-xl rounded-br-xl ml-auto"
                          : "bg-white rounded-tr-xl rounded-bl-xl rounded-br-xl"
                      }`}
                    >
                      <div className="whitespace-pre-line text-[13px]">
                        {msg.text}
                      </div>
                      {msg.link && (
                        <div className="text-blue-500 underline text-[12px] mt-1">
                          {msg.link}
                        </div>
                      )}
                      <div
                        className={`flex items-center gap-1 mt-1 ${msg.type === "received" ? "justify-end" : "justify-end"}`}
                      >
                        <span className="text-[10px] text-slate-400">
                          {msg.time}
                        </span>
                        {msg.type === "sent" && (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input Bar */}
              <div className="bg-[#F0F0F0] p-2 flex items-center gap-2">
                <div className="flex-1 bg-white rounded-full px-4 py-2 text-[12px] text-slate-400">
                  Mensagem automatica...
                </div>
                <div className="w-9 h-9 rounded-full bg-[#008069] flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating Notifications */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
          viewport={{ once: true }}
          className="absolute top-32 -right-4 md:-right-24 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 w-56 md:w-64 border border-slate-100 hidden sm:flex"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Orcamento Aprovado
            </div>
            <div className="text-[11px] text-slate-500">
              Cliente aprovou troca de oleo e filtros.
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ delay: 2.5 }}
          viewport={{ once: true }}
          className="absolute bottom-32 -left-4 md:-left-24 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 w-56 md:w-64 border border-emerald-100 hidden sm:flex"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Entrega Notificada
            </div>
            <div className="text-[11px] text-slate-500">
              Cliente avisado que o carro esta pronto.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

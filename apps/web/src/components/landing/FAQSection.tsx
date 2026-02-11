"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageSquare } from "lucide-react";

const faqs = [
  {
    question: "Preciso instalar algum programa no computador?",
    answer:
      "Nao! O Autevo e 100% online. Voce acessa pelo navegador do seu computador, tablet ou celular, de onde estiver. Nao precisa baixar nem instalar nada.",
  },
  {
    question: "Funciona bem no celular?",
    answer:
      "Sim, perfeitamente. Criamos um design especifico para celular, para que voce possa fazer vistorias, criar orcamentos e consultar placas direto do patio, sem precisar ir ate o escritorio.",
  },
  {
    question: "Da para emitir Nota Fiscal?",
    answer:
      "No momento estamos focados na gestao interna e controle financeiro. A emissao de NF-e sera adicionada em breve, mas voce ja pode exportar relatorios prontos para sua contabilidade.",
  },
  {
    question: "Meus dados estao seguros?",
    answer:
      "Com certeza. Usamos criptografia de ponta a ponta e backups diarios automaticos. Seus dados estao mais seguros com a gente do que em um computador na oficina que pode queimar ou pegar virus.",
  },
  {
    question: "Tem fidelidade ou multa de cancelamento?",
    answer:
      "Nenhuma. Voce assina mes a mes e pode cancelar quando quiser, sem perguntas e sem letras miudas. Queremos que voce fique pelos resultados, nao por contrato.",
  },
  {
    question: "Quantos funcionarios posso cadastrar?",
    answer:
      "Voce pode cadastrar quantos funcionarios precisar, sem limite. Cada um pode ter seu proprio acesso ao sistema com permissoes personalizadas.",
  },
  {
    question: "Consigo migrar dados do meu sistema antigo?",
    answer:
      "Sim! No plano anual, oferecemos migracao de dados gratuita. Nossa equipe te ajuda a importar seus clientes, veiculos e historico para o Autevo.",
  },
  {
    question: "O sistema envia mensagens automaticas pelo WhatsApp?",
    answer:
      "Sim. Quando voce muda o status de uma OS (orcamento pronto, aprovado, carro pronto), o cliente recebe uma notificacao automatica via WhatsApp com os detalhes.",
  },
];

export function FAQSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight">
            Duvidas Frequentes
          </h2>
          <p className="text-slate-600 text-lg">
            Tire suas duvidas e veja porque o Autevo e a escolha certa.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-slate-200 rounded-2xl bg-white px-2 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left text-slate-900 font-semibold text-base hover:text-red-600 hover:no-underline px-4 py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-[15px] leading-relaxed px-4 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* CTA below FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12 p-8 rounded-2xl bg-white border border-slate-200"
        >
          <p className="text-slate-600 mb-4">
            Ainda tem duvidas? Fale com a gente!
          </p>
          <Link
            href="https://wa.me/5500000000000"
            target="_blank"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
          >
            <MessageSquare className="w-4 h-4" />
            Falar no WhatsApp
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

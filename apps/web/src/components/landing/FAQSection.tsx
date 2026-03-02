"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Preciso instalar algum programa no computador?",
    answer:
      "Não! O Autevo é 100% online. Você acessa pelo navegador do seu computador, tablet ou celular, de onde estiver. Não precisa baixar nem instalar nada.",
  },
  {
    question: "Funciona bem no celular?",
    answer:
      "Sim, perfeitamente. Criamos um design específico para celular, para que você possa fazer vistorias, criar orçamentos e consultar placas direto do pátio, sem precisar ir até o escritório.",
  },
  {
    question: "Dá para emitir Nota Fiscal?",
    answer:
      "No momento estamos focados na gestão interna e controle financeiro. A emissão de NF-e será adicionada em breve, mas você já pode exportar relatórios prontos para sua contabilidade.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Com certeza. Usamos criptografia de ponta a ponta e backups diários automáticos. Seus dados estão mais seguros com a gente do que em um computador na oficina que pode queimar ou pegar vírus.",
  },
  {
    question: "Tem fidelidade ou multa de cancelamento?",
    answer:
      "Nenhuma. Você assina mês a mês e pode cancelar quando quiser, sem perguntas e sem letras miúdas. Queremos que você fique pelos resultados, não por contrato.",
  },
];

export function FAQSection() {
  return (
    <section className="py-24 px-6 bg-zinc-50 relative overflow-hidden">
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black tracking-tight">
            Dúvidas Frequentes
          </h2>
          <p className="text-zinc-600 text-lg">
            Tire suas dúvidas e veja por que o Autevo é a escolha certa para sua
            oficina.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-zinc-200 bg-white rounded-2xl px-4 transition-colors hover:border-red-600/30 shadow-sm"
            >
              <AccordionTrigger className="text-left text-black font-bold text-lg hover:text-red-600 hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-zinc-600 text-base leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Decorative Orbs */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] -z-10" />
    </section>
  );
}

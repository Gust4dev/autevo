"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function Counter({
  end,
  suffix = "",
  prefix = "",
  duration = 2000,
}: {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const steps = 40;
    const increment = end / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [isInView, end, duration]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold text-white">
      {prefix}
      {count.toLocaleString("pt-BR")}
      {suffix}
    </div>
  );
}

const metrics = [
  {
    value: 500,
    suffix: "+",
    label: "Oficinas ja confiam no Autevo",
    detail: "Em todo o Brasil",
  },
  {
    value: 25000,
    suffix: "+",
    label: "Ordens de Servico criadas",
    detail: "E crescendo todo dia",
  },
  {
    value: 98,
    suffix: "%",
    label: "De satisfacao dos clientes",
    detail: "Avaliacao media",
  },
  {
    value: 4,
    suffix: ".8",
    prefix: "",
    label: "Nota media de avaliacao",
    detail: "De 5 estrelas",
  },
];

export function MetricsSection() {
  return (
    <section className="py-20 md:py-24 px-6 bg-slate-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Counter
                end={metric.value}
                suffix={metric.suffix}
                prefix={metric.prefix || ""}
              />
              <div className="text-sm font-medium text-zinc-300 mt-2">
                {metric.label}
              </div>
              <div className="text-xs text-zinc-500 mt-1">{metric.detail}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

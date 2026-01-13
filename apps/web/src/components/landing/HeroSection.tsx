"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const { left, top, width, height } =
          containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        setMousePosition({ x, y });
      }
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden min-h-screen flex flex-col justify-center"
    >
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute top-[-10%] left-[20%] w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * -30}px, ${
              mousePosition.y * -30
            }px)`,
          }}
        />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Trust Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-950/30 border border-red-500/20 text-sm mb-10 hover:border-red-500/40 transition-colors shadow-2xl backdrop-blur-sm group cursor-default">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-zinc-300">Oferta Exclusiva:</span>
          <span className="text-white font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            60 Dias Premium por R$ 97,00
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 drop-shadow-2xl text-white">
          Sua Oficina <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">
            Lucrativa de Verdade
          </span>
        </h1>

        <p className="text-lg md:text-2xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          O sistema definitivo para controlar{" "}
          <span className="text-white font-medium">financeiro</span>,{" "}
          <span className="text-white font-medium">agendamentos</span> e{" "}
          <span className="text-white font-medium">vistorias</span>. Pare de
          perder dinheiro com papelada e planilhas.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-16 px-10 text-lg bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(220,38,38,0.6)] font-bold"
            >
              Evoluir de Nível Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="#pricing" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-16 px-10 text-lg rounded-2xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-white hover:border-zinc-700 transition-all font-medium"
            >
              Ver Planos
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-zinc-500 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            Dados Criptografados
          </div>
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-zinc-400 fill-zinc-400" />
            Setup em 2 minutos
          </div>
        </div>
      </div>
    </section>
  );
}

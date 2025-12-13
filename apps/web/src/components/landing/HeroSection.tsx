'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        setMousePosition({ x, y });
      }
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section ref={containerRef} className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
      {/* Parallax Background Elements - Fixed to viewport for persistent presence */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${mousePosition.x * -60}px, ${mousePosition.y * -60}px)`
        }}
      >
        <div className="absolute top-[10%] left-[10%] w-[60%] h-[60%] bg-indigo-600/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[60%] h-[60%] bg-violet-600/30 rounded-full blur-[120px] animate-pulse [animation-delay:2000ms]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-900/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300 mb-8 animate-fade-in-up hover:scale-105 transition-transform cursor-default"
          style={{ transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)` }}
        >
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Nova Versão 2.0 Disponível
        </div>
        
        <h1 
          className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 animate-fade-in-up [animation-delay:100ms] drop-shadow-2xl"
          style={{ transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)` }}
        >
          A Gestão da Sua Estética <br className="hidden lg:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent bg-[size:200%] animate-shimmer">
            Elevada ao Nível Premium
          </span>
        </h1>
        
        <p 
          className="text-lg lg:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up [animation-delay:200ms]"
          style={{ transform: `translate(${mousePosition.x * -10}px, ${mousePosition.y * -10}px)` }}
        >
          Abandone as planilhas e o papel. Controle agendamentos, vistorias, financeiro e clientes em uma plataforma fluida, bonita e inteligente.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up [animation-delay:300ms]">
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button size="lg" className="w-full h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_0_30px_-5px_rgba(79,70,229,0.5)] transition-all hover:scale-105 border-none hover:shadow-[0_0_40px_-5px_rgba(79,70,229,0.7)]">
              Começar Agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full h-12 px-8 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm shadow-lg">
              <Play className="mr-2 h-4 w-4 fill-white" />
              Ver Demonstração
            </Button>
          </Link>
        </div>
      </div>

      {/* Dashboard Mockup with 3D Tilt */}
      <div 
        className="mt-20 relative max-w-6xl mx-auto animate-fade-in-up [animation-delay:500ms] perspective-[2000px]"
        style={{
          transform: `translateY(${scrollY * -0.1}px)`
        }}
      >
         {/* Glow Effect behind mockup */}
        <div className="absolute inset-0 bg-indigo-600/20 blur-[120px] -z-10 rounded-full opacity-50 transition-opacity duration-500 hover:opacity-70" />
        
        <div 
          className="relative rounded-2xl border border-white/10 bg-[#0A0A0B]/80 backdrop-blur-2xl shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-100 ease-out hover:shadow-[0_0_80px_-20px_rgba(79,70,229,0.3)]"
          style={{
            transform: `rotateX(${mousePosition.y * 15}deg) rotateY(${mousePosition.x * 15}deg)`
          }}
        >
          {/* Mockup Header */}
          <div className="h-10 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
            <div className="ml-4 h-5 w-64 rounded-md bg-white/5 flex items-center px-2">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="ml-2 w-20 h-2 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Mockup Body */}
          <div className="flex h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/5 p-4 flex flex-col gap-2 hidden md:flex">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 rounded-lg bg-white/5 w-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
            
            {/* Main Content */}
            <div className="flex-1 p-6 lg:p-8 bg-gradient-to-br from-transparent to-indigo-900/10">
              <div className="flex justify-between items-center mb-8">
                <div className="h-8 w-48 bg-white/10 rounded-lg" />
                <div className="h-8 w-32 bg-indigo-500/20 rounded-lg border border-indigo-500/30" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                 <div className="h-32 rounded-xl bg-white/5 border border-white/5 p-4 relative overflow-hidden shadow-lg transition-transform hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/20 mb-4" />
                    <div className="h-6 w-24 bg-white/10 rounded-md mb-2" />
                    <div className="h-8 w-16 bg-white/20 rounded-md" />
                 </div>
                 <div className="h-32 rounded-xl bg-white/5 border border-white/5 p-4 relative overflow-hidden shadow-lg transition-transform hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />
                    <div className="h-8 w-8 rounded-lg bg-violet-500/20 mb-4" />
                    <div className="h-6 w-24 bg-white/10 rounded-md mb-2" />
                    <div className="h-8 w-16 bg-white/20 rounded-md" />
                 </div>
                 <div className="h-32 rounded-xl bg-white/5 border border-white/5 p-4 relative overflow-hidden shadow-lg transition-transform hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 mb-4" />
                    <div className="h-6 w-24 bg-white/10 rounded-md mb-2" />
                    <div className="h-8 w-16 bg-white/20 rounded-md" />
                 </div>
              </div>

              <div className="h-64 rounded-xl bg-white/5 border border-white/5 p-6 shadow-lg">
                 <div className="flex gap-4 mb-4">
                   <div className="h-4 w-24 bg-white/10 rounded" />
                   <div className="h-4 w-24 bg-white/5 rounded" />
                 </div>
                 <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 w-full rounded-lg bg-white/5 border border-white/5 flex items-center px-4">
                         <div className="w-8 h-8 rounded-full bg-white/10 mr-4" />
                         <div className="h-4 w-32 bg-white/10 rounded" />
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Lexend_Deca, Delius } from 'next/font/google';
import { 
  ArrowRight, 
  Calendar, 
  Car, 
  Wallet, 
  Smartphone,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { HeroSection } from '@/components/landing/HeroSection';

const lexendDeca = Lexend_Deca({ 
  subsets: ['latin'], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] 
});

const delius = Delius({ 
  subsets: ['latin'], 
  weight: ['400'] 
});

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className={cn("min-h-screen bg-[#0A0A0B] text-white selection:bg-indigo-500/30 overflow-x-hidden", lexendDeca.className)}>
      
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0A0A0B]/60 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/50">
              <span className={cn("font-bold text-white", delius.className)}>F</span>
            </div>
            <span className={cn("font-bold text-lg tracking-tight", delius.className)}>Filmtech<span className="text-indigo-400">OS</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-white text-black hover:bg-zinc-200 border-none shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Interactive Hero Section */}
      <HeroSection />

      {/* Bento Grid Features */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 drop-shadow-xl">Tudo que você precisa em um só lugar</h2>
            <p className="text-zinc-400 text-lg">Funcionalidades poderosas para escalar sua estética automotiva.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1: Large - Calendar */}
            <div className="md:col-span-2 rounded-3xl p-8 bg-zinc-900/50 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-500 shadow-2xl hover:shadow-[0_0_50px_-10px_rgba(79,70,229,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-1 ring-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Agendamento Inteligente</h3>
                <p className="text-zinc-400 max-w-md">Sistema visual de calendário que evita conflitos e lembra seus clientes automaticamente via WhatsApp.</p>
                
                {/* Visual */}
                <div className="flex-1 mt-6 rounded-t-xl bg-[#0A0A0B]/80 border border-white/10 p-4 translate-y-4 shadow-2xl group-hover:translate-y-2 transition-transform duration-500">
                  <div className="grid grid-cols-7 gap-2 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                     {[...Array(7)].map((_, i) => (
                       <div key={i} className="h-20 rounded bg-white/5 border border-white/5 relative">
                          {i === 2 && <div className="absolute top-2 left-2 right-2 h-8 rounded bg-indigo-500/50 text-[10px] p-1 text-white shadow-lg shadow-indigo-500/20">BMW X5 - Polimento</div>}
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Financeiro */}
            <div className="rounded-3xl p-8 bg-zinc-900/50 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-500 shadow-2xl hover:shadow-[0_0_50px_-10px_rgba(16,185,129,0.2)]">
               <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-emerald-500/20 rounded-full blur-[50px] transition-all duration-500 group-hover:blur-[80px]" />
               <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-1 ring-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Financeiro</h3>
                <p className="text-zinc-400 text-sm">Controle total de fluxo de caixa, comissões e vendas.</p>
                <div className="mt-6">
                   <div className="text-3xl font-mono font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">R$ 48.250</div>
                   <div className="text-emerald-400 text-sm flex items-center gap-1">
                     <ArrowRight className="h-3 w-3 rotate-[-45deg]" />
                     +12.5% esse mês
                   </div>
                </div>
            </div>
            
             {/* Feature 3: Vistoria */}
            <div className="rounded-3xl p-8 bg-zinc-900/50 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-yellow-500/50 transition-all duration-500 shadow-2xl hover:shadow-[0_0_50px_-10px_rgba(234,179,8,0.2)]">
                 <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                 <div className="bg-yellow-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-1 ring-yellow-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Vistoria Mobile</h3>
                <p className="text-zinc-400 text-sm">Checklist digital com fotos e marcação de avarias no veículo.</p>
            </div>

             {/* Feature 4: Customers */}
            <div className="md:col-span-2 rounded-3xl p-8 bg-zinc-900/50 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/50 transition-all duration-500 shadow-2xl hover:shadow-[0_0_50px_-10px_rgba(139,92,246,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex items-center justify-between h-full">
                 <div className="max-w-sm">
                    <div className="bg-violet-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-1 ring-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Car className="text-violet-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Histórico de Veículos</h3>
                    <p className="text-zinc-400">Saiba exatamente o que foi feito em cada carro. Fidelize clientes com atendimento personalizado.</p>
                 </div>
                 {/* Decorative Mockup */}
                 <div className="hidden md:block w-64 h-full bg-[#0A0A0B]/50 border-l border-white/5 p-4 shadow-xl -mr-8 group-hover:-mr-4 transition-all duration-500">
                     <div className="space-y-3">
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                           <div className="w-8 h-8 rounded-full bg-indigo-500/50" />
                           <div className="flex-1">
                              <div className="h-2 w-20 bg-white/20 rounded mb-1" />
                              <div className="h-2 w-12 bg-white/10 rounded" />
                           </div>
                        </div>
                         <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 opacity-50">
                           <div className="w-8 h-8 rounded-full bg-white/10" />
                           <div className="flex-1">
                              <div className="h-2 w-20 bg-white/20 rounded mb-1" />
                              <div className="h-2 w-12 bg-white/10 rounded" />
                           </div>
                        </div>
                     </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0A0A0B] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
            <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
              <span className="font-bold text-white text-xs">F</span>
            </div>
            <span className="font-bold text-zinc-200">FilmtechOS</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2024 Filmtech OS. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">Termos</Link>
            <Link href="#" className="text-zinc-500 hover:text-white transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lexend_Deca, Delius } from "next/font/google"; // Keep font imports
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { PricingSection } from "@/components/landing/PricingSection";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const delius = Delius({
  subsets: ["latin"],
  weight: ["400"],
});

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-[#050505] text-white selection:bg-red-500/30 overflow-x-hidden",
        lexendDeca.className
      )}
    >
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <img
                src="/icon.svg"
                alt="Autevo Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span
              className={cn(
                "font-bold text-lg tracking-tight text-zinc-100",
                delius.className
              )}
            >
              Autevo
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link href="/sign-up">
              <Button
                size="sm"
                className="bg-zinc-100 text-black hover:bg-white border-none font-bold"
              >
                Evoluir Agora
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Sections */}
      <HeroSection />

      <FeaturesGrid />

      <PricingSection />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center">
                <img
                  src="/icon.svg"
                  alt="Autevo Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-xl text-white">Autevo</span>
            </div>
            <p className="text-zinc-500 leading-relaxed">
              A plataforma definitiva para oficinas que querem crescer de
              verdade. Controle, gestão e lucro em um só lugar.
            </p>
          </div>

          <div className="flex gap-12 text-sm text-zinc-500">
            <div className="flex flex-col gap-4">
              <h4 className="text-white font-bold">Produto</h4>
              <Link href="#" className="hover:text-red-500 transition-colors">
                Funcionalidades
              </Link>
              <Link
                href="#pricing"
                className="hover:text-red-500 transition-colors"
              >
                Planos
              </Link>
              <Link
                href="/sign-up"
                className="hover:text-red-500 transition-colors"
              >
                Evoluir Agora
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-white font-bold">Legal</h4>
              <Link href="#" className="hover:text-red-500 transition-colors">
                Termos de Uso
              </Link>
              <Link href="#" className="hover:text-red-500 transition-colors">
                Privacidade
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 text-center text-zinc-600 text-sm">
          © 2025 Autevo. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

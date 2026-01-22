import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Lexend_Deca, Delius } from "next/font/google";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { HeroSection } from "@/components/landing/HeroSection";

// Below-fold components - lazy loaded for better initial bundle size
const ProblemAwareness = dynamic(
  () =>
    import("@/components/landing/ProblemAwareness").then((m) => ({
      default: m.ProblemAwareness,
    })),
  { ssr: true },
);
const FeaturesGrid = dynamic(
  () =>
    import("@/components/landing/FeaturesGrid").then((m) => ({
      default: m.FeaturesGrid,
    })),
  { ssr: true },
);
const FeatureVistoria = dynamic(
  () =>
    import("@/components/landing/FeatureVistoria").then((m) => ({
      default: m.FeatureVistoria,
    })),
  { ssr: true },
);
const FeatureFinance = dynamic(
  () =>
    import("@/components/landing/FeatureFinance").then((m) => ({
      default: m.FeatureFinance,
    })),
  { ssr: true },
);
const FeatureWhatsapp = dynamic(
  () =>
    import("@/components/landing/FeatureWhatsapp").then((m) => ({
      default: m.FeatureWhatsapp,
    })),
  { ssr: true },
);
const FAQSection = dynamic(
  () =>
    import("@/components/landing/FAQSection").then((m) => ({
      default: m.FAQSection,
    })),
  { ssr: true },
);
const FinalCTA = dynamic(
  () =>
    import("@/components/landing/FinalCTA").then((m) => ({
      default: m.FinalCTA,
    })),
  { ssr: true },
);
const ScrollToTop = dynamic(
  () =>
    import("@/components/landing/ScrollToTop").then((m) => ({
      default: m.ScrollToTop,
    })),
  { ssr: true },
);

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const delius = Delius({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
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
        lexendDeca.className,
      )}
    >
      <ScrollToTop />
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl transition-colors duration-500 transform-gpu">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="#hero" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 bg-white/5 border border-white/10 group-hover:border-white/20">
              <img
                src="/icon.svg"
                alt="Autevo Logo"
                className="w-full h-full object-contain p-1.5"
                loading="eager"
              />
            </div>
            <span
              className={cn(
                "font-bold text-xl tracking-tight text-white",
                delius.className,
              )}
            >
              Autevo
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-zinc-400">
            <Link
              href="#funcionalidades"
              className="hover:text-white transition-colors"
            >
              Funcionalidades
            </Link>
            <Link
              href="#vistoria"
              className="hover:text-white transition-colors"
            >
              Vistoria
            </Link>
            <Link
              href="#financeiro"
              className="hover:text-white transition-colors"
            >
              Financeiro
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/sign-in"
              className="hidden sm:block text-[13px] font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link href="/sign-up">
              <Button
                size="sm"
                className="bg-white text-black hover:bg-zinc-200 border-none font-bold text-xs h-9 px-5 rounded-full shadow-[0_8px_20px_-8px_rgba(255,255,255,0.3)] transition-all active:scale-95"
              >
                Evoluir Agora
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Sections */}
      <HeroSection />

      <ProblemAwareness />

      <FeaturesGrid />

      <FeatureVistoria />

      <FeatureFinance />

      <FeatureWhatsapp />

      <FAQSection />

      <FinalCTA />

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

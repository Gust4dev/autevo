import Link from "next/link";
import dynamic from "next/dynamic";
import { Lexend_Deca, Delius } from "next/font/google";
import { cn } from "@/lib/cn";
import { HeroSection } from "@/components/landing/HeroSection";
import { Navbar } from "@/components/landing/Navbar";

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
const HowItWorks = dynamic(
  () =>
    import("@/components/landing/HowItWorks").then((m) => ({
      default: m.HowItWorks,
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
const MetricsSection = dynamic(
  () =>
    import("@/components/landing/MetricsSection").then((m) => ({
      default: m.MetricsSection,
    })),
  { ssr: true },
);
const Testimonials = dynamic(
  () =>
    import("@/components/landing/Testimonials").then((m) => ({
      default: m.Testimonials,
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

export default function LandingPage() {
  return (
    <div
      className={cn(
        "min-h-screen bg-[#050505] text-white selection:bg-red-500/30 overflow-x-hidden",
        lexendDeca.className,
      )}
    >
      <ScrollToTop />

      {/* Navbar */}
      <Navbar deliusClass={delius.className} />

      {/* Hero */}
      <HeroSection />

      {/* Problem vs Solution */}
      <ProblemAwareness />

      {/* How It Works - 3 Steps */}
      <HowItWorks />

      {/* Features Grid - 8 features */}
      <FeaturesGrid />

      {/* Feature: Vistoria Mobile */}
      <FeatureVistoria />

      {/* Feature: Financeiro */}
      <FeatureFinance />

      {/* Feature: WhatsApp Automation */}
      <FeatureWhatsapp />

      {/* Social Proof Metrics */}
      <MetricsSection />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <FAQSection />

      {/* Pricing */}
      <FinalCTA />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 flex items-center justify-center">
                <img
                  src="/icon.svg"
                  alt="Autevo Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span
                className={cn(
                  "font-bold text-xl text-white",
                  delius.className,
                )}
              >
                Autevo
              </span>
            </div>
            <p className="text-zinc-500 leading-relaxed text-sm">
              A plataforma definitiva para oficinas e esteticas automotivas que
              querem crescer de verdade. Controle, gestao e lucro em um so
              lugar.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 text-sm text-zinc-500">
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1">
                Produto
              </h4>
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
              <Link
                href="#pricing"
                className="hover:text-white transition-colors"
              >
                Planos
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1">
                Empresa
              </h4>
              <Link
                href="/sign-up"
                className="hover:text-white transition-colors"
              >
                Comecar Agora
              </Link>
              <Link
                href="/sign-in"
                className="hover:text-white transition-colors"
              >
                Entrar
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1">
                Legal
              </h4>
              <Link href="#" className="hover:text-white transition-colors">
                Termos de Uso
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Privacidade
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-zinc-600 text-sm">
            &copy; 2025 Autevo. Todos os direitos reservados.
          </span>
          <span className="text-zinc-700 text-xs">
            Feito com dedicacao para oficinas que querem evoluir.
          </span>
        </div>
      </footer>
    </div>
  );
}

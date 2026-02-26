import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { HeroSection } from "@/components/landing/HeroSection";
import { Logo } from "@/components/landing/Logo";

const SectionSkeleton = ({ height = "400px" }: { height?: string }) => (
  <div
    style={{ height }}
    className="w-full bg-[#050505] animate-pulse flex items-center justify-center"
  >
    <div className="w-24 h-2 bg-white/5 rounded-full" />
  </div>
);

// Below-fold components - lazy loaded for better initial bundle size
const ProblemAwareness = dynamic(
  () =>
    import("@/components/landing/ProblemAwareness").then((m) => ({
      default: m.ProblemAwareness,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="600px" /> },
);
const FeaturesGrid = dynamic(
  () =>
    import("@/components/landing/FeaturesGrid").then((m) => ({
      default: m.FeaturesGrid,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="800px" /> },
);
const FeatureVistoria = dynamic(
  () =>
    import("@/components/landing/FeatureVistoria").then((m) => ({
      default: m.FeatureVistoria,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="700px" /> },
);
const FeatureFinance = dynamic(
  () =>
    import("@/components/landing/FeatureFinance").then((m) => ({
      default: m.FeatureFinance,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="600px" /> },
);
const FeatureWhatsapp = dynamic(
  () =>
    import("@/components/landing/FeatureWhatsapp").then((m) => ({
      default: m.FeatureWhatsapp,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="800px" /> },
);
const FAQSection = dynamic(
  () =>
    import("@/components/landing/FAQSection").then((m) => ({
      default: m.FAQSection,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="500px" /> },
);
const PricingSection = dynamic(
  () =>
    import("@/components/landing/PricingSection").then((m) => ({
      default: m.PricingSection,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="900px" /> },
);
const FeatureComparison = dynamic(
  () =>
    import("@/components/landing/FeatureComparison").then((m) => ({
      default: m.FeatureComparison,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="700px" /> },
);
const SystemPreviewSection = dynamic(
  () =>
    import("@/components/landing/SystemPreviewSection").then((m) => ({
      default: m.SystemPreviewSection,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="800px" /> },
);
const RetentionSection = dynamic(
  () =>
    import("@/components/landing/RetentionSection").then((m) => ({
      default: m.RetentionSection,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="600px" /> },
);
const DocumentExportSection = dynamic(
  () =>
    import("@/components/landing/DocumentExportSection").then((m) => ({
      default: m.DocumentExportSection,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="700px" /> },
);
const FinalCTA = dynamic(
  () =>
    import("@/components/landing/FinalCTA").then((m) => ({
      default: m.FinalCTA,
    })),
  { ssr: true, loading: () => <SectionSkeleton height="400px" /> },
);
const ScrollToTop = dynamic(
  () =>
    import("@/components/landing/ScrollToTop").then((m) => ({
      default: m.ScrollToTop,
    })),
  { ssr: true },
);

// Fonts are now handled globally in layout.tsx using CSS variables

export default function LandingPage() {
  return (
    <div
      className={cn(
        "min-h-screen bg-[#050505] text-white selection:bg-red-500/30 overflow-x-hidden font-sans",
      )}
    >
      <ScrollToTop />
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl transition-colors duration-500 transform-gpu">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="#hero" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 bg-white/5 border border-white/10 group-hover:border-white/20">
              <Logo className="w-6 h-6 p-1 text-white" />
            </div>
            <span
              className={cn(
                "font-bold text-xl tracking-tight text-white font-delius",
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
              href="#pricing"
              className="hover:text-white transition-colors"
            >
              Preços
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
                className="bg-red-600 text-white hover:bg-red-700 border-none font-bold text-xs h-9 px-5 rounded-full shadow-[0_8px_20px_-8px_rgba(220,38,38,0.5)] transition-all active:scale-95"
              >
                Começar Teste Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Sections */}
      <HeroSection />

      <ProblemAwareness />

      <FeatureComparison />

      <FeaturesGrid />

      <FeatureVistoria />

      <FeatureFinance />

      <FeatureWhatsapp />

      <PricingSection />

      <FAQSection />

      <FinalCTA />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center">
                <Logo className="text-white" />
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
              <Link
                href="/terms"
                className="hover:text-red-500 transition-colors"
              >
                Termos de Uso
              </Link>
              <Link
                href="/privacy"
                className="hover:text-red-500 transition-colors"
              >
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

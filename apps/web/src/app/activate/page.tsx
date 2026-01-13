"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { Lexend_Deca } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";
import {
  Copy,
  Check,
  MessageCircle,
  Loader2,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Car,
  Wallet,
  Bell,
  Smartphone,
  Shield,
  Clock,
  Zap,
  TrendingUp,
  Star,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const PIX_KEY = "3d8b2e72-72be-4d71-bfbd-0eeaea20a4e8";
const WHATSAPP_NUMBER = "5561998031185";
const TRIAL_PRICE = 97;
const TRIAL_DAYS = 60;

type TenantStatus =
  | "PENDING_ACTIVATION"
  | "TRIAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELED";

const FEATURES = [
  {
    icon: FileText,
    title: "Ordens de Serviço Ilimitadas",
    description: "Crie quantas OS precisar, sem limites",
  },
  {
    icon: Users,
    title: "Equipe Ilimitada",
    description: "Adicione todos os seus funcionários",
  },
  {
    icon: Car,
    title: "Gestão de Veículos",
    description: "Histórico completo de cada veículo",
  },
  {
    icon: Calendar,
    title: "Agendamentos",
    description: "Organize sua agenda de serviços",
  },
  {
    icon: Wallet,
    title: "Controle Financeiro",
    description: "Pagamentos, comissões e relatórios",
  },
  {
    icon: BarChart3,
    title: "Dashboard Completo",
    description: "Métricas e indicadores em tempo real",
  },
  {
    icon: Smartphone,
    title: "Rastreamento via WhatsApp",
    description: "Cliente acompanha o serviço pelo celular",
  },
  {
    icon: Bell,
    title: "Notificações Automáticas",
    description: "Avise clientes sobre status do serviço",
  },
];

const BENEFITS = [
  { icon: Clock, text: "Economize 2+ horas por dia" },
  { icon: TrendingUp, text: "Aumente seu faturamento" },
  { icon: Shield, text: "Nunca mais perca dados" },
  { icon: Zap, text: "Setup em menos de 5 minutos" },
];

export default function ActivatePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const tenantStatus = user?.publicMetadata?.tenantStatus as
    | TenantStatus
    | undefined;

  useEffect(() => {
    if (!isLoaded) return;

    if (tenantStatus === "TRIAL" || tenantStatus === "ACTIVE") {
      router.replace("/setup");
      return;
    }

    if (tenantStatus === "SUSPENDED") {
      router.replace("/suspended");
      return;
    }

    setIsCheckingStatus(false);
  }, [isLoaded, tenantStatus, router]);

  const handleVerifyPayment = async () => {
    setIsVerifying(true);
    try {
      // Reload the user data from Clerk to get updated metadata
      await user?.reload();

      // Small delay to allow state to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check the new status
      const newStatus = user?.publicMetadata?.tenantStatus as
        | TenantStatus
        | undefined;

      if (newStatus === "TRIAL" || newStatus === "ACTIVE") {
        router.replace("/setup");
      } else if (newStatus === "SUSPENDED") {
        router.replace("/suspended");
      } else {
        // Still pending - will show message via UI update
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("Failed to verify payment:", err);
      setIsVerifying(false);
    }
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Olá! Acabei de criar minha conta no Autevo e fiz o Pix de R$ ${TRIAL_PRICE}. Meu email: ${
      user?.emailAddresses?.[0]?.emailAddress || "N/A"
    }`
  )}`;

  if (!isLoaded || isCheckingStatus) {
    return (
      <div
        className={cn(
          "min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center",
          lexendDeca.className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-[#0A0A0B] text-white",
        lexendDeca.className
      )}
    >
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 px-6 py-4 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="font-bold text-white text-lg">A</span>
            </div>
            <span className="font-bold text-xl">Autevo</span>
          </Link>
          <SignOutButton>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
            >
              Sair
            </Button>
          </SignOutButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">
              Falta pouco para transformar sua estética
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Bem-vindo, {user?.firstName || "Empresário"}!
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Sua conta foi criada. Ative agora e tenha acesso completo ao sistema
            que vai revolucionar sua gestão.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Features */}
          <div className="space-y-6">
            {/* What You Get */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" />O que você vai
                receber
              </h2>
              <div className="grid gap-4">
                {FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Benefits */}
            <div className="grid grid-cols-2 gap-3">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.text}
                  className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-white/10 rounded-xl"
                >
                  <benefit.icon className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span className="text-sm text-zinc-300">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Payment */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm">
              <div className="text-center mb-6">
                <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 rounded-full text-sm font-semibold mb-4 border border-amber-500/30">
                  🔥 Oferta de Lançamento
                </span>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-zinc-500 line-through text-2xl">
                    R$ 297
                  </span>
                  <span className="text-6xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                    R$ {TRIAL_PRICE}
                  </span>
                </div>
                <p className="text-zinc-400">
                  <span className="text-emerald-400 font-semibold">
                    {TRIAL_DAYS} dias
                  </span>{" "}
                  de acesso completo
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  "Acesso a TODAS as funcionalidades",
                  "Usuários e OS ilimitados",
                  "Suporte prioritário via WhatsApp",
                  "Sem multa de cancelamento",
                  "Dados 100% seguros na nuvem",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-zinc-200"
                  >
                    <div className="p-0.5 rounded-full bg-emerald-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment Section */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold mb-5 text-center">
                Escaneie o QR Code ou copie a chave Pix
              </h2>

              {/* QR Code */}
              <div className="flex justify-center mb-5">
                <div className="bg-white p-3 rounded-xl shadow-2xl shadow-indigo-500/10">
                  <Image
                    src="/qrcode/qr1.webp"
                    alt="QR Code Pix"
                    width={180}
                    height={180}
                    className="rounded-lg"
                  />
                </div>
              </div>

              {/* Pix Key */}
              <div className="mb-5">
                <div className="flex items-center gap-2 bg-zinc-800/80 rounded-xl p-3 border border-zinc-700">
                  <code className="flex-1 text-sm text-zinc-300 break-all font-mono">
                    {PIX_KEY}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPix}
                    className={cn(
                      "shrink-0 transition-all",
                      copied && "text-emerald-400"
                    )}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-center text-zinc-500 text-sm mt-2">
                  Valor:{" "}
                  <strong className="text-white">R$ {TRIAL_PRICE},00</strong>
                </p>
              </div>

              {/* Urgency */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-500/20 rounded-xl p-4 text-center mb-5">
                <p className="text-sm text-zinc-300">
                  ⚡ Liberação em até{" "}
                  <strong className="text-white">2 horas úteis</strong> após
                  confirmação
                </p>
              </div>

              {/* WhatsApp CTA */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold px-6 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                <MessageCircle className="h-5 w-5" />
                Já paguei! Liberar meu acesso
              </a>

              {/* Verify Payment Button */}
              <button
                onClick={handleVerifyPayment}
                disabled={isVerifying}
                className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium px-6 py-3 rounded-xl transition-all border border-zinc-700 mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isVerifying
                  ? "Verificando..."
                  : "Já fui liberado? Verificar meu acesso"}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 text-zinc-500 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Pagamento seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Dados protegidos</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Lock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

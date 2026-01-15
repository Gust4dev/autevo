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
import { trpc } from "@/lib/trpc/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const PIX_KEY = "3d8b2e72-72be-4d71-bfbd-0eeaea20a4e8";
const WHATSAPP_NUMBER = "5561998031185";
const FOUNDER_PRICE = 97;
const FOUNDER_RENEWAL = 140;
const REGULAR_PRICE = 190;
const TRIAL_DAYS = 60;
const TOTAL_SLOTS = 15;

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
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: founderStats, isLoading: isLoadingStats } =
    trpc.admin.getFoundingMemberStats.useQuery();
  const activateFreeTrial = trpc.settings.activateFreeTrial.useMutation({
    onSuccess: async () => {
      toast.success("Trial solicitado! Verificando ativação...");

      const checkStatusAndRedirect = async (attempts = 0) => {
        try {
          await user?.reload();
          const status = (user?.publicMetadata as any)?.tenantStatus;

          if (status === "TRIAL") {
            toast.success("Confirmado! Redirecionando para o Setup...");
            window.location.href = "/setup";
            return;
          }

          if (attempts > 15) {
            // 7.5 seconds
            toast.error(
              "A ativação está demorando. Por favor, recarregue a página manualmente."
            );
            return;
          }

          setTimeout(() => checkStatusAndRedirect(attempts + 1), 500);
        } catch (e) {
          console.error("Polling error", e);
        }
      };

      checkStatusAndRedirect();
    },
    onError: (err) => {
      console.error("Failed to activate trial:", err);
      toast.error(`Erro ao ativar trial: ${err.message}`);
    },
  });

  const remainingSlots = founderStats
    ? Math.max(0, TOTAL_SLOTS - founderStats.count)
    : 0;
  const progress = founderStats
    ? Math.min(100, (founderStats.count / TOTAL_SLOTS) * 100)
    : 0;

  const handleVerifyPayment = async () => {
    setIsVerifying(true);
    try {
      await user?.reload();
      await new Promise((resolve) => setTimeout(resolve, 500));

      const session = await user?.reload(); // Force reload to get metadata? No, reload() is void.
      // Need to rely on router refresh or checking user object
      const newStatus = user?.publicMetadata?.tenantStatus as
        | string
        | undefined;

      if (newStatus === "TRIAL" || newStatus === "ACTIVE") {
        router.replace("/setup");
      } else if (newStatus === "SUSPENDED") {
        router.replace("/suspended");
      } else {
        setIsVerifying(false);
      }
    } catch (err) {
      setIsVerifying(false);
    }
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Olá! Acabei de criar minha conta no Autevo e fiz o Pix de R$ ${FOUNDER_PRICE} para garantir minha vaga de Membro Fundador. Meu email: ${
      user?.emailAddresses?.[0]?.emailAddress || "N/A"
    }`
  )}`;

  if (!isLoaded || isLoadingStats) {
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

      <main className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Scarcity Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                MEMBROS FUNDADORES
              </span>
              <span className="text-sm font-bold text-white">
                {founderStats?.count || 0} / {TOTAL_SLOTS} vagas preenchidas
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2 text-center">
              Garanta o preço vitalício antes que as vagas acabem.
            </p>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Parabéns, {user?.firstName}!
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Você garantiu uma das vagas reservadas. Ative agora para travar seu
            desconto vitalício.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Features */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" />
                Vantagens de Membro Fundador
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-1">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      Preço Travado para Sempre
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Enquanto outros pagarão R$ {REGULAR_PRICE}, você pagará
                      apenas R$ {FOUNDER_RENEWAL} vitalício.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-1">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      Grupo VIP no WhatsApp
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Acesso direto ao time de desenvolvimento para sugerir
                      features.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-1">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      Selo Exclusivo
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Badge de "Membro Fundador" no seu painel.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

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

          {/* Right Column - Pricing & Payment */}
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1 rounded-bl-lg">
                OFERTA LIMITADA
              </div>
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-zinc-500 line-through text-2xl">
                    R$ {REGULAR_PRICE}
                  </span>
                  <span className="text-6xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                    R$ {FOUNDER_PRICE}
                  </span>
                </div>
                <p className="text-zinc-300 mb-4">
                  pelos primeiros{" "}
                  <span className="text-emerald-400 font-bold">
                    {TRIAL_DAYS} dias
                  </span>
                </p>
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 inline-block">
                  <p className="text-xs text-zinc-400">
                    Renovação futura garantida:{" "}
                    <span className="text-white font-bold">
                      R$ {FOUNDER_RENEWAL}/mês
                    </span>
                  </p>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-4 shadow-xl">
                <Image
                  src="/qrcode/qr1.webp"
                  alt="QR Code Pix"
                  width={160}
                  height={160}
                />
              </div>

              <div className="flex items-center gap-2 bg-zinc-800/80 rounded-xl p-3 border border-zinc-700 mb-6">
                <code className="flex-1 text-xs text-zinc-300 truncate font-mono">
                  {PIX_KEY}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPix}
                  className={cn(
                    "shrink-0 transition-all h-8 w-8 p-0",
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

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold px-6 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 mb-3"
              >
                <MessageCircle className="h-5 w-5" />
                Já paguei! Liberar meu acesso
              </a>

              <button
                onClick={handleVerifyPayment}
                disabled={isVerifying}
                className="w-full text-zinc-400 hover:text-white text-sm py-2 transition-colors flex items-center justify-center gap-2"
              >
                {isVerifying && <Loader2 className="h-3 w-3 animate-spin" />}
                Verificar liberação
              </button>
            </div>

            {/* FOMO / Free Trial Option */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => activateFreeTrial.mutate()}
                disabled={activateFreeTrial.isPending}
                className="text-zinc-500 hover:text-zinc-300 text-sm underline decoration-zinc-700 transition-all hover:decoration-zinc-500"
              >
                {activateFreeTrial.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Ativando...
                  </span>
                ) : (
                  "Prefiro testar por 14 dias primeiro (perco a vaga de Fundador)"
                )}
              </button>
              <p className="text-xs text-zinc-600 mt-2 max-w-xs mx-auto">
                Nota: Ao escolher o teste de 14 dias, você perde a garantia de
                preço fixo e o badge de fundador.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

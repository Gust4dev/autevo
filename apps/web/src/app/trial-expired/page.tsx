"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { Lexend_Deca } from "next/font/google";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/cn";
import {
  AlertTriangle,
  MessageCircle,
  Loader2,
  Check,
  Shield,
  Star,
  Lock,
  Users,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const PIX_KEY = "3d8b2e72-72be-4d71-bfbd-0eeaea20a4e8";
const WHATSAPP_NUMBER = "5561998031185";
const FOUNDER_PRICE = 97;
const REGULAR_PRICE = 190;

export default function TrialExpiredPage() {
  const { user, isLoaded } = useUser();
  const { data: tenant, isLoading } = trpc.settings.get.useQuery();
  const { data: founderStats } = trpc.admin.getFoundingMemberStats.useQuery();

  if (!isLoaded || isLoading) {
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

  const remainingSlots = founderStats
    ? Math.max(0, founderStats.limit - founderStats.count)
    : 0;
  const hasFounderSlots = remainingSlots > 0;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Olá! Meu trial expirou e quero regularizar. ${
      hasFounderSlots
        ? "Quero garantir minha vaga de Fundador por R$ 97."
        : "Quero assinar o plano mensal de R$ 190."
    } Meu email: ${user?.emailAddresses?.[0]?.emailAddress || "N/A"}`
  )}`;

  return (
    <div
      className={cn(
        "min-h-screen bg-[#0A0A0B] text-white selection:bg-indigo-500/30",
        lexendDeca.className
      )}
    >
      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-white">A</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Autevo</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400">
              <Lock className="h-3 w-3" />
              <span>Ambiente Seguro</span>
            </div>
            <SignOutButton>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-white/5"
              >
                Sair
              </Button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Status & Data */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Período de teste finalizado
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">
                Sua operação está <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                  pausada temporariamente
                </span>
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed max-w-lg">
                Seus dados estão salvos e seguros, mas você precisa regularizar
                sua assinatura para continuar acessando.
              </p>
            </div>

            {/* Data Summary */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="w-24 h-24 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-4 text-white">
                Seus dados salvos:
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Clientes</span>
                  </div>
                  <span className="text-2xl font-bold text-white">Safe</span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">Ordens</span>
                  </div>
                  <span className="text-2xl font-bold text-white">Safe</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                Tudo será liberado imediatamente após a confirmação.
              </p>
            </div>
          </motion.div>

          {/* Right Column: Offer & Payment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              {hasFounderSlots ? (
                <div className="text-center mb-8">
                  <span className="inline-block px-4 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold border border-amber-500/20 mb-4">
                    ÚLTIMA CHANCE: RESTAM {remainingSlots} VAGAS
                  </span>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Torne-se Membro Fundador
                  </h2>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-zinc-500 line-through text-lg">
                      R$ {REGULAR_PRICE}
                    </span>
                    <span className="text-4xl font-bold text-emerald-400">
                      R$ {FOUNDER_PRICE}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Pague R$ 97 agora (primeiros 60 dias) e garanta mensais
                    vitalícias de R$ 140.
                  </p>
                </div>
              ) : (
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Reative sua Assinatura
                  </h2>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-4xl font-bold text-white">
                      R$ {REGULAR_PRICE}
                    </span>
                    <span className="text-xl text-zinc-400">/mês</span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Acesso total liberado imediatamente.
                  </p>
                </div>
              )}

              {/* Payment Info */}
              <div className="bg-zinc-950/50 rounded-xl p-6 border border-zinc-800 mb-6 flex flex-col items-center">
                <div className="bg-white p-2 rounded-lg mb-4">
                  <Image
                    src="/qrcode/qr1.webp"
                    alt="QR Code Pix"
                    width={140}
                    height={140}
                    className="rounded"
                  />
                </div>
                <div className="w-full bg-zinc-800 rounded p-2 flex items-center justify-between gap-2 border border-zinc-700">
                  <code className="text-xs text-zinc-400 truncate flex-1">
                    {PIX_KEY}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-zinc-400"
                    onClick={() => navigator.clipboard.writeText(PIX_KEY)}
                  >
                    <div className="sr-only">Copiar</div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3 h-3"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Action Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg px-6 py-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20"
              >
                <MessageCircle className="h-6 w-6" />
                Já realizei o pagamento
              </a>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
                <Shield className="h-3 w-3" />
                <span>Liberação em até 20 minutos</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

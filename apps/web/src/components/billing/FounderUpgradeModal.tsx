"use client";

import { useState } from "react";
import {
  Crown,
  Check,
  Star,
  Users,
  MessageSquare,
  Sparkles,
  Rocket,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface FounderUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isUpgrading: boolean;
  remainingSlots: number;
}

export function FounderUpgradeModal({
  isOpen,
  onClose,
  onConfirm,
  isUpgrading,
  remainingSlots,
}: FounderUpgradeModalProps) {
  const benefits = [
    {
      icon: Star,
      title: "Preço Vitalício Travado",
      description:
        "Você pagará R$ 140/mês para sempre, independente do preço futuro do plano Pro/Premium.",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: MessageSquare,
      title: "Grupo VIP com a Equipe",
      description:
        "Acesso direto aos desenvolvedores e fundadores do Autevo para dar sua opinião.",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      icon: Rocket,
      title: "Influencie o Roadmap",
      description:
        "Sua opinião terá peso prioritário na escolha das próximas funcionalidades.",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none bg-zinc-950">
        {/* Banner Decorativo */}
        <div className="relative h-32 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-24 h-24 bg-white rounded-full -translate-x-12 -translate-y-12 blur-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-200 rounded-full translate-x-16 translate-y-16 blur-3xl" />
          </div>
          <Crown className="h-16 w-16 text-white/90 relative z-10 drop-shadow-2xl animate-pulse" />
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-white">
              Sua opinião vai construir o futuro do Autevo
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-400 text-base mt-2">
              Estamos buscando 15 empreendedores visionários para nos ajudar a
              criar o melhor sistema de estética automotiva do Brasil.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className={cn("p-2 rounded-lg shrink-0", benefit.bg)}>
                  <benefit.icon className={cn("h-5 w-5", benefit.color)} />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{benefit.title}</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
            <p className="text-amber-500 font-medium flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              Restam apenas {remainingSlots} vagas com este benefício
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={onConfirm}
              disabled={isUpgrading}
              className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Garantindo sua vaga...
                </>
              ) : (
                <>
                  Sim, quero ser Membro Fundador{" "}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isUpgrading}
              className="text-zinc-500 hover:text-white"
            >
              Agora não, prefiro continuar no plano padrão
            </Button>
          </div>

          <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
            <Sparkles className="h-3 w-3" />
            Vaga Vitalícia • Preço Protegido • Suporte VIP
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

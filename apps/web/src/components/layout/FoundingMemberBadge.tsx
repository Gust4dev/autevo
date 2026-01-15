"use client";

import { Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FoundingMemberBadge({ className }: { className?: string }) {
  // Hardcoded price for now, can be passed as prop
  const lockedPrice = 140;

  return (
    <div className={cn("px-4 py-2", className)}>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-500/20 p-3 hover:border-amber-500/40 transition-all cursor-help">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-150%] group-hover:animate-shimmer" />

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400 blur-sm opacity-20" />
                  <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Crown className="h-4 w-4 text-white" fill="currentColor" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    MEMBRO FUNDADOR
                    <Sparkles className="h-3 w-3" />
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Preço vitalício:{" "}
                    <span className="text-zinc-200 font-medium">
                      R$ {lockedPrice}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-zinc-900 border-zinc-800 text-zinc-300"
          >
            <p className="font-medium text-amber-400 mb-1">Status Exclusivo</p>
            <p className="text-xs max-w-[200px]">
              Você garantiu o preço de R$ {lockedPrice}/mês para sempre e
              prioridade no suporte.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

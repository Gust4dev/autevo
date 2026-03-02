"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface TutorialCardProps {
  title: string;
  description: string | ReactNode;
  icon?: ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  position?: "center" | "bottom" | "top";
  showPrev?: boolean;
  nextLabel?: string;
}

export function TutorialCard({
  title,
  description,
  icon,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  position = "center",
  showPrev = true,
  nextLabel = "Próximo",
}: TutorialCardProps) {
  const positionClasses = {
    center:
      "top-1/2 -translate-y-1/2 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-xl",
    bottom:
      "bottom-4 md:bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-xl",
    top: "top-20 md:top-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-xl",
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: position === "bottom" ? 20 : -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`fixed z-[10000] ${positionClasses[position]} pointer-events-auto mx-auto max-w-[400px] md:max-w-none`}
    >
      {/* Animated Glowing Border Wrapper */}
      <div className="relative p-[1px] rounded-3xl overflow-hidden shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]">
        {/* Animated Gradient Background */}
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-[-100%] z-0 bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#3B82F6_50%,#000000_100%)] opacity-50"
        />

        {/* Premium Glass Panel */}
        <div className="relative z-10 bg-zinc-950/80 rounded-3xl p-5 md:p-8 backdrop-blur-3xl border border-white/10 max-h-[75svh] flex flex-col overflow-hidden">
          {/* subtle noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
            }}
          ></div>

          {/* Internal scrollable container */}
          <div className="overflow-y-auto pr-2 custom-scrollbar">
            {/* Progress Indicator (Sleek Dots) */}
            <div className="flex gap-1.5 mb-6">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ease-out ${
                    i < currentStep
                      ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                      : "bg-white/10"
                  }`}
                  style={{ width: i < currentStep ? "24px" : "12px" }}
                />
              ))}
            </div>

            {/* Content Area */}
            <div className="space-y-6">
              {icon && (
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl shadow-inner">
                  {icon}
                </div>
              )}

              <div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
                  {title}
                </h3>
                <div className="text-zinc-400 text-sm md:text-base leading-relaxed font-light">
                  {description}
                </div>
              </div>

              {/* Actions (pushed outside the scrolling internal text area but inside the wrapper) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-6 shrink-0 mt-2">
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="order-2 sm:order-1 flex-1 bg-transparent hover:bg-red-500/10 text-red-400/80 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-xl h-12"
                >
                  Pular Tutorial
                </Button>
                {onNext && (
                  <Button
                    onClick={onNext}
                    className="order-1 sm:order-2 flex-[2] bg-white text-black hover:bg-zinc-200 rounded-xl h-12 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]"
                  >
                    {nextLabel}
                    {nextLabel !== "Entendi!" && nextLabel !== "Concluir!" && (
                      <ArrowRight className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    bottom: "bottom-8 left-1/2 -translate-x-1/2",
    top: "top-8 left-1/2 -translate-x-1/2",
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: position === "bottom" ? 20 : -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed z-[10000] ${positionClasses[position]} w-full max-w-lg px-4`}
    >
      <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 p-[2px] rounded-2xl shadow-2xl">
        <div className="bg-gray-900 rounded-2xl p-6 backdrop-blur-xl">
          {/* Close Button - Moved to prevent overlap */}
          <button
            onClick={onSkip}
            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
            aria-label="Pular tutorial"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Progress Bar */}
          <div className="mb-6 mt-2">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Progresso</span>
              <span>
                {currentStep}/{totalSteps}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(currentStep / totalSteps) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {icon && (
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
                {icon}
              </div>
            )}

            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
              <div className="text-gray-300 leading-relaxed">{description}</div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              {showPrev && onPrev && currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={onPrev}
                  className="flex-1 bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              )}
              {onNext && (
                <Button
                  onClick={onNext}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  {nextLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

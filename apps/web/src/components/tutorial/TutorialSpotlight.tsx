"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialSpotlightProps {
  targetId?: string;
  isActive: boolean;
}

export function TutorialSpotlight({
  targetId,
  isActive,
}: TutorialSpotlightProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetId || !isActive) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.getElementById(targetId);
      if (element) {
        const elementRect = element.getBoundingClientRect();
        setRect(elementRect);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [targetId, isActive]);

  if (!isActive || !rect) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{
          background: `radial-gradient(
            circle at ${rect.left + rect.width / 2}px ${
            rect.top + rect.height / 2
          }px,
            transparent ${Math.max(rect.width, rect.height) / 2 + 20}px,
            rgba(0, 0, 0, 0.85) ${Math.max(rect.width, rect.height) / 2 + 100}px
          )`,
        }}
      />
      <motion.div
        key="spotlight"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed z-[9999] pointer-events-none"
        style={{
          left: rect.left - 8,
          top: rect.top - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          border: "3px solid #3B82F6",
          borderRadius: "12px",
          boxShadow:
            "0 0 0 4px rgba(59, 130, 246, 0.2), 0 0 30px rgba(59, 130, 246, 0.4)",
        }}
      />
    </AnimatePresence>
  );
}

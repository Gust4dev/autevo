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
      {/* Darkened backdrop with radial gradient cutout */}
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
            transparent ${Math.max(rect.width, rect.height) / 2 + 10}px,
            rgba(9, 9, 11, 0.95) ${Math.max(rect.width, rect.height) / 2 + 80}px
          )`,
        }}
      />
      {/* Animated glowing focus ring */}
      <motion.div
        key="spotlight"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed z-[9999] pointer-events-none"
        style={{
          left: rect.left - 12,
          top: rect.top - 12,
          width: rect.width + 24,
          height: rect.height + 24,
          border: "2px solid rgba(255, 255, 255, 0.4)",
          borderRadius: "16px",
          boxShadow:
            "0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 40px rgba(255, 255, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05)",
        }}
      />
    </AnimatePresence>
  );
}

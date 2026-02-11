"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#vistoria", label: "Vistoria" },
  { href: "#financeiro", label: "Financeiro" },
  { href: "#pricing", label: "Planos" },
];

export function Navbar({ deliusClass }: { deliusClass: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        }
      },
      { threshold: 0.3, rootMargin: "-80px 0px -40% 0px" },
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 transform-gpu",
        scrolled
          ? "bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/10"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="#hero"
          className="flex items-center gap-2.5 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="h-9 w-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 bg-white/5 border border-white/10 group-hover:border-red-500/30">
            <img
              src="/icon.svg"
              alt="Autevo Logo"
              className="w-full h-full object-contain p-1.5"
              loading="eager"
            />
          </div>
          <span
            className={cn(
              "font-bold text-xl tracking-tight text-white",
              deliusClass,
            )}
          >
            Autevo
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-4 py-2 text-[13px] font-semibold rounded-full transition-all duration-200",
                activeSection === link.href
                  ? "text-white"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              {activeSection === link.href && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-white/10 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-[13px] font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <Link href="/sign-up">
            <Button
              size="sm"
              className="bg-white text-black hover:bg-zinc-200 border-none font-bold text-xs h-9 px-5 rounded-full shadow-[0_8px_20px_-8px_rgba(255,255,255,0.3)] transition-all active:scale-95 hover:shadow-[0_8px_25px_-8px_rgba(255,255,255,0.5)]"
            >
              Evoluir Agora
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-[#050505]/95 backdrop-blur-xl border-t border-white/5"
          >
            <div className="px-6 py-6 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                    activeSection === link.href
                      ? "text-white bg-white/10"
                      : "text-zinc-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-3 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-white text-black hover:bg-zinc-200 font-bold text-sm h-12 rounded-full">
                    Evoluir Agora
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

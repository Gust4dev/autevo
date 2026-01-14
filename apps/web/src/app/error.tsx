"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, MessageCircle } from "lucide-react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {}, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center p-6">
      {/* Error Icon */}
      <div className="relative mb-8">
        <div className="absolute -inset-4 bg-destructive/10 rounded-full blur-xl animate-pulse" />
        <div className="relative bg-destructive/10 p-6 rounded-full border border-destructive/20">
          <AlertTriangle className="h-16 w-16 text-destructive" />
        </div>
      </div>

      {/* Content */}
      <div className="text-center max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Ops! Algo deu errado
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Encontramos um problema inesperado. Nossa equipe foi notificada e está
          trabalhando para resolver.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border text-left">
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground/60 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar Novamente
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors border border-border"
        >
          <Home className="h-4 w-4" />
          Voltar ao Início
        </Link>
      </div>

      {/* Support Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Problema persiste?{" "}
          <a
            href="mailto:suporte@exemplo.com"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <MessageCircle className="h-3 w-3" />
            Fale com o suporte
          </a>
        </p>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

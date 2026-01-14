"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {}, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      {/* Error Icon */}
      <div className="relative mb-6">
        <div className="absolute -inset-3 bg-destructive/10 rounded-full blur-lg" />
        <div className="relative bg-destructive/10 p-4 rounded-full border border-destructive/20">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
      </div>

      {/* Content */}
      <div className="text-center max-w-md mx-auto space-y-3">
        <h1 className="text-xl font-bold tracking-tight">
          Erro ao carregar página
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Ocorreu um problema ao carregar esta seção. Tente novamente ou volte
          para a página anterior.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border text-left">
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button onClick={reset} variant="default" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}

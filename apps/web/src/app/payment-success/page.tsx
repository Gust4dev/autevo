"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lexend_Deca } from "next/font/google";
import { cn } from "@/lib/cn";
import { Loader2, CheckCircle, Crown, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [syncStatus, setSyncStatus] = useState<"syncing" | "success" | "error">(
    "syncing",
  );
  const [syncError, setSyncError] = useState<string | null>(null);

  const isFounder = searchParams.get("founder") === "true";
  const sessionId = searchParams.get("session_id");

  // Sync subscription on mount
  useEffect(() => {
    if (!sessionId) {
      setSyncStatus("success"); // No session to sync
      return;
    }

    const syncSubscription = async () => {
      try {
        const response = await fetch("/api/stripe/sync-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (response.ok) {
          setSyncStatus("success");
        } else {
          setSyncStatus("error");
          setSyncError(data.error || "Falha ao sincronizar assinatura");
        }
      } catch {
        setSyncStatus("error");
        setSyncError("Erro de conexão ao sincronizar");
      }
    };

    syncSubscription();
  }, [sessionId]);

  // Redirect when countdown reaches 0 and sync is complete
  useEffect(() => {
    if (countdown === 0 && syncStatus === "success") {
      router.push("/dashboard");
    }
  }, [countdown, syncStatus, router]);

  // Countdown timer - only start after sync completes
  useEffect(() => {
    if (syncStatus !== "success") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [syncStatus]);

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4",
        lexendDeca.className,
      )}
    >
      <Card className="max-w-lg w-full p-8 text-center space-y-6">
        {isFounder ? (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold">
              Parabéns, Membro Fundador! 🎉
            </h1>
            <p className="text-muted-foreground">
              Você agora faz parte do seleto grupo de Membros Fundadores do
              Autevo. Seu preço de{" "}
              <strong className="text-foreground">R$ 140/mês</strong> está
              travado para sempre!
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm text-amber-700">
                <strong>Incluído no seu plano:</strong> Acesso vitalício a todas
                as funcionalidades Premium quando forem lançadas, suporte
                prioritário e badge exclusivo de fundador.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Pagamento Confirmado! 🎉</h1>
            <p className="text-muted-foreground">
              Sua assinatura do plano Standard está ativa. Aproveite todas as
              funcionalidades do Autevo para gerenciar sua estética automotiva!
            </p>
          </>
        )}

        {syncStatus === "syncing" && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Ativando sua assinatura...</span>
          </div>
        )}

        {syncStatus === "error" && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{syncError}</span>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-primary hover:underline text-sm"
            >
              Ir para o painel mesmo assim
            </button>
          </div>
        )}

        {syncStatus === "success" && (
          <>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Redirecionando para o painel em {countdown} segundo
                {countdown !== 1 ? "s" : ""}...
              </span>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-primary hover:underline text-sm"
            >
              Ir para o painel agora
            </button>
          </>
        )}
      </Card>
    </div>
  );
}

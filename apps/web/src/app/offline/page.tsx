"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <WifiOff className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Você está offline</h1>

        <p className="text-zinc-400 mb-8">
          Não foi possível conectar ao servidor. Verifique sua conexão com a
          internet e tente novamente.
        </p>

        <Button onClick={handleRetry} className="gap-2" size="lg">
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </Button>

        <p className="text-xs text-zinc-600 mt-8">
          Algumas funcionalidades podem estar disponíveis offline após o
          primeiro acesso.
        </p>
      </div>
    </div>
  );
}

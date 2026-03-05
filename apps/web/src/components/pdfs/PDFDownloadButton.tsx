"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PDFDownloadButton({ orderId }: { orderId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao gerar PDF");
      }

      // 🛡️ SECURITY: Abrir URL assinada gerada no servidor. Impede manipulação no client.
      window.open(data.url, "_blank");
    } catch (error: any) {
      toast.error(`Erro ao baixar PDF: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4 font-bold text-red-600" />
      )}
      {isLoading ? "Gerando PDF..." : "Baixar PDF da OS (Seguro)"}
    </Button>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc/provider";
import { Button } from "@/components/ui";
import { FileSignature, Loader2 } from "lucide-react";

interface ContractDownloadButtonProps {
  orderId: string;
}

export function ContractDownloadButton({
  orderId,
}: ContractDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: order, isLoading: orderLoading } = trpc.order.getById.useQuery({
    id: orderId,
  });
  const { data: tenantSettings, isLoading: settingsLoading } =
    trpc.settings.get.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = () => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());
  };

  const handleGenerateContract = useCallback(async () => {
    if (!order || !tenantSettings?.contractTemplate) return;

    setIsGenerating(true);

    try {
      const servicesHtml = order.items
        .map(
          (item) =>
            `<li>${item.customName || item.service?.name || "Serviço"} (x${
              item.quantity
            }) - ${formatCurrency(Number(item.price) * item.quantity)}</li>`
        )
        .join("\n");

      const processedTemplate = tenantSettings.contractTemplate
        .replace(/\{\{cliente\}\}/g, order.vehicle.customer?.name || "N/A")
        .replace(/\{\{telefone\}\}/g, order.vehicle.customer?.phone || "N/A")
        .replace(
          /\{\{veiculo\}\}/g,
          `${order.vehicle.brand} ${order.vehicle.model}`
        )
        .replace(/\{\{placa\}\}/g, order.vehicle.plate)
        .replace(/\{\{cor\}\}/g, order.vehicle.color)
        .replace(/\{\{servicos\}\}/g, `<ul>${servicesHtml}</ul>`)
        .replace(/\{\{total\}\}/g, formatCurrency(Number(order.total)))
        .replace(/\{\{data\}\}/g, formatDate())
        .replace(/\{\{empresa\}\}/g, tenantSettings.name || "Empresa")
        .replace(/\{\{cnpj\}\}/g, tenantSettings.cnpj || "Não informado");

      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Contrato - ${order.code}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #333;
            }
            h1 { font-size: 24px; text-align: center; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 2px; }
            h2 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            p { margin-bottom: 10px; }
            ul { margin: 10px 0 10px 20px; }
            li { margin-bottom: 5px; }
            .signature { margin-top: 60px; display: flex; justify-content: space-between; }
            .signature-box { width: 45%; text-align: center; }
            .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
          </style>
        </head>
        <body>
          ${processedTemplate}
          <div class="signature">
            <div class="signature-box">
              <div class="signature-line">Contratante</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Contratada</div>
            </div>
          </div>
        </body>
        </html>
      `;

      const { default: html2pdf } = await import("html2pdf.js");

      const container = document.createElement("div");
      container.innerHTML = fullHtml;
      document.body.appendChild(container);

      await html2pdf()
        .set({
          margin: 10,
          filename: `contrato-${order.code}-${
            order.vehicle.customer?.name.split(" ")[0] || "cliente"
          }.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(container)
        .save();

      document.body.removeChild(container);
    } catch (error) {
      console.error("Error generating contract:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [order, tenantSettings]);

  if (orderLoading || settingsLoading) {
    return (
      <Button variant="outline" disabled size="sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando...
      </Button>
    );
  }

  if (!order || !tenantSettings?.contractTemplate) {
    return (
      <Button
        variant="outline"
        disabled
        size="sm"
        title="Configure o template de contrato nas configurações"
      >
        <FileSignature className="mr-2 h-4 w-4" />
        Sem Template
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateContract}
      disabled={isGenerating}
      className="border-blue-600 text-blue-600 hover:bg-blue-50"
    >
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileSignature className="mr-2 h-4 w-4" />
      )}
      {isGenerating ? "Gerando..." : "GERAR CONTRATO"}
    </Button>
  );
}

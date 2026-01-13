"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@/components/ui";
import { Printer, X } from "lucide-react";

interface ContractPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: string;
  orderData: {
    customerName: string;
    customerPhone: string;
    vehicleName: string;
    vehiclePlate: string;
    vehicleColor: string;
    services: Array<{ name: string; price: number; quantity: number }>;
    total: number;
    tenantName: string;
    tenantCnpj: string | null;
  };
}

export function ContractPreviewModal({
  open,
  onOpenChange,
  template,
  orderData,
}: ContractPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Generate services HTML
  const servicesHtml = orderData.services
    .map(
      (s) =>
        `<li>${s.name} (x${s.quantity}) - ${formatCurrency(
          s.price * s.quantity
        )}</li>`
    )
    .join("\n");

  // Replace variables in template
  const processedTemplate = template
    .replace(/\{\{cliente\}\}/g, orderData.customerName)
    .replace(/\{\{telefone\}\}/g, orderData.customerPhone)
    .replace(/\{\{veiculo\}\}/g, orderData.vehicleName)
    .replace(/\{\{placa\}\}/g, orderData.vehiclePlate)
    .replace(/\{\{cor\}\}/g, orderData.vehicleColor)
    .replace(/\{\{servicos\}\}/g, `<ul>${servicesHtml}</ul>`)
    .replace(/\{\{total\}\}/g, formatCurrency(orderData.total))
    .replace(/\{\{data\}\}/g, formatDate())
    .replace(/\{\{empresa\}\}/g, orderData.tenantName)
    .replace(/\{\{cnpj\}\}/g, orderData.tenantCnpj || "Não informado");

  // Full HTML document with basic styling
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Contrato</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          color: #333;
        }
        h1 {
          font-size: 24px;
          text-align: center;
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        h2 {
          font-size: 18px;
          margin-top: 20px;
          margin-bottom: 10px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        p {
          margin-bottom: 10px;
        }
        ul {
          margin: 10px 0 10px 20px;
        }
        li {
          margin-bottom: 5px;
        }
        .signature {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          width: 45%;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 5px;
        }
        @media print {
          body {
            padding: 20px;
          }
        }
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

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview do Contrato</DialogTitle>
          <DialogDescription>
            Revise o contrato antes de imprimir
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-lg border bg-white">
          <iframe
            ref={iframeRef}
            srcDoc={fullHtml}
            className="w-full h-full"
            title="Contract Preview"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Fechar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Contrato
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

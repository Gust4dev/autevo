"use client";

import { forwardRef, useRef } from "react";
import { useReactToPrint, UseReactToPrintOptions } from "react-to-print";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { cn } from "@/lib/cn";

interface OrderItem {
  id: string;
  customName?: string | null;
  customPrice?: number | null;
  notes?: string | null;
  service?: {
    name: string;
    price: number;
  } | null;
}

interface OrderData {
  id: string;
  code: string;
  status: string;
  total: number;
  createdAt: Date;
  scheduledAt?: Date | null;
  estimatedDelivery?: Date | null;
  observations?: string | null;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    color: string;
    year?: number | null;
    customer: {
      name: string;
      phone?: string | null;
      email?: string | null;
      cpfCnpj?: string | null;
    };
  };
  items: OrderItem[];
  assignedUser?: {
    name: string;
  } | null;
}

interface TenantInfo {
  name: string;
  phone?: string | null;
  address?: string | null;
  cnpj?: string | null;
}

interface OrderPrintProps {
  order: OrderData;
  tenant?: TenantInfo;
  onAfterPrint?: () => void;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  AGENDADO: "Agendado",
  EM_ANDAMENTO: "Em Andamento",
  AGUARDANDO_PAGAMENTO: "Aguardando Pagamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const PrintableContent = forwardRef<
  HTMLDivElement,
  { order: OrderData; tenant?: TenantInfo }
>(function PrintableContent({ order, tenant }, ref) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div
      ref={ref}
      className="bg-white text-black p-8 max-w-[210mm] mx-auto font-sans text-sm print:p-4"
      style={{
        fontFamily: "Arial, sans-serif",
        lineHeight: 1.4,
      }}
    >
      <header className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              {tenant?.name || "Estética Automotiva"}
            </h1>
            {tenant?.cnpj && (
              <p className="text-xs text-gray-600">CNPJ: {tenant.cnpj}</p>
            )}
            {tenant?.phone && (
              <p className="text-xs text-gray-600">Tel: {tenant.phone}</p>
            )}
            {tenant?.address && (
              <p className="text-xs text-gray-600">{tenant.address}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">OS #{order.code}</p>
            <p className="text-xs text-gray-600">
              Emissão: {formatDate(order.createdAt)}
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-gray-200 rounded text-xs font-semibold">
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-300 rounded p-4">
          <h2 className="font-bold text-xs uppercase text-gray-500 mb-2">
            Cliente
          </h2>
          <p className="font-semibold">{order.vehicle.customer.name}</p>
          {order.vehicle.customer.phone && (
            <p className="text-sm">{order.vehicle.customer.phone}</p>
          )}
          {order.vehicle.customer.email && (
            <p className="text-sm">{order.vehicle.customer.email}</p>
          )}
          {order.vehicle.customer.cpfCnpj && (
            <p className="text-sm">
              CPF/CNPJ: {order.vehicle.customer.cpfCnpj}
            </p>
          )}
        </div>
        <div className="border border-gray-300 rounded p-4">
          <h2 className="font-bold text-xs uppercase text-gray-500 mb-2">
            Veículo
          </h2>
          <p className="font-semibold">
            {order.vehicle.brand} {order.vehicle.model}
          </p>
          <p className="text-sm">
            Placa:{" "}
            <span className="font-mono font-bold">{order.vehicle.plate}</span>
          </p>
          <p className="text-sm">Cor: {order.vehicle.color}</p>
          {order.vehicle.year && (
            <p className="text-sm">Ano: {order.vehicle.year}</p>
          )}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-bold text-xs uppercase text-gray-500 mb-2">
          Serviços
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2 text-xs uppercase">Descrição</th>
              <th className="text-right py-2 text-xs uppercase w-24">Valor</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr
                key={item.id}
                className={cn(
                  "border-b border-gray-200",
                  index % 2 === 1 && "bg-gray-50"
                )}
              >
                <td className="py-2">
                  <span className="font-medium">
                    {item.customName || item.service?.name || "Serviço"}
                  </span>
                  {item.notes && (
                    <p className="text-xs text-gray-500">{item.notes}</p>
                  )}
                </td>
                <td className="text-right py-2 font-mono">
                  {formatCurrency(item.customPrice ?? item.service?.price ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black">
              <td className="py-3 font-bold text-base">TOTAL</td>
              <td className="text-right py-3 font-bold text-base font-mono">
                {formatCurrency(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {order.observations && (
        <section className="mb-6 border border-gray-300 rounded p-4 bg-gray-50">
          <h2 className="font-bold text-xs uppercase text-gray-500 mb-2">
            Observações
          </h2>
          <p className="text-sm whitespace-pre-wrap">{order.observations}</p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-6 mb-6">
        {order.scheduledAt && (
          <div>
            <p className="text-xs text-gray-500">Agendado para</p>
            <p className="font-semibold">{formatDate(order.scheduledAt)}</p>
          </div>
        )}
        {order.estimatedDelivery && (
          <div>
            <p className="text-xs text-gray-500">Previsão de Entrega</p>
            <p className="font-semibold">
              {formatDate(order.estimatedDelivery)}
            </p>
          </div>
        )}
        {order.assignedUser && (
          <div>
            <p className="text-xs text-gray-500">Responsável</p>
            <p className="font-semibold">{order.assignedUser.name}</p>
          </div>
        )}
      </section>

      <footer className="border-t-2 border-black pt-6 mt-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t border-black mt-16 pt-2">
              <p className="text-xs">Assinatura do Cliente</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-black mt-16 pt-2">
              <p className="text-xs">Assinatura do Responsável</p>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          Documento gerado em{" "}
          {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </footer>
    </div>
  );
});

export function OrderPrintButton({
  order,
  tenant,
  onAfterPrint,
}: OrderPrintProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `OS-${order.code}`,
    onAfterPrint,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => handlePrint()}>
        <Printer className="h-4 w-4 mr-2" />
        Imprimir OS
      </Button>
      <div className="hidden">
        <PrintableContent ref={contentRef} order={order} tenant={tenant} />
      </div>
    </>
  );
}

export { PrintableContent };

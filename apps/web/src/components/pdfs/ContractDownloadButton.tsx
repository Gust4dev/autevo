'use client';

import { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { trpc } from '@/lib/trpc/provider';
import { ContractPDF } from './ContractPDF';
import { Button } from '@/components/ui';
import { FileSignature, Loader2 } from 'lucide-react';

interface ContractDownloadButtonProps {
  orderId: string;
}

export function ContractDownloadButton({ orderId }: ContractDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false);
  
  // We use getById to get full details including sensitive customer data
  const { data: order, isLoading } = trpc.order.getById.useQuery({ id: orderId });
  const { data: tenantSettings } = trpc.settings.get.useQuery();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  if (isLoading || !order) {
    return (
      <Button variant="outline" disabled size="sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Preparando Contrato...
      </Button>
    );
  }

  // Map data to contract format
  const contractData = {
    customer: {
      name: order.vehicle.customer?.name || 'Cliente N/A',
      document: order.vehicle.customer?.document,
      phone: order.vehicle.customer?.phone,
      address: '', // Address not currently in customer schema, leaving empty for placeholder
      rg: '',      // RG not currently in customer schema
    },
    vehicle: {
      brand: order.vehicle.brand,
      model: order.vehicle.model,
      plate: order.vehicle.plate,
      color: order.vehicle.color,
    },
    order: {
      startedAt: order.startedAt,
      completedAt: order.completedAt,
      total: Number(order.total),
      items: order.items.map(i => ({
         name: i.customName || i.service?.name || 'Serviço',
         price: Number(i.price) * i.quantity
      }))
    },
    tenant: {
        name: tenantSettings?.name || 'FILMTECH LUXURY',
        document: tenantSettings?.cnpj || '59.881.586/0001-93',
        address: tenantSettings?.address || 'Rua S1, Quadra 139, Lote 21, Nº 100 – CEP 74230-220 – Goiânia/GO.',
        phone: tenantSettings?.phone || '(62) 98235-7986',
        email: tenantSettings?.email || 'filmtechluxury@gmail.com'
    }
  };

  return (
    <PDFDownloadLink
      document={<ContractPDF data={contractData} />}
      fileName={`contrato-${order.code}-${order.vehicle.customer?.name.split(' ')[0] || 'cliente'}.pdf`}
    >
      {({ blob, url, loading, error }) => (
        <Button variant="outline" size="sm" disabled={loading} className="border-blue-600 text-blue-600 hover:bg-blue-50">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
            {loading ? 'Gerando Contrato...' : 'GERAR CONTRATO'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

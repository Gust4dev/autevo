'use client';

import { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { trpc } from '@/lib/trpc/provider';
import { InspectionPDF } from './InspectionPDF';
import QRCode from 'qrcode';
import { Button } from '@/components/ui';
import { FileText, Loader2 } from 'lucide-react';

export function PDFDownloadButton({ orderId }: { orderId: string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  
  const { data: publicStatus, isLoading } = trpc.inspection.getPublicStatus.useQuery({ orderId });

  useEffect(() => {
    setIsClient(true);
    // Generate QR Code once we have client-side access
    if (typeof window !== 'undefined') {
        const url = `${window.location.origin}/tracking/${orderId}`;
        QRCode.toDataURL(url, { width: 300, margin: 2 }).then(setQrCodeUrl).catch(console.error);
    }
  }, [orderId]);

  if (!isClient) return null;

  if (isLoading || !publicStatus || !qrCodeUrl) {
    return (
      <Button variant="outline" disabled size="sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Preparando PDF...
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<InspectionPDF data={publicStatus} qrCodeUrl={qrCodeUrl} />}
      fileName={`vistoria-${publicStatus.vehicleName}-${publicStatus.status}.pdf`}
    >
      {({ blob, url, loading, error }) => (
        <Button variant="outline" size="sm" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4 font-bold text-red-600" />}
            {loading ? 'Gerando PDF...' : 'Baixar PDF Convite'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

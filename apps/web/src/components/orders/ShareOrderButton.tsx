'use client';

import { Button } from '@/components/ui';
import { Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShareOrderButtonProps {
  orderId: string;
  customerName: string;
  vehicleName: string;
}

export function ShareOrderButton({ orderId, customerName, vehicleName }: ShareOrderButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const trackingUrl = `${window.location.origin}/tracking/${orderId}`;
    const message = `Olá ${customerName}, acompanhe o status do seu ${vehicleName} em tempo real e veja as fotos do serviço aqui: ${trackingUrl}`;

    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }).catch(() => {
        toast.error('Erro ao copiar link');
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
      {copied ? 'Copiado!' : 'Enviar Link'}
    </Button>
  );
}

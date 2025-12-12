'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Badge,
} from '@/components/ui';
import { Loader2, Calendar, Clock, CreditCard, Banknote, Wallet, ArrowRightLeft } from 'lucide-react';

const paymentMethods = [
  { value: 'PIX', label: 'PIX', icon: Wallet },
  { value: 'CARTAO_CREDITO', label: 'Cartão Crédito', icon: CreditCard },
  { value: 'CARTAO_DEBITO', label: 'Cartão Débito', icon: CreditCard },
  { value: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
  { value: 'TRANSFERENCIA', label: 'Transferência', icon: ArrowRightLeft },
];

interface PaymentRecord {
  id: string;
  method: string;
  amount: number;
  paidAt: string | Date;
  receivedBy: string;
  notes?: string | null;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  totalAmount: number;
  paidAmount: number;
  payments?: PaymentRecord[];
  onSubmit: (data: { method: string; amount: number; paidAt?: Date; notes?: string }) => Promise<void>;
}

export function PaymentDialog({
  open,
  onOpenChange,
  orderId,
  totalAmount,
  paidAmount,
  payments = [],
  onSubmit,
}: PaymentDialogProps) {
  const [method, setMethod] = useState('PIX');
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const balance = totalAmount - paidAmount;

  // Pre-fill with balance when dialog opens
  useEffect(() => {
    if (open && balance > 0) {
      setAmount(balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setPaidAt(today);
    }
  }, [open, balance]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(date));
  };

  const handleAmountChange = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) {
      setAmount('');
      return;
    }
    const numValue = parseInt(numbers) / 100;
    setAmount(numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  };

  const parseAmount = (formatted: string): number => {
    return parseFloat(formatted.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const handleSubmit = async () => {
    const numAmount = parseAmount(amount);
    
    if (numAmount <= 0) {
      setError('Informe um valor válido');
      return;
    }

    if (numAmount > balance + 0.01) { // Small margin for floating point
      setError('Valor excede o saldo devedor');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit({
        method,
        amount: numAmount,
        paidAt: paidAt ? new Date(paidAt + 'T12:00:00') : undefined,
        notes: notes || undefined,
      });
      
      // Reset form
      setMethod('PIX');
      setAmount('');
      setPaidAt('');
      setNotes('');
      onOpenChange(false);
    } catch {
      setError('Erro ao registrar pagamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillBalance = () => {
    setAmount(balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  };

  const getMethodLabel = (method: string) => {
    return paymentMethods.find(pm => pm.value === method)?.label || method;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Registre um pagamento para esta ordem de serviço
          </DialogDescription>
        </DialogHeader>

        {/* Summary Card */}
        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="text-center border-x">
            <p className="text-xs text-muted-foreground">Pago</p>
            <p className="font-semibold text-green-600">{formatCurrency(paidAmount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Restante</p>
            <p className="font-semibold text-orange-600">{formatCurrency(balance)}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((pm) => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setMethod(pm.value)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                      method === pm.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount and Date Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Valor</Label>
                <button
                  type="button"
                  onClick={handleFillBalance}
                  className="text-xs text-primary hover:underline"
                >
                  Usar saldo
                </button>
              </div>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="R$ 0,00"
                error={error}
              />
            </div>

            {/* Date (Backdating) */}
            <div className="space-y-2">
              <Label htmlFor="paidAt" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data do Pagamento
              </Label>
              <Input
                id="paidAt"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Parcelado em 3x"
            />
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Histórico de Pagamentos
              </Label>
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-lg border p-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getMethodLabel(payment.method)}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatDate(payment.paidAt)}
                      </span>
                    </div>
                    <span className="font-medium text-green-600">
                      +{formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || balance <= 0}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : balance <= 0 ? (
              'Totalmente Pago'
            ) : (
              'Registrar Pagamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardCheck, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/provider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

const INSPECTION_TYPES = [
  { 
    value: 'entrada', 
    label: 'Entrada',
    description: 'Quando o veículo chega',
    emoji: '📥',
  },
  { 
    value: 'pos_limpeza', 
    label: 'Pós-Limpeza',
    description: 'Após limpeza profunda',
    emoji: '🧽',
  },
  { 
    value: 'final', 
    label: 'Final',
    description: 'Antes da entrega',
    emoji: '✅',
  },
] as const;

export default function NewInspectionPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch existing inspections to know which types are already used
  const { data: existingInspections, isLoading } = trpc.inspection.list.useQuery(
    { orderId },
    { enabled: !!orderId }
  );

  const createInspection = trpc.inspection.create.useMutation();

  const existingTypes = existingInspections?.map(i => i.type) || [];

  const handleCreate = async () => {
    if (!selectedType) {
      toast.error('Selecione um tipo de vistoria');
      return;
    }

    setIsCreating(true);
    try {
      const inspection = await createInspection.mutateAsync({
        orderId,
        type: selectedType as 'entrada' | 'pos_limpeza' | 'final',
      });
      
      toast.success('Vistoria criada!');
      router.push(`/dashboard/orders/${orderId}/inspection/${inspection.id}`);
    } catch (err: any) {
      console.error('Create error:', err);
      toast.error(err.message || 'Erro ao criar vistoria');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-semibold">Nova Vistoria 3D</h1>
          <p className="text-sm text-muted-foreground">Selecione o tipo</p>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground">
          Escolha qual tipo de vistoria deseja realizar:
        </p>

        <div className="space-y-3">
          {INSPECTION_TYPES.map((type) => {
            const isUsed = existingTypes.includes(type.value);
            const isSelected = selectedType === type.value;
            
            return (
              <button
                key={type.value}
                onClick={() => !isUsed && setSelectedType(type.value)}
                disabled={isUsed}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  isUsed
                    ? 'opacity-50 cursor-not-allowed bg-muted border-border'
                    : isSelected
                    ? 'border-primary bg-primary/10 scale-[1.02]'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{type.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{type.label}</span>
                      {isUsed && (
                        <span className="text-xs bg-muted-foreground/20 text-muted-foreground px-2 py-0.5 rounded-full">
                          Já realizada
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          onClick={handleCreate}
          disabled={!selectedType || isCreating}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ClipboardCheck className="h-5 w-5 mr-2" />
              Iniciar Vistoria
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

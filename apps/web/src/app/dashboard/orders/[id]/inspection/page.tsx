'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, Loader2, Check, Clock, AlertCircle } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@/components/ui';
import { trpc } from '@/lib/trpc/provider';
import { INSPECTION_TYPE_LABELS } from '@/lib/ChecklistDefinition';

interface PageProps {
  params: Promise<{ id: string }>;
}

type InspectionType = 'entrada' | 'intermediaria' | 'final';

const INSPECTION_TYPES: { type: InspectionType; required: boolean }[] = [
  { type: 'entrada', required: true },
  { type: 'intermediaria', required: false },
  { type: 'final', required: true },
];

export default function InspectionIndexPage({ params }: PageProps) {
  const { id: orderId } = use(params);
  const router = useRouter();

  const inspectionsQuery = trpc.inspection.list.useQuery({ orderId });
  const orderQuery = trpc.order.getById.useQuery({ id: orderId });

  if (inspectionsQuery.isLoading || orderQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const inspections = inspectionsQuery.data || [];
  const order = orderQuery.data;

  const getInspectionForType = (type: InspectionType) => {
    return inspections.find(i => i.type === type);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/orders/${orderId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Vistorias</h1>
            {order && (
              <p className="text-muted-foreground">
                OS {order.code} • {order.vehicle.plate}
              </p>
            )}
          </div>
        </div>

        {/* Warning about requirement */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Vistorias Obrigatórias
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                As vistorias de <strong>Entrada</strong> e <strong>Saída</strong> são obrigatórias.
                A OS só pode ser concluída após finalizar a vistoria de saída.
              </p>
            </div>
          </div>
        </div>

        {/* Inspection Types */}
        <div className="space-y-4">
          {INSPECTION_TYPES.map(({ type, required }) => {
            const inspection = getInspectionForType(type);
            const typeInfo = INSPECTION_TYPE_LABELS[type];
            const isCompleted = inspection?.status === 'concluida';
            const isInProgress = inspection?.status === 'em_andamento';
            const progress = inspection?.progress || 0;

            return (
              <Card 
                key={type}
                className={`
                  ${isCompleted ? 'border-green-300 dark:border-green-800' : ''}
                  ${isInProgress ? 'border-primary' : ''}
                `}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{typeInfo.emoji}</span>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {typeInfo.label}
                          {required && (
                            <Badge variant="outline" className="text-xs">
                              Obrigatória
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{typeInfo.description}</CardDescription>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    {isCompleted ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Concluída
                      </Badge>
                    ) : isInProgress ? (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {progress}%
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Pendente
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isInProgress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progresso</span>
                        <span>{inspection.completedItems} itens concluídos</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full"
                    variant={isCompleted ? 'outline' : 'default'}
                    asChild
                  >
                    <Link href={`/dashboard/orders/${orderId}/inspection/${type}`}>
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      {isCompleted ? 'Ver Vistoria' : isInProgress ? 'Continuar' : 'Iniciar'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

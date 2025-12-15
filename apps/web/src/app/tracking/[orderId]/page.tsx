'use client';

import { use, useState } from 'react';
import { trpc } from '@/lib/trpc/provider';
import { ContactActions } from '@/components/tracking/ContactActions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Separator,
  Button
} from '@/components/ui';
import { Loader2, CheckCircle2, Clock, Wrench, Sparkles, Check, ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

const statusSteps = [
  { status: 'AGENDADO', label: 'Agendado', icon: Clock },
  { status: 'EM_VISTORIA', label: 'Vistoria', icon: CheckCircle2 },
  { status: 'EM_EXECUCAO', label: 'Serviço', icon: Wrench },
  { status: 'AGUARDANDO_PAGAMENTO', label: 'Lavagem', icon: Sparkles },
  { status: 'CONCLUIDO', label: 'Pronto', icon: Check },
];

function getStepStatus(currentStatus: string, stepStatus: string) {
  const statusOrder = ['AGENDADO', 'EM_VISTORIA', 'EM_EXECUCAO', 'AGUARDANDO_PAGAMENTO', 'CONCLUIDO'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const stepIndex = statusOrder.indexOf(stepStatus);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
}

function StatusStepper({ currentStatus }: { currentStatus: string }) {
  return (
    <div className="relative flex justify-between">
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10" />
      
      {statusSteps.map((step) => {
        const state = getStepStatus(currentStatus, step.status);
        const Icon = step.icon;
        
        return (
          <div key={step.status} className="flex flex-col items-center gap-2 bg-background px-1">
            <div 
              className={`
                flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors
                ${state === 'completed' ? 'bg-primary border-primary text-primary-foreground' : ''}
                ${state === 'current' ? 'bg-background border-primary text-primary animate-pulse' : ''}
                ${state === 'upcoming' ? 'bg-background border-muted text-muted-foreground' : ''}
              `}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className={`text-[10px] md:text-xs font-medium ${state === 'upcoming' ? 'text-muted-foreground' : ''}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  intermediaria: 'Intermediária',
  final: 'Saída',
};

export default function TrackingPage({ params }: PageProps) {
  const { orderId } = use(params);
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.inspection.getPublicStatus.useQuery({ orderId });

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Carregando status do veículo...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-destructive mb-2">Ops! Algo deu errado.</h1>
        <p className="text-muted-foreground mb-4">
          Não conseguimos encontrar esta ordem de serviço. Verifique o link ou entre em contato.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const { customerName, vehicleName, status, inspections, services, total, tenantContact } = data;

  // Get photos from all inspections
  const allPhotos = inspections?.flatMap(insp => 
    insp.items.filter(item => item.photoUrl).map(item => ({
      ...item,
      inspectionType: insp.type,
    }))
  ) || [];

  return (
    <div className="min-h-screen bg-muted/10 pb-24">
      {/* Header */}
      <div className="bg-background border-b px-4 py-6 sticky top-0 z-40 shadow-sm/50 backdrop-blur-sm bg-background/80">
        <div className="container max-w-md mx-auto">
          <h1 className="text-xl font-bold leading-tight">
            Olá, <span className="text-primary">{customerName}</span>!
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu <span className="font-medium text-foreground">{vehicleName}</span>
          </p>
        </div>
      </div>

      <div className="container max-w-md mx-auto p-4 space-y-6">
        {/* Status Stepper */}
        <Card>
          <CardContent className="pt-6">
            <StatusStepper currentStatus={status} />
          </CardContent>
        </Card>

        {/* Inspections Photos */}
        {inspections && inspections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fotos das Vistorias</CardTitle>
              <CardDescription>
                Registro fotográfico do seu veículo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inspections.map((inspection) => {
                const isExpanded = expandedInspection === inspection.id;
                const photosInInspection = inspection.items.filter(item => item.photoUrl);
                
                if (photosInInspection.length === 0) return null;

                return (
                  <div key={inspection.id}>
                    <button
                      onClick={() => setExpandedInspection(isExpanded ? null : inspection.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="text-left">
                          <p className="font-medium">
                            Vistoria de {INSPECTION_TYPE_LABELS[inspection.type] || inspection.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(inspection.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {photosInInspection.length} foto{photosInInspection.length !== 1 ? 's' : ''}
                      </Badge>
                    </button>

                    {isExpanded && (
                      <div className="grid grid-cols-3 gap-2 mt-3 pl-8">
                        {photosInInspection.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setLightboxImage(item.photoUrl)}
                            className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                          >
                            <img
                              src={item.photoUrl!}
                              alt={item.label}
                              className="w-full h-full object-cover"
                            />
                            {item.isCritical && (
                              <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] px-1 rounded">
                                CRÍTICO
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {services.map((service, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{service.name}</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.total)}
                  </span>
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img 
            src={lightboxImage} 
            alt="Foto ampliada"
            className="max-w-full max-h-full object-contain"
          />
          <button 
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            onClick={() => setLightboxImage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Sticky Actions */}
      <ContactActions whatsapp={tenantContact.whatsapp || ''} phone={tenantContact.phone || ''} />
    </div>
  );
}

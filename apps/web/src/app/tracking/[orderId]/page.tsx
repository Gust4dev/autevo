'use client';

import { use, useState } from 'react';
import { trpc } from '@/lib/trpc/provider';
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
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Sparkles, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Phone,
  MessageCircle,
  AlertTriangle 
} from 'lucide-react';

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

function StatusStepper({ currentStatus, primaryColor }: { currentStatus: string, primaryColor: string }) {
  // Simple check for cancelled, although ideally we'd show a red state
  if (currentStatus === 'CANCELADO') {
     return (
        <div className="flex items-center justify-center p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
           <AlertTriangle className="mr-2 h-5 w-5" />
           <span className="font-semibold">Serviço Cancelado</span>
        </div>
     )
  }

  return (
    <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10" />
        <div className="flex justify-between">
        {statusSteps.map((step) => {
            const state = getStepStatus(currentStatus, step.status);
            const Icon = step.icon;
            
            let circleClass = "bg-background border-muted text-muted-foreground"; // upcoming
            
            if (state === 'completed') {
                circleClass = "bg-primary border-primary text-primary-foreground";
            } else if (state === 'current') {
                circleClass = "bg-background border-primary text-primary animate-pulse";
            }

            return (
            <div key={step.status} className="flex flex-col items-center gap-2 bg-background/50 backdrop-blur-sm px-1 z-10">
                <div 
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 ${circleClass}`}
                    style={state === 'completed' ? { backgroundColor: primaryColor, borderColor: primaryColor } : state === 'current' ? { borderColor: primaryColor, color: primaryColor } : {}}
                >
                <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[10px] md:text-xs font-medium text-center ${state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'}`}>
                {step.label}
                </span>
            </div>
            );
        })}
        </div>
    </div>
  );
}

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  entrada: 'Vistoria de Entrada',
  intermediaria: 'Vistoria Intermediária',
  final: 'Vistoria Final',
};

export default function TrackingPage({ params }: PageProps) {
  const { orderId } = use(params);
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Use the NEW order.getPublicStatus procedure
  const { data, isLoading, error } = trpc.order.getPublicStatus.useQuery({ orderId });

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-muted/5">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Localizando seu veículo...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center bg-muted/5">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold mb-2">Ops! Algo deu errado.</h1>
        <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
          Não conseguimos encontrar esta ordem de serviço. Verifique o link ou entre em contato com a oficina.
        </p>
        <Button onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const { customerName, vehicleName, status, inspections, services, total, tenantContact } = data;
  const primaryColor = tenantContact.primaryColor || '#000000';

  // Group inspections to prioritize Entry and Final
  const entryInspection = inspections.find(i => i.type === 'entrada');
  const finalInspection = inspections.find(i => i.type === 'final');
  // Other inspections if needed (for now focusing on the main 2)
  const otherInspections = inspections.filter(i => i.type !== 'entrada' && i.type !== 'final');

  const hasPhotos = inspections.some(i => i.items.some(item => item.photoUrl) || i.damages.some(d => d.photoUrl));

  const handleWhatsappClick = () => {
    if (!tenantContact.whatsapp) return;
    const message = `Olá, gostaria de falar sobre o serviço do veículo ${vehicleName} (OS #${data.id.slice(-6).toUpperCase()})`;
    window.open(`https://wa.me/${tenantContact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-muted/5 pb-24 font-sans">
      {/* Header with Tenant Branding */}
      <div className="bg-background border-b sticky top-0 z-40 shadow-sm/50 backdrop-blur-md bg-background/95">
        <div className="container max-w-md mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {tenantContact.logo ? (
                    <img src={tenantContact.logo} alt={tenantContact.name} className="h-10 w-10 object-contain rounded-md bg-muted/10 p-1" />
                ) : (
                    <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-md font-bold text-primary" style={{ color: primaryColor, backgroundColor: `${primaryColor}1A` }}>
                        {tenantContact.name.substring(0, 1)}
                    </div>
                )}
                <div className="leading-tight">
                    <h2 className="font-semibold text-sm">{tenantContact.name}</h2>
                    <p className="text-xs text-muted-foreground">Status do Serviço</p>
                </div>
            </div>
            
            <a 
                href={`tel:${tenantContact.phone}`}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            >
                <Phone className="h-4 w-4" />
            </a>
        </div>
      </div>

      <div className="container max-w-md mx-auto p-4 space-y-6">
        {/* Welcome & Vehicle Card */}
        <div className="text-center py-4">
            <h1 className="text-2xl font-bold tracking-tight mb-1">
                Olá, <span style={{ color: primaryColor }}>{customerName}</span>!
            </h1>
            <p className="text-muted-foreground">
                Aqui está o progresso do seu <span className="font-medium text-foreground">{vehicleName}</span>
            </p>
        </div>

        {/* Status Stepper */}
        <Card className="border-0 shadow-lg bg-background/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="pt-8 pb-6">
            <StatusStepper currentStatus={status} primaryColor={primaryColor} />
            <div className="mt-6 text-center">
                 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Status Atual</p>
                 <p className="text-lg font-bold mt-1" style={{ color: primaryColor }}>
                    {status === 'AGUARDANDO_PAGAMENTO' ? 'Aguardando Pagamento/Retirada' : 
                     status === 'EM_VISTORIA' ? 'Em Vistoria' : 
                     status === 'EM_EXECUCAO' ? 'Em Execução' : 
                     status === 'CONCLUIDO' ? 'Concluído' : status}
                 </p>
            </div>
          </CardContent>
        </Card>

        {/* Gallery / Inspections */}
        {hasPhotos && (
           <div className="space-y-4">
              <h3 className="font-semibold text-lg px-2 flex items-center gap-2">
                 <ImageIcon className="h-4 w-4 text-primary" style={{ color: primaryColor }} /> 
                 Galeria de Fotos
              </h3>
              
              {/* Entry Inspection (Problems) */}
              {entryInspection && (entryInspection.items.some(i => i.photoUrl) || entryInspection.damages.some(d => d.photoUrl)) && (
                   <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: primaryColor }}>
                      <CardHeader className="bg-muted/30 pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                             <span>Vistoria de Entrada</span>
                             <Badge variant="outline" className="bg-background">Chegada</Badge>
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 grid grid-cols-3 gap-2">
                          {entryInspection.damages.filter(d => d.photoUrl).map(d => (
                              <button key={d.id} onClick={() => setLightboxImage(d.photoUrl)} className="aspect-square relative rounded-md overflow-hidden group">
                                  <img src={d.photoUrl!} alt="Dano" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] truncate p-1">Avaria</div>
                              </button>
                          ))}
                          {entryInspection.items.filter(i => i.photoUrl).map(i => (
                              <button key={i.id} onClick={() => setLightboxImage(i.photoUrl)} className="aspect-square relative rounded-md overflow-hidden group">
                                  <img src={i.photoUrl!} alt={i.label} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] truncate p-1">{i.label}</div>
                              </button>
                          ))}
                      </CardContent>
                   </Card>
              )}

              {/* Final Inspection (Results) */}
              {finalInspection && (finalInspection.items.some(i => i.photoUrl)) && (
                   <Card className="overflow-hidden border-l-4 border-green-500 shadow-md">
                      <CardHeader className="bg-green-500/10 pb-3">
                          <CardTitle className="text-base flex items-center justify-between text-green-700 dark:text-green-400">
                             <span>Resultado Final</span>
                             <Sparkles className="h-4 w-4" />
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 grid grid-cols-2 gap-3">
                          {finalInspection.items.filter(i => i.photoUrl).map(i => (
                              <button key={i.id} onClick={() => setLightboxImage(i.photoUrl)} className="aspect-video relative rounded-md overflow-hidden group shadow-sm">
                                  <img src={i.photoUrl!} alt={i.label} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">PRONTO</div>
                              </button>
                          ))}
                      </CardContent>
                   </Card>
              )}
           </div>
        )}

        {/* Financial Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {services.map((service, index) => (
                <div key={index} className="flex justify-between text-sm items-center border-b border-dashed border-muted pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground">{service.name}</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.total)}
                  </span>
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Total Aprovado</span>
              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </div>
          </CardContent>
        </Card>
      
        {/* Actions Spacing */}
        <div className="h-12" />
      </div>

      {/* Floating Action Button */}
      {tenantContact.whatsapp && (
        <div className="fixed bottom-6 left-0 right-0 p-4 z-50 flex justify-center">
             <Button 
                size="lg" 
                className="w-full max-w-md shadow-xl text-white font-bold h-14 rounded-2xl animate-in slide-in-from-bottom-10 fade-in duration-500"
                style={{ backgroundColor: '#25D366' }} // WhatsApp Green always
                onClick={handleWhatsappClick}
             >
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 fill-current" />
                    <span>Falar no WhatsApp da Oficina</span>
                </div>
             </Button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-2 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <img 
            src={lightboxImage} 
            alt="Foto ampliada"
            className="max-w-full max-h-[85vh] object-contain rounded-sm"
          />
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightboxImage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// Icon helper
function ImageIcon({ className, style }: { className?: string, style?: any }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
    )
}

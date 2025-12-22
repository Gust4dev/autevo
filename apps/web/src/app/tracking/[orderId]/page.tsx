'use client';

import { use, useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/provider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Phone,
  MessageCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Car,
  Image as ImageIcon,
  ChevronRight,
  ShieldCheck,
  FileText,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

// Client-only date formatter component to prevent hydration mismatch
const FormattedDate = ({ date }: { date: string | Date | null }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted || !date) return <span className="opacity-0">...</span>;
    return (
        <span>{format(new Date(date), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
    );
};

// Status definitions with colors and icons
const statusConfig: Record<string, { label: string; icon: any; color: string; description: string }> = {
  AGENDADO: { 
    label: 'Agendado', 
    icon: Calendar, 
    color: '#3b82f6', // blue-500
    description: 'Sua visita está confirmada. Aguardamos sua chegada.' 
  },
  EM_VISTORIA: { 
    label: 'Em Vistoria', 
    icon: ShieldCheck, 
    color: '#8b5cf6', // violet-500
    description: 'Estamos analisando todos os detalhes do seu veículo.' 
  },
  EM_EXECUCAO: { 
    label: 'Em Execução', 
    icon: Wrench, 
    color: '#f59e0b', // amber-500
    description: 'Nossa equipe está trabalhando no seu carro agora.' 
  },
  AGUARDANDO_PAGAMENTO: { 
    label: 'Lavagem/Finalização', 
    icon: Sparkles, 
    color: '#06b6d4', // cyan-500
    description: 'Serviços concluídos! Dando aquele brilho final.' 
  },
  CONCLUIDO: { 
    label: 'Pronto para Retirada', 
    icon: CheckCircle2, 
    color: '#10b981', // emerald-500
    description: 'Tudo pronto! Seu veículo está aguardando você.' 
  },
  CANCELADO: { 
    label: 'Cancelado', 
    icon: AlertTriangle, 
    color: '#ef4444', // red-500
    description: 'Este serviço foi cancelado.' 
  }
};

const statusOrder = ['AGENDADO', 'EM_VISTORIA', 'EM_EXECUCAO', 'AGUARDANDO_PAGAMENTO', 'CONCLUIDO'];

export default function TrackingPage({ params }: PageProps) {
  const { orderId } = use(params);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Real-time polling every 5 seconds
  const { data, isLoading, error } = trpc.order.getPublicStatus.useQuery(
    { orderId },
    { refetchInterval: 5000 }
  );

  useEffect(() => setMounted(true), []);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    }
  }, [lightboxImage]);

  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-6 bg-gradient-to-b from-background to-muted/20">
        <div className="relative">
             <div className="h-16 w-16 rounded-full border-4 border-primary/20 animate-spin border-t-primary"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <Car className="h-6 w-6 text-primary animate-pulse" />
             </div>
        </div>
        <p className="text-muted-foreground animate-pulse font-medium tracking-wide">
            Carregando status do veículo...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center bg-muted/5">
        <div className="p-6 rounded-full bg-red-100 dark:bg-red-900/20 mb-6 animate-in zoom-in duration-300">
            <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-3 tracking-tight">Ops! Pedido não encontrado.</h1>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
          Não conseguimos localizar esta ordem de serviço. O link pode estar incorreto ou expirado.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full px-8">
          Tentar novamente
        </Button>
      </div>
    );
  }

  const { customerName, vehicleName, vehiclePlate, status, inspections, services, total, tenantContact } = data;
  const primaryColor = tenantContact.primaryColor || '#000000';
  
  // Derived state
  const currentStatusConfig = statusConfig[status] || statusConfig['AGENDADO'];
  const currentStepIndex = statusOrder.indexOf(status);
  const progressPercent = Math.max(5, ((currentStepIndex + 1) / statusOrder.length) * 100);

  const handleWhatsappClick = () => {
    if (!tenantContact.whatsapp) return;
    const message = `Olá, gostaria de falar sobre o serviço do veículo ${vehicleName} (${vehiclePlate || ''})`;
    window.open(`https://wa.me/${tenantContact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-muted/5 font-sans pb-32 animate-in fade-in duration-500">
      
      {/* Immersive Header */}
      <div className="relative overflow-hidden bg-background border-b border-border/50">
         {/* Background accent */}
         <div 
            className="absolute top-0 left-0 right-0 h-1" 
            style={{ 
                background: `linear-gradient(90deg, ${primaryColor}, ${tenantContact.secondaryColor || primaryColor})`
            }} 
         />
         
         <div className="container max-w-md mx-auto px-6 py-6 pb-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    {tenantContact.logo ? (
                        <img src={tenantContact.logo} alt={tenantContact.name} className="h-12 w-12 object-contain bg-white dark:bg-black/10 rounded-xl p-1 shadow-sm border border-border/50" />
                    ) : (
                        <div className="h-12 w-12 flex items-center justify-center rounded-xl font-bold text-lg shadow-sm" style={{ color: primaryColor, backgroundColor: `${primaryColor}15` }}>
                            {tenantContact.name.substring(0, 1)}
                        </div>
                    )}
                    <div>
                        <h2 className="font-bold text-base leading-tight tracking-tight">{tenantContact.name}</h2>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span>Oficina Verificada</span>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: `Acompanhamento - ${vehicleName}`,
                                text: `Acompanhe o status do serviço do ${vehicleName}`,
                                url: window.location.href,
                            }).catch(() => {});
                        }
                    }}>
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                </Button>
            </div>

            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">
                    Olá, <span style={{ color: primaryColor }}>{customerName}</span>
                </h1>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                    Acompanhando <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md text-xs">{vehiclePlate || vehicleName}</span>
                </p>
            </div>
         </div>
      </div>

      <div className="container max-w-md mx-auto px-4 -mt-6">
        {/* Status Card - Hero */}
        <Card className="border-0 shadow-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 relative bg-background/80 backdrop-blur-md">
            {/* Animated Status Bar */}
            <div className="absolute top-0 left-0 h-1 bg-muted w-full">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full"
                    style={{ backgroundColor: currentStatusConfig.color }}
                />
            </div>

            <CardContent className="pt-8 pb-8 px-6 text-center space-y-5">
                <div 
                    className="inline-flex items-center justify-center p-4 rounded-full shadow-lg ring-4 ring-background mb-2 transform transition-transform hover:scale-105 duration-300"
                    style={{ 
                        backgroundColor: currentStatusConfig.color, 
                        color: 'white',
                        boxShadow: `0 10px 25px -5px ${currentStatusConfig.color}66`
                    }}
                >
                    <currentStatusConfig.icon className="h-8 w-8" />
                </div>
                
                <div className="space-y-2">
                    <Badge variant="outline" className="px-3 py-1 text-sm border-0 bg-muted/50 backdrop-blur-sm">
                        Status Atual
                    </Badge>
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: currentStatusConfig.color }}>
                        {currentStatusConfig.label}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto">
                        {currentStatusConfig.description}
                    </p>
                </div>
            </CardContent>
        </Card>

        {/* Dynamic Inspections (Gallery) */}
        {inspections && inspections.length > 0 && (
            <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" style={{ color: primaryColor }} />
                        Galeria de Vistorias
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {inspections.filter(i => i.items.some(k => k.photoUrl) || i.damages.some(d => d.photoUrl)).length} disponíveis
                    </span>
                </div>

                <div className="space-y-4">
                    {inspections.map((inspection, i) => {
                        // Check if it has photos OR if it is finalized (for exit inspection we might want to show it even without photos if user insists, but typically gallery needs photos)
                        // User said: "o cliente consiga ver todas as imagens ... porem nao deve aparecer se nao for feita"
                        // User also said: "de saida nao aparece" (exit does not appear)
                        
                        const hasPhotos = inspection.items.some(k => k.photoUrl) || inspection.damages.some(d => d.photoUrl);
                        
                        // If inspection is 'final' (exit) and is 'concluida' (done), we might want to show it? 
                        // But if it has no photos, what do we show in a gallery?
                        // If user complains it doesn't appear, likely they EXPECT photos to be there.
                        
                        if (!hasPhotos) return null;

                        const isFinal = inspection.type === 'final';

                        return (
                            <motion.div 
                                key={inspection.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className={`overflow-hidden border-0 shadow-md ${isFinal ? 'ring-2 ring-green-500/20' : ''}`}>
                                    <div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {isFinal ? (
                                                <Sparkles className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <div className="h-2 w-2 rounded-full bg-primary" style={{ backgroundColor: primaryColor }} />
                                            )}
                                            <span className="font-medium text-sm capitalize">
                                                {inspection.type === 'entrada' ? 'Vistoria Inicial' : 
                                                 inspection.type === 'final' ? 'Resultado Final' : 
                                                 inspection.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            <FormattedDate date={inspection.createdAt} />
                                        </span>
                                    </div>
                                    
                                    <CardContent className="p-3">
                                        {!hasPhotos ? (
                                            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-muted/20 rounded-lg">
                                                <ImageIcon className="h-8 w-8 opacity-20 mb-2" />
                                                <p className="text-xs font-medium">Sem registros fotográficos</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-2">
                                                {/* Damages first */}
                                                {inspection.damages.filter(d => d.photoUrl).map((d) => (
                                                    <motion.button 
                                                        key={d.id} 
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setLightboxImage(d.photoUrl!)}
                                                        className="aspect-square relative rounded-lg overflow-hidden group bg-muted"
                                                    >
                                                        <img src={d.photoUrl!} alt="Dano" className="w-full h-full object-cover" loading="lazy" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                        <Badge variant="destructive" className="absolute top-1 right-1 text-[8px] h-4 px-1 rounded-sm">
                                                            Avaria
                                                        </Badge>
                                                    </motion.button>
                                                ))}

                                                {/* Items */}
                                                {inspection.items.filter(i => i.photoUrl).map((item) => (
                                                    <motion.button 
                                                        key={item.id}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setLightboxImage(item.photoUrl!)}
                                                        className="aspect-square relative rounded-lg overflow-hidden group bg-muted"
                                                    >
                                                        <img src={item.photoUrl!} alt={item.label} className="w-full h-full object-cover" loading="lazy" />
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <p className="text-[10px] text-white font-medium truncate">{item.label}</p>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Services & Values */}
        <div className="mt-8 space-y-4">
             <div className="px-2">
                 <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" style={{ color: primaryColor }} />
                    Resumo do Pedido
                 </h3>
             </div>
             
             <Card className="border-0 shadow-md overflow-hidden">
                <div className="p-1 bg-muted/50 border-b border-dashed" />
                <CardContent className="p-0">
                    <div className="divide-y divide-muted/50">
                        {services.map((service, index) => (
                            <div key={index} className="flex justify-between items-center p-4 hover:bg-muted/5 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                                    <span className="text-sm font-medium text-foreground/80">{service.name}</span>
                                </div>
                                <span className="text-sm font-semibold whitespace-nowrap ml-4">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.total)}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <div className="bg-muted/30 p-4 flex justify-between items-center border-t">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Final</span>
                    <span className="text-xl font-bold" style={{ color: primaryColor }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                    </span>
                </div>
             </Card>
        </div>

        {/* Store Info */}
        <div className="mt-10 mb-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-col-muted-foreground bg-background/50 px-4 py-2 rounded-full shadow-sm border border-border/50">
                <MapPin className="h-3 w-3" />
                <span className="font-medium text-muted-foreground">{tenantContact.name}</span>
            </div>
        </div>
      </div>

      {/* Floating Action Button (WhatsApp) */}
      <AnimatePresence>
        {tenantContact.whatsapp && (
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto"
            >
                <Button 
                    size="lg" 
                    className="w-full shadow-2xl text-white font-bold h-14 rounded-2xl relative overflow-hidden group"
                    style={{ backgroundColor: '#25D366' }} // WhatsApp color
                    onClick={handleWhatsappClick}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                    <div className="flex items-center gap-3">
                        <MessageCircle className="h-6 w-6 fill-current" />
                        <span className="text-base">Falar com a Oficina</span>
                    </div>
                </Button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
                onClick={() => setLightboxImage(null)}
            >
                <motion.img 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    src={lightboxImage} 
                    alt="Foto ampliada"
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                />
                <button 
                    className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full bg-white/10 backdrop-blur-md transition-colors"
                    onClick={() => setLightboxImage(null)}
                >
                    <span className="sr-only">Fechar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

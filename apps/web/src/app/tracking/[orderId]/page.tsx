"use client";

import { use, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
  Button,
} from "@/components/ui";
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
  Share2,
  PenTool,
} from "lucide-react";
import {
  SignaturePad,
  type SignatureMetadata,
} from "@/components/ui/signature-pad";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

// Client-only date formatter component to prevent hydration mismatch
const FormattedDate = ({ date }: { date: string | Date | null }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !date) return <span className="opacity-0">...</span>;
  return (
    <span>
      {format(new Date(date), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
    </span>
  );
};

// Status definitions with colors and icons
const statusConfig: Record<
  string,
  { label: string; icon: any; color: string; description: string }
> = {
  AGENDADO: {
    label: "Agendado",
    icon: Calendar,
    color: "#3b82f6", // blue-500
    description: "Sua visita está confirmada. Aguardamos sua chegada.",
  },
  EM_VISTORIA: {
    label: "Em Vistoria",
    icon: ShieldCheck,
    color: "#8b5cf6", // violet-500
    description: "Estamos analisando todos os detalhes do seu veículo.",
  },
  EM_EXECUCAO: {
    label: "Em Execução",
    icon: Wrench,
    color: "#f59e0b", // amber-500
    description: "Nossa equipe está trabalhando no seu carro agora.",
  },
  AGUARDANDO_PAGAMENTO: {
    label: "Lavagem/Finalização",
    icon: Sparkles,
    color: "#06b6d4", // cyan-500
    description: "Serviços concluídos! Dando aquele brilho final.",
  },
  CONCLUIDO: {
    label: "Pronto para Retirada",
    icon: CheckCircle2,
    color: "#10b981", // emerald-500
    description: "Tudo pronto! Seu veículo está aguardando você.",
  },
  CANCELADO: {
    label: "Cancelado",
    icon: AlertTriangle,
    color: "#ef4444", // red-500
    description: "Este serviço foi cancelado.",
  },
};

const statusOrder = [
  "AGENDADO",
  "EM_VISTORIA",
  "EM_EXECUCAO",
  "AGUARDANDO_PAGAMENTO",
  "CONCLUIDO",
];

export default function TrackingPage({ params }: PageProps) {
  const { orderId } = use(params);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signingInspectionId, setSigningInspectionId] = useState<string | null>(
    null,
  );
  const [viewSignatureDigits, setViewSignatureDigits] = useState("");
  const [signatureVerified, setSignatureVerified] = useState<
    Record<string, boolean>
  >({});

  const utils = trpc.useUtils();

  // Check localStorage for terms acceptance on mount
  useEffect(() => {
    const accepted = localStorage.getItem(`tracking-terms-${orderId}`);
    if (accepted === "true") setTermsAccepted(true);
  }, [orderId]);

  const handleAcceptTerms = () => {
    localStorage.setItem(`tracking-terms-${orderId}`, "true");
    setTermsAccepted(true);
  };

  // Real-time polling every 30 seconds
  const { data, isLoading, error, refetch, dataUpdatedAt } =
    trpc.order.getPublicStatus.useQuery(
      { orderId },
      { refetchInterval: 30000 },
    );

  const verifyPhoneMutation = trpc.order.verifyTrackingPhone.useMutation({
    onSuccess: (result) => {
      if (result.isValid) {
        setPhoneVerified(true);
        toast.success("Identidade verificada com sucesso!");
      } else {
        toast.error("Dígitos não conferem", {
          description:
            "Certifique-se de usar os 4 últimos dígitos do seu número cadastrado na oficina.",
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao verificar telefone");
    },
  });

  const saveSignature = trpc.inspection.savePublicSignature.useMutation({
    onSuccess: () => {
      toast.success("Assinatura registrada com sucesso!");
      setSigningInspectionId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar assinatura");
    },
  });

  const handleSignature = (
    inspectionId: string,
    signatureBase64: string,
    metadata?: SignatureMetadata,
  ) => {
    if (!phoneVerified || phoneDigits.length < 8) {
      toast.error("Verificação de telefone necessária");
      return;
    }
    saveSignature.mutate({
      orderId,
      inspectionId,
      signatureBase64,
      phoneExact: phoneDigits,
    });
  };

  useEffect(() => setMounted(true), []);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
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
        <h1 className="text-2xl font-bold mb-3 tracking-tight">
          Ops! Pedido não encontrado.
        </h1>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
          Não conseguimos localizar esta ordem de serviço. O link pode estar
          incorreto ou expirado.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="rounded-full px-8"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  const {
    customerName,
    vehicleName,
    vehiclePlate,
    status,
    inspections,
    services,
    total,
    tenantContact,
  } = data;
  const primaryColor = tenantContact.primaryColor || "#000000";

  // Derived state
  const currentStatusConfig = statusConfig[status] || statusConfig["AGENDADO"];
  const currentStepIndex = statusOrder.indexOf(status);
  const progressPercent = Math.max(
    5,
    ((currentStepIndex + 1) / statusOrder.length) * 100,
  );

  const handleWhatsappClick = () => {
    if (!tenantContact.whatsapp) return;
    const message = `Olá, gostaria de falar sobre o serviço do veículo ${vehicleName} (${
      vehiclePlate || ""
    })`;
    window.open(
      `https://wa.me/${tenantContact.whatsapp.replace(
        /\D/g,
        "",
      )}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  // Terms acceptance gate
  if (!termsAccepted) {
    return (
      <div className="min-h-screen bg-muted/5 font-sans flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Termos de Uso</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Para acessar o acompanhamento do seu veículo, leia e aceite nossos
              termos.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-8">
            <div className="max-h-64 overflow-y-auto rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed space-y-3">
              <p className="font-semibold text-foreground text-sm">
                TERMOS DE USO E CONDIÇÕES DE ACOMPANHAMENTO VEICULAR — PROTOCOLO
                DIGITAL
              </p>

              <p>
                <strong>PREÂMBULO</strong>
                <br />O presente instrumento regula as condições de acesso à
                interface de rastreio, vistoria e aprovação de orçamentos
                vinculada ao seu veículo. Ao acessar este ambiente digital, você
                (&quot;CLIENTE&quot;) manifesta concordância integral e
                irretratável com as diretrizes de segurança, privacidade e
                validade jurídica aqui estabelecidas.
              </p>

              <p>
                <strong>1. DA NATUREZA DO ACESSO E SEGURANÇA</strong>
              </p>
              <p>
                <strong>1.1.</strong> Este acesso é gerado exclusivamente para o
                CLIENTE, possuindo caráter individual, intransferível e
                temporário.
              </p>
              <p>
                <strong>1.2.</strong> A visualização dos dados está condicionada
                à validação de identidade (ex: últimos dígitos do telefone
                cadastrado). O fornecimento correto dos dados de validação
                presume a autoria do acesso.
              </p>
              <p>
                <strong>1.3.</strong> O compartilhamento deste link com
                terceiros é de responsabilidade exclusiva do CLIENTE. Qualquer
                aprovação ou assinatura realizada por terceiros de posse do link
                será considerada válida e vinculante.
              </p>

              <p>
                <strong>2. DA VISTORIA DIGITAL E PRODUÇÃO DE PROVAS</strong>
              </p>
              <p>
                <strong>2.1.</strong> O sistema de vistoria utiliza tecnologia
                de congelamento de dados. As imagens refletem o estado do
                veículo no momento da entrada ou saída.
              </p>
              <p>
                <strong>2.2.</strong> É obrigação do CLIENTE revisar
                minuciosamente todas as fotografias e apontamentos técnicos
                antes de prosseguir com qualquer assinatura.
              </p>
              <p>
                <strong>2.3.</strong> Ao assinar a vistoria de entrada, o
                CLIENTE declara concordância com o estado reportado, renunciando
                a reclamações posteriores sobre avarias não registradas.
              </p>

              <p>
                <strong>3. DA ASSINATURA ELETRÔNICA E VALIDADE JURÍDICA</strong>
              </p>
              <p>
                <strong>3.1.</strong> A assinatura digital realizada nesta
                plataforma possui plena eficácia probatória nos termos da Lei nº
                14.063/2020 e da MP nº 2.200-2/2001.
              </p>
              <p>
                <strong>3.2.</strong> O sistema captura automaticamente:
                Endereço IP, Geolocalização (GPS), User-Agent do dispositivo e
                Carimbo de tempo (Timestamp).
              </p>
              <p>
                <strong>3.3.</strong> O aceite eletrônico e/ou a assinatura
                constituem manifestação de vontade inequívoca para autorização
                de serviços e reconhecimento de dívida.
              </p>

              <p>
                <strong>4. DA APROVAÇÃO DE ORÇAMENTOS</strong>
              </p>
              <p>
                <strong>4.1.</strong> A aprovação digital autoriza a oficina a
                iniciar imediatamente os procedimentos técnicos.
              </p>
              <p>
                <strong>4.2.</strong> Uma vez aprovado digitalmente, o pedido
                torna-se irretratável. Cancelamentos após o início estarão
                sujeitos à cobrança de mão de obra e insumos já despendidos.
              </p>

              <p>
                <strong>5. PRIVACIDADE (LGPD)</strong>
              </p>
              <p>
                <strong>5.1.</strong> O CLIENTE consente com a coleta de imagens
                do veículo e tratamento de dados pessoais necessários para a
                prestação de serviço automotivo e segurança jurídica.
              </p>
              <p>
                <strong>5.2.</strong> Os metadados técnicos serão armazenados
                pelo prazo legal para fins de defesa de direitos em processos
                judiciais ou administrativos.
              </p>

              <p>
                <strong>6. DISPOSIÇÕES GERAIS</strong>
              </p>
              <p>
                <strong>6.1.</strong> A oficina reserva-se o direito de expirar
                o link após a entrega do veículo e conclusão do ciclo
                financeiro.
              </p>
              <p>
                <strong>6.2.</strong> Fica eleito o foro da comarca de prestação
                do serviço para dirimir quaisquer litígios.
              </p>

              <p className="italic border-t pt-2 mt-2">
                Ao clicar em &quot;Li e Aceito os Termos&quot;, você declara
                estar plenamente ciente das condições acima e autoriza o
                registro de seus metadados como prova de leitura e aceite.
              </p>
            </div>
            <Button
              onClick={handleAcceptTerms}
              className="w-full h-12 text-base font-bold shadow-lg"
            >
              <Check className="mr-2 h-5 w-5" />
              Li e Aceito os Termos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/5 font-sans pb-32 animate-in fade-in duration-500">
      {/* Immersive Header */}
      <div className="relative overflow-hidden bg-background border-b border-border/50">
        {/* Background accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${primaryColor}, ${
              tenantContact.secondaryColor || primaryColor
            })`,
          }}
        />

        <div className="container max-w-md mx-auto px-6 py-6 pb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              {tenantContact.logo ? (
                <img
                  src={tenantContact.logo}
                  alt={tenantContact.name}
                  className="h-12 w-12 object-contain bg-white dark:bg-black/10 rounded-xl p-1 shadow-sm border border-border/50"
                />
              ) : (
                <div
                  className="h-12 w-12 flex items-center justify-center rounded-xl font-bold text-lg shadow-sm"
                  style={{
                    color: primaryColor,
                    backgroundColor: `${primaryColor}15`,
                  }}
                >
                  {tenantContact.name.substring(0, 1)}
                </div>
              )}
              <div>
                <h2 className="font-bold text-base leading-tight tracking-tight">
                  {tenantContact.name}
                </h2>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Oficina Verificada</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({
                      title: `Acompanhamento - ${vehicleName}`,
                      text: `Acompanhe o status do serviço do ${vehicleName}`,
                      url: window.location.href,
                    })
                    .catch(() => {});
                }
              }}
            >
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Olá, <span style={{ color: primaryColor }}>{customerName}</span>
            </h1>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                Acompanhando{" "}
                <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md text-xs">
                  {vehiclePlate || vehicleName}
                </span>
              </p>
              {dataUpdatedAt && (
                <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Última atualização:{" "}
                  <FormattedDate date={new Date(dataUpdatedAt)} />
                </p>
              )}
            </div>
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
                color: "white",
                boxShadow: `0 10px 25px -5px ${currentStatusConfig.color}66`,
              }}
            >
              <currentStatusConfig.icon className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <Badge
                variant="outline"
                className="px-3 py-1 text-sm border-0 bg-muted/50 backdrop-blur-sm"
              >
                Status Atual
              </Badge>
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ color: currentStatusConfig.color }}
              >
                {currentStatusConfig.label}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto">
                {currentStatusConfig.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Phone Verification Gate for Gallery & Signature */}
        {inspections && inspections.length > 0 && !phoneVerified && (
          <div className="mt-8">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-2">
                <Phone
                  className="h-4 w-4 text-primary"
                  style={{ color: primaryColor }}
                />
                <span className="font-medium text-sm">
                  Verificação de Identidade
                </span>
              </div>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Para visualizar as fotos da vistoria e assinar, digite seu{" "}
                  <strong>número de celular</strong> cadastrado na oficina.
                </p>
                <input
                  type="tel"
                  maxLength={11}
                  value={phoneDigits}
                  onChange={(e) =>
                    setPhoneDigits(
                      e.target.value.replace(/\D/g, "").slice(0, 11),
                    )
                  }
                  placeholder="11999999999"
                  className="w-full px-4 py-3 text-center text-xl font-mono tracking-widest border-2 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  style={{
                    borderColor:
                      phoneDigits.length >= 8 ? primaryColor : undefined,
                  }}
                />
                <Button
                  onClick={() => {
                    if (phoneDigits.length >= 8) {
                      verifyPhoneMutation.mutate({
                        orderId,
                        phoneExact: phoneDigits,
                      });
                    }
                  }}
                  disabled={
                    phoneDigits.length < 8 || verifyPhoneMutation.isPending
                  }
                  className="w-full h-11 font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {verifyPhoneMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Phone className="mr-2 h-4 w-4" />
                  )}
                  {verifyPhoneMutation.isPending
                    ? "Verificando..."
                    : "Verificar e Ver Fotos"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dynamic Inspections (Gallery) — only after phone verified */}
        {phoneVerified && inspections && inspections.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ImageIcon
                  className="h-5 w-5 text-primary"
                  style={{ color: primaryColor }}
                />
                Galeria de Vistorias
              </h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {
                  inspections.filter(
                    (i) =>
                      i.items.some((k) => k.photoUrl) ||
                      i.damages.some((d) => d.photoUrl),
                  ).length
                }{" "}
                disponíveis
              </span>
            </div>

            <div className="space-y-4">
              {inspections.map((inspection, i) => {
                const hasPhotos =
                  inspection.items.some((k) => k.photoUrl) ||
                  inspection.damages.some((d) => d.photoUrl);

                if (!hasPhotos) return null;

                const isFinal = inspection.type === "final";

                return (
                  <motion.div
                    key={inspection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card
                      className={`overflow-hidden border-0 shadow-md ${
                        isFinal ? "ring-2 ring-green-500/20" : ""
                      }`}
                    >
                      <div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isFinal ? (
                            <Sparkles className="h-4 w-4 text-green-500" />
                          ) : (
                            <div
                              className="h-2 w-2 rounded-full bg-primary"
                              style={{ backgroundColor: primaryColor }}
                            />
                          )}
                          <span className="font-medium text-sm capitalize">
                            {inspection.type === "entrada"
                              ? "Vistoria Inicial"
                              : inspection.type === "final"
                                ? "Resultado Final"
                                : inspection.type.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          <FormattedDate date={inspection.createdAt} />
                        </span>
                      </div>

                      <CardContent className="p-3">
                        <div className="grid grid-cols-3 gap-2">
                          {inspection.damages
                            .filter((d) => d.photoUrl)
                            .map((d) => (
                              <motion.button
                                key={d.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setLightboxImage(d.photoUrl!)}
                                className="aspect-square relative rounded-lg overflow-hidden group bg-muted"
                              >
                                <img
                                  src={d.photoUrl!}
                                  alt="Dano"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                <Badge
                                  variant="destructive"
                                  className="absolute top-1 right-1 text-[8px] h-4 px-1 rounded-sm"
                                >
                                  Avaria
                                </Badge>
                              </motion.button>
                            ))}

                          {inspection.items
                            .filter((i) => i.photoUrl)
                            .map((item) => (
                              <motion.button
                                key={item.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setLightboxImage(item.photoUrl!)}
                                className="aspect-square relative rounded-lg overflow-hidden group bg-muted"
                              >
                                <img
                                  src={item.photoUrl!}
                                  alt={item.label}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-[10px] text-white font-medium truncate">
                                    {item.label}
                                  </p>
                                </div>
                              </motion.button>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Signature Section - Only after phone verified, no second phone prompt */}
        {phoneVerified && inspections && inspections.some((i) => i.canSign) && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <PenTool
                  className="h-5 w-5 text-primary"
                  style={{ color: primaryColor }}
                />
                Assinar Vistoria
              </h3>
            </div>

            {inspections
              .filter((i) => i.canSign)
              .map((inspection) => (
                <motion.div
                  key={`sign-${inspection.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className="border-0 shadow-lg overflow-hidden ring-2 ring-primary/20"
                    style={{ borderColor: primaryColor }}
                  >
                    <div
                      className="px-4 py-3 bg-primary/5 border-b flex items-center justify-between"
                      style={{ backgroundColor: `${primaryColor}10` }}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck
                          className="h-4 w-4"
                          style={{ color: primaryColor }}
                        />
                        <span className="font-medium text-sm">
                          {inspection.type === "entrada"
                            ? "Vistoria de Entrada"
                            : inspection.type === "final"
                              ? "Vistoria de Saída"
                              : "Vistoria"}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: primaryColor,
                          color: primaryColor,
                        }}
                      >
                        Aguardando Assinatura
                      </Badge>
                    </div>

                    <CardContent className="p-4 space-y-4">
                      <SignaturePad
                        onSave={(base64, metadata) =>
                          handleSignature(inspection.id, base64, metadata)
                        }
                        placeholder="Assine aqui com o dedo"
                        requireTerms
                        termsText="Declaro que revisei as fotos da vistoria, confirmo o estado do veículo e autorizo a execução dos serviços descritos nesta ordem."
                      />

                      {saveSignature.isPending && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Salvando assinatura...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        )}

        {/* Already signed inspections */}
        {inspections && inspections.some((i) => i.signatureUrl) && (
          <div className="mt-8 space-y-4">
            <div className="px-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Vistorias Assinadas
              </h3>
            </div>

            {inspections
              .filter((i) => i.signatureUrl)
              .map((inspection) => (
                <Card
                  key={`signed-${inspection.id}`}
                  className="border-0 shadow-md overflow-hidden bg-green-50/50 dark:bg-green-950/20"
                >
                  <div className="px-4 py-3 bg-green-100/50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm text-green-800 dark:text-green-200">
                        {inspection.type === "entrada"
                          ? "Vistoria de Entrada"
                          : inspection.type === "final"
                            ? "Vistoria de Saída"
                            : "Vistoria"}{" "}
                        - Assinada
                      </span>
                    </div>
                    <span className="text-[10px] text-green-700 dark:text-green-300">
                      <FormattedDate date={inspection.signedAt} />
                    </span>
                  </div>
                  <CardContent className="p-4">
                    {signatureVerified[inspection.id] ? (
                      <div className="flex justify-center">
                        <div className="bg-white rounded-lg p-3 border shadow-sm">
                          <img
                            src={inspection.signatureUrl!}
                            alt="Assinatura"
                            className="max-h-20 object-contain"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-center text-muted-foreground">
                          Para visualizar a assinatura, digite os{" "}
                          <strong>4 últimos dígitos</strong> do telefone
                          cadastrado.
                        </p>
                        <div className="flex gap-2 max-w-xs mx-auto">
                          <input
                            type="tel"
                            maxLength={4}
                            placeholder="0000"
                            className="flex-1 px-3 py-2 text-center text-lg font-mono tracking-widest border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={viewSignatureDigits}
                            onChange={(e) =>
                              setViewSignatureDigits(
                                e.target.value.replace(/\D/g, "").slice(0, 4),
                              )
                            }
                          />
                          <Button
                            size="sm"
                            disabled={viewSignatureDigits.length !== 4}
                            onClick={() => {
                              setSignatureVerified((prev) => ({
                                ...prev,
                                [inspection.id]: true,
                              }));
                              setViewSignatureDigits("");
                            }}
                          >
                            Ver
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Services & Values */}
        <div className="mt-8 space-y-4">
          <div className="px-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FileText
                className="h-5 w-5 text-primary"
                style={{ color: primaryColor }}
              />
              Resumo do Pedido
            </h3>
          </div>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="p-1 bg-muted/50 border-b border-dashed" />
            <CardContent className="p-0">
              <div className="divide-y divide-muted/50">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 hover:bg-muted/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                      <span className="text-sm font-medium text-foreground/80">
                        {service.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap ml-4">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(service.total)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="bg-muted/30 p-4 flex justify-between items-center border-t">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Final
              </span>
              <span
                className="text-xl font-bold"
                style={{ color: primaryColor }}
              >
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(total)}
              </span>
            </div>
          </Card>
        </div>

        {/* Store Info */}
        <div className="mt-10 mb-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-col-muted-foreground bg-background/50 px-4 py-2 rounded-full shadow-sm border border-border/50">
            <MapPin className="h-3 w-3" />
            <span className="font-medium text-muted-foreground">
              {tenantContact.name}
            </span>
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
              style={{ backgroundColor: "#25D366" }} // WhatsApp color
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
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

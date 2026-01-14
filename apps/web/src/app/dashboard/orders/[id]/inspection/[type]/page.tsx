"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Check,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  X,
  Video,
} from "lucide-react";
import { convertFileToWebPBase64 } from "@/lib/image-conversion";
import { SignaturePad } from "@/components/ui/signature-pad";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Progress,
  Textarea,
} from "@/components/ui";
import { trpc } from "@/lib/trpc/provider";
import { toast } from "sonner";
import {
  INSPECTION_CHECKLIST,
  INSPECTION_TYPE_LABELS,
  ITEM_STATUS_LABELS,
  DAMAGE_TYPE_OPTIONS,
  SEVERITY_OPTIONS,
  DAMAGE_TYPE_LABELS,
  SEVERITY_LABELS,
} from "@/lib/ChecklistDefinition";

interface PageProps {
  params: Promise<{ id: string; type: "entrada" | "intermediaria" | "final" }>;
}

export default function InspectionChecklistPage({ params }: PageProps) {
  const { id: orderId, type } = use(params);
  const router = useRouter();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "exterior",
    "rodas",
  ]);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Get or create inspection
  const inspectionQuery = trpc.inspection.getByOrderIdAndType.useQuery(
    { orderId, type },
    { enabled: !!orderId && !!type }
  );

  const createInspection = trpc.inspection.create.useMutation({
    onSuccess: () => {
      utils.inspection.getByOrderIdAndType.invalidate({ orderId, type });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateItem = trpc.inspection.updateItem.useMutation({
    onSuccess: () => {
      utils.inspection.getByOrderIdAndType.invalidate({ orderId, type });
      toast.success("Item atualizado!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateVideo = trpc.inspection.updateVideo.useMutation({
    onSuccess: () => {
      utils.inspection.getByOrderIdAndType.invalidate({ orderId, type });
      toast.success("Vídeo atualizado!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const completeInspection = trpc.inspection.complete.useMutation({
    onSuccess: () => {
      toast.success("Vistoria concluída com sucesso!");
      router.push(`/dashboard/orders/${orderId}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const saveSignature = trpc.inspection.saveSignature.useMutation({
    onSuccess: () => {
      toast.success("Assinatura salva!");
      utils.inspection.getByOrderIdAndType.invalidate({ orderId, type });
      // Proceed to complete inspection
      if (inspectionQuery.data?.id) {
        completeInspection.mutate({ inspectionId: inspectionQuery.data.id });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Auto-create inspection if it doesn't exist
  const handleStartInspection = () => {
    createInspection.mutate({ orderId, type });
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((k) => k !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    setUploadingItemId(itemId);

    try {
      // CONVERT TO WEBP BASE64 ON CLIENT SIDE
      const base64 = await convertFileToWebPBase64(file);

      updateItem.mutate({
        itemId,
        status: "pendente",
        photoUrl: base64,
      });
      setUploadingItemId(null);
      setUploadingItemId(null);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.error("Erro ao processar/enviar foto (formato inválido?)");
      }
      setUploadingItemId(null);
    }
  };

  const handleMarkWithDamage = (
    itemId: string,
    data: { notes: string; damageType: string; severity: string }
  ) => {
    updateItem.mutate({
      itemId,
      status: "com_avaria",
      notes: data.notes,
      damageType: data.damageType as
        | "arranhao"
        | "amassado"
        | "trinca"
        | "mancha"
        | "risco"
        | "pintura"
        | "outro",
      severity: data.severity as "leve" | "moderado" | "grave",
    });
  };

  const handleMarkOk = (itemId: string) => {
    updateItem.mutate({
      itemId,
      status: "ok",
    });
  };

  const handleComplete = (signatureBase64: string) => {
    if (!inspectionQuery.data?.id) return;
    saveSignature.mutate({
      inspectionId: inspectionQuery.data.id,
      signatureBase64,
    });
  };

  const typeInfo = INSPECTION_TYPE_LABELS[type] || {
    label: type,
    emoji: "📋",
    description: "",
  };

  // Loading state
  if (inspectionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No inspection yet - show start button
  if (!inspectionQuery.data) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link href={`/dashboard/orders/${orderId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para OS
            </Link>
          </Button>

          <Card className="text-center">
            <CardHeader>
              <div className="text-5xl mb-4">{typeInfo.emoji}</div>
              <CardTitle className="text-2xl">
                Vistoria de {typeInfo.label}
              </CardTitle>
              <CardDescription>{typeInfo.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {type !== "intermediaria" && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Vistoria Obrigatória
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Esta vistoria é obrigatória e deve ser 100% concluída
                        antes de{" "}
                        {type === "entrada"
                          ? "iniciar o serviço"
                          : "entregar o veículo"}
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                size="lg"
                onClick={handleStartInspection}
                disabled={createInspection.isPending}
              >
                {createInspection.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                Iniciar Vistoria
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const inspection = inspectionQuery.data;
  const items = inspection.items || [];

  // Group items by category
  const itemsByCategory = INSPECTION_CHECKLIST.reduce((acc, category) => {
    acc[category.key] = items.filter((item) => item.category === category.key);
    return acc;
  }, {} as Record<string, typeof items>);

  // Calculate progress
  const totalRequired = items.filter((i) => i.isRequired).length;
  const completedRequired = items.filter(
    (i) => i.isRequired && i.status !== "pendente"
  ).length;
  const progress =
    totalRequired > 0
      ? Math.round((completedRequired / totalRequired) * 100)
      : 0;
  const canComplete = completedRequired === totalRequired;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/orders/${orderId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <Badge
              variant={
                inspection.status === "concluida" ? "default" : "secondary"
              }
            >
              {inspection.status === "concluida" ? "Concluída" : "Em Andamento"}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{typeInfo.emoji}</span>
            <div>
              <h1 className="text-xl font-bold">
                Vistoria de {typeInfo.label}
              </h1>
              <p className="text-sm text-muted-foreground">
                {completedRequired} de {totalRequired} itens obrigatórios
              </p>
            </div>
          </div>

          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {progress}% concluído
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {INSPECTION_CHECKLIST.map((category) => {
          const categoryItems = itemsByCategory[category.key] || [];
          const isExpanded = expandedCategories.includes(category.key);
          const completedInCategory = categoryItems.filter(
            (i) => i.status !== "pendente"
          ).length;
          const totalInCategory = categoryItems.length;

          if (totalInCategory === 0 && category.key === "detalhes") {
            return null; // Hide empty details section for now
          }

          return (
            <Card
              key={category.key}
              className={
                category.critical ? "border-red-300 dark:border-red-800" : ""
              }
            >
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleCategory(category.key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {category.label}
                        {category.critical && (
                          <Badge variant="destructive" className="text-xs">
                            CRÍTICO
                          </Badge>
                        )}
                      </CardTitle>
                      {category.description && category.critical && (
                        <CardDescription className="text-red-600 dark:text-red-400 mt-1">
                          ⚠️ {category.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {completedInCategory}/{totalInCategory}
                  </Badge>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-3">
                  {categoryItems.map((item) => (
                    <ChecklistItemCard
                      key={item.id}
                      item={item}
                      isUploading={uploadingItemId === item.id}
                      onUpload={(file) => handleFileUpload(item.id, file)}
                      onMarkOk={() => handleMarkOk(item.id)}
                      onMarkDamage={(data) =>
                        handleMarkWithDamage(item.id, data)
                      }
                      disabled={inspection.status === "concluida"}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Video Section (360/General) */}
      <div className="max-w-2xl mx-auto p-4 pt-0">
        <Card className="border-dashed opacity-75">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Vídeo 360º da Vistoria
              <Badge
                variant="outline"
                className="ml-auto text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/30"
              >
                Em Desenvolvimento
              </Badge>
            </CardTitle>
            <CardDescription>
              Adicione um vídeo 360º ou geral mostrando o estado do veículo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  Recurso em Desenvolvimento
                </p>
                <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
                  Em breve você poderá gravar e anexar vídeos 360º diretamente
                  na vistoria.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signature Section */}
      {inspection.status !== "concluida" && canComplete && (
        <div className="max-w-2xl mx-auto p-4 pt-0">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Assinatura Digital</CardTitle>
              <CardDescription>
                O cliente deve assinar abaixo para confirmar os dados da
                vistoria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignaturePad
                onSave={handleComplete}
                placeholder="Assinatura do Cliente"
              />

              {saveSignature.isPending && (
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando assinatura e finalizando...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Show existing signature if completed */}
      {inspection.status === "concluida" && inspection.signatureUrl && (
        <div className="max-w-2xl mx-auto p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assinatura do Cliente</CardTitle>
              <CardDescription>
                Registrada em{" "}
                {new Date(inspection.signedAt || "").toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center bg-white rounded-lg p-4 m-4 border">
              <img
                src={inspection.signatureUrl}
                alt="Assinatura"
                className="max-h-32 object-contain"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Action Bar */}
      {inspection.status !== "concluida" && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-20">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col gap-2">
              {!canComplete && (
                <Button size="lg" className="w-full" disabled={true}>
                  Faltam {totalRequired - completedRequired} itens obrigatórios
                </Button>
              )}
              {canComplete && (
                <p className="text-center text-sm text-muted-foreground mb-2">
                  Assine acima para concluir a vistoria
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for checklist item
interface ChecklistItemCardProps {
  item: {
    id: string;
    label: string;
    status: string;
    photoUrl: string | null;
    notes: string | null;
    isRequired: boolean;
    isCritical: boolean;
    damageType?: string | null;
    severity?: string | null;
  };
  isUploading: boolean;
  disabled: boolean;
  onUpload: (file: File) => void;
  onMarkOk: () => void;
  onMarkDamage: (data: {
    notes: string;
    damageType: string;
    severity: string;
  }) => void;
}

function ChecklistItemCard({
  item,
  isUploading,
  disabled,
  onUpload,
  onMarkOk,
  onMarkDamage,
}: ChecklistItemCardProps) {
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const [damageType, setDamageType] = useState(item.damageType || "");
  const [severity, setSeverity] = useState(item.severity || "");

  const statusInfo = ITEM_STATUS_LABELS[item.status] || {
    label: item.status,
    color: "gray",
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleConfirmDamage = () => {
    if (!damageType || !severity) return;
    onMarkDamage({ notes, damageType, severity });
    setShowDamageForm(false);
  };

  return (
    <div
      className={`
      rounded-lg border p-4 
      ${
        item.status === "ok"
          ? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
          : ""
      }
      ${
        item.status === "com_avaria"
          ? "border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
          : ""
      }
    `}
    >
      <div className="flex items-start gap-3">
        {/* Photo Preview / Upload Button */}
        <div className="flex-shrink-0">
          {item.photoUrl ? (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted group">
              <img
                src={item.photoUrl}
                alt={item.label}
                className="w-full h-full object-cover"
              />
              {/* Status indicator based on actual status, not just photo presence */}
              {item.status === "ok" && (
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-tl-lg p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              {item.status === "com_avaria" && (
                <div className="absolute bottom-0 right-0 bg-amber-500 rounded-tl-lg p-1">
                  <AlertTriangle className="h-3 w-3 text-white" />
                </div>
              )}
              {/* Allow changing photo if still pending */}
              {item.status === "pendente" && !disabled && (
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled || isUploading}
                  />
                  <Camera className="h-6 w-6 text-white" />
                </label>
              )}
            </div>
          ) : item.status === "ok" ? (
            <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          ) : item.status === "com_avaria" ? (
            <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          ) : (
            <label
              className={`
              flex items-center justify-center w-16 h-16 rounded-lg border-2 border-dashed 
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:border-primary hover:bg-muted/50"
              }
              border-muted-foreground/30
            `}
            >
              <input
                type="file"
                accept="image/*"
                // capture="environment" // Removido para permitir galeria também
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
              />
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
            </label>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm sm:text-base">{item.label}</p>
            </div>
            <Badge
              variant={
                item.status === "ok"
                  ? "default"
                  : item.status === "com_avaria"
                  ? "destructive"
                  : "outline"
              }
              className="flex-shrink-0 self-start sm:self-auto"
            >
              {statusInfo.label}
            </Badge>
          </div>

          {/* Damage info display */}
          {item.status === "com_avaria" &&
            (item.damageType || item.severity) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {item.damageType && (
                  <Badge
                    variant="outline"
                    className="text-amber-700 border-amber-300"
                  >
                    {DAMAGE_TYPE_LABELS[item.damageType] || item.damageType}
                  </Badge>
                )}
                {item.severity && (
                  <Badge
                    variant="outline"
                    className={`
                    ${
                      item.severity === "leve"
                        ? "text-yellow-700 border-yellow-300"
                        : ""
                    }
                    ${
                      item.severity === "moderado"
                        ? "text-orange-700 border-orange-300"
                        : ""
                    }
                    ${
                      item.severity === "grave"
                        ? "text-red-700 border-red-300"
                        : ""
                    }
                  `}
                  >
                    {SEVERITY_LABELS[item.severity]?.label || item.severity}
                  </Badge>
                )}
              </div>
            )}

          {/* Notes */}
          {item.notes && (
            <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
          )}

          {/* Actions for pending items */}
          {item.status === "pendente" && !disabled && (
            <div className="mt-3 space-y-3">
              {!showDamageForm ? (
                <div className="flex flex-wrap gap-2">
                  {/* Mark as OK without photo */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={onMarkOk}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    OK sem avaria
                  </Button>

                  {/* Mark with damage */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-600 hover:text-amber-700"
                    onClick={() => setShowDamageForm(true)}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Com avaria
                  </Button>
                </div>
              ) : (
                <div className="w-full space-y-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Registrar Avaria
                  </p>

                  {/* Damage Type Select */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Tipo de Avaria *
                    </label>
                    <select
                      className="w-full p-2 rounded-md border bg-background text-sm"
                      value={damageType}
                      onChange={(e) => setDamageType(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {DAMAGE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Severity Select */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Gravidade *
                    </label>
                    <select
                      className="w-full p-2 rounded-md border bg-background text-sm"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {SEVERITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Observações (opcional)
                    </label>
                    <Textarea
                      placeholder="Descreva detalhes adicionais..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleConfirmDamage}
                      disabled={!damageType || !severity}
                    >
                      Confirmar Avaria
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDamageForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

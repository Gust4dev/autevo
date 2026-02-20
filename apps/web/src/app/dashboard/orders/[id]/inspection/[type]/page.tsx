"use client";

import { use, useState, useCallback } from "react";
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
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { OfflineUploadBanner } from "@/components/inspection/OfflineUploadBanner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  const { data: settings } = trpc.settings.get.useQuery();

  const inspectionRequired = (settings as any)?.inspectionRequired || "NONE";
  const isThisTypeRequired =
    (type === "entrada" &&
      (inspectionRequired === "ENTRY" || inspectionRequired === "BOTH")) ||
    (type === "final" &&
      (inspectionRequired === "EXIT" || inspectionRequired === "BOTH"));

  const inspectionQuery = trpc.inspection.getByOrderIdAndType.useQuery(
    { orderId, type },
    { enabled: !!orderId && !!type },
  );

  const orderQuery = trpc.order.getById.useQuery(
    { id: orderId },
    { enabled: !!orderId, staleTime: 60000 },
  );
  const orderCode = orderQuery.data?.code;

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

  const addPhoto = trpc.inspection.addPhoto.useMutation({
    onSuccess: () => {
      utils.inspection.getByOrderIdAndType.invalidate({ orderId, type });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removePhoto = trpc.inspection.removePhoto.useMutation({
    onSuccess: () => {
      utils.inspection.getByOrderIdAndType.invalidate({ orderId, type });
      toast.success("Foto removida!");
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

  // Offline-resilient upload function — uses addPhoto to append to the list
  const uploadFn = useCallback(
    async (itemId: string, base64: string) => {
      await new Promise<void>((resolve, reject) => {
        addPhoto.mutate(
          { itemId, photoBase64: base64 },
          { onSuccess: () => resolve(), onError: (e) => reject(e) },
        );
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { state: queueState, handleUpload } = useOfflineQueue(uploadFn);

  // Auto-create inspection if it doesn't exist
  const handleStartInspection = () => {
    createInspection.mutate({ orderId, type });
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((k) => k !== categoryKey)
        : [...prev, categoryKey],
    );
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    setUploadingItemId(itemId);

    try {
      const base64 = await convertFileToWebPBase64(file, 0.7, orderCode);

      if (!base64 || !base64.startsWith("data:image/")) {
        throw new Error("Conversão retornou resultado inválido");
      }

      await handleUpload(itemId, orderId, base64);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao processar foto.";
      toast.error(errorMessage, {
        description: "Tente tirar a foto novamente.",
        duration: 5000,
      });
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleMarkWithDamage = (
    itemId: string,
    data: { notes: string; damageType: string; severity: string },
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
              {isThisTypeRequired ? (
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
              ) : (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Camera className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        Vistoria Opcional
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Esta vistoria não é obrigatória, mas é recomendada para
                        documentar o estado do veículo.
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
  const itemsByCategory = INSPECTION_CHECKLIST.reduce(
    (acc, category) => {
      acc[category.key] = items.filter(
        (item: any) => item.category === category.key,
      );
      return acc;
    },
    {} as Record<string, typeof items>,
  );

  // Calculate progress
  const totalRequired = items.filter((i: any) => i.isRequired).length;
  const completedRequired = items.filter(
    (i: any) => i.isRequired && i.status !== "pendente",
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
        <OfflineUploadBanner
          isOnline={queueState.isOnline}
          pendingCount={queueState.pendingCount}
          isSyncing={queueState.isSyncing}
        />
        {INSPECTION_CHECKLIST.map((category) => {
          const categoryItems = itemsByCategory[category.key] || [];
          const isExpanded = expandedCategories.includes(category.key);
          const completedInCategory = categoryItems.filter(
            (i: any) => i.status !== "pendente",
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
                  {categoryItems.map((item: any) => (
                    <ChecklistItemCard
                      key={item.id}
                      item={{ ...item, photos: item.photos ?? [] }}
                      isUploading={uploadingItemId === item.id}
                      onUpload={(file) => handleFileUpload(item.id, file)}
                      onRemovePhoto={(itemId, photoBase64) =>
                        removePhoto.mutate({ itemId, photoBase64 })
                      }
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
              {canComplete && !inspection.signatureUrl && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    ✓ Checklist completo! O cliente pode assinar pelo link de
                    acompanhamento.
                  </p>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() =>
                      completeInspection.mutate({ inspectionId: inspection.id })
                    }
                    disabled={completeInspection.isPending}
                  >
                    {completeInspection.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Concluir Vistoria
                  </Button>
                </div>
              )}
              {canComplete && inspection.signatureUrl && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() =>
                    completeInspection.mutate({ inspectionId: inspection.id })
                  }
                  disabled={completeInspection.isPending}
                >
                  {completeInspection.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Concluir Vistoria
                </Button>
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
    photos: string[];
    notes: string | null;
    isRequired: boolean;
    isCritical: boolean;
    damageType?: string | null;
    severity?: string | null;
  };
  isUploading: boolean;
  disabled: boolean;
  onUpload: (file: File) => void;
  onRemovePhoto: (itemId: string, photoBase64: string) => void;
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
  onRemovePhoto,
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
    e.target.value = "";
  };

  const handleConfirmDamage = () => {
    if (!damageType || !severity) return;
    onMarkDamage({ notes, damageType, severity });
    setShowDamageForm(false);
  };

  return (
    <div
      className={`rounded-lg border p-4 ${
        item.status === "ok"
          ? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
          : ""
      } ${
        item.status === "com_avaria"
          ? "border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
          : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Photo Strip — shows all photos + add button */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap max-w-[200px] sm:max-w-[250px]">
            {/* Existing photos wrapper */}
            {item.photos &&
              item.photos.length > 0 &&
              item.photos.map((photo, i) => (
                <div key={i} className="relative group flex-shrink-0">
                  <img
                    src={photo}
                    alt={`Foto ${i + 1}`}
                    className="w-16 h-16 rounded-md object-cover border"
                  />
                  {!disabled && (
                    <button
                      onClick={() => onRemovePhoto(item.id, photo)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remover foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

            {/* Always show Add Photo button */}
            {!disabled && (
              <div className="w-16 h-16 flex-shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  id={`photo-${item.id}`}
                  onChange={handleFileChange}
                  disabled={isUploading || disabled}
                />
                <label
                  htmlFor={`photo-${item.id}`}
                  className={`
                    flex flex-col items-center justify-center w-full h-full 
                    border-2 border-dashed rounded-md 
                    transition-colors cursor-pointer
                    bg-muted/50 hover:bg-muted
                    ${
                      isUploading || disabled
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }
                  `}
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Camera className="h-5 w-5 text-muted-foreground mb-1" />
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Foto
                      </span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-sm sm:text-base leading-tight">
                {item.label}
              </h4>
              {item.isRequired && (
                <span className="text-xs text-red-500 font-medium mt-1 inline-block">
                  *Obrigatório
                </span>
              )}
            </div>
            {/* Status Badge */}
            <Badge
              variant="outline"
              className={`
                whitespace-nowrap flex-shrink-0
                ${statusInfo.color === "green" ? "bg-green-100 text-green-800" : ""}
                ${statusInfo.color === "yellow" ? "bg-yellow-100 text-yellow-800" : ""}
                ${statusInfo.color === "red" ? "bg-red-100 text-red-800" : ""}
              `}
            >
              {statusInfo.label}
            </Badge>
          </div>

          {/* Badges para Avaria/Gravidade */}
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
                    ${item.severity === "leve" ? "text-yellow-700 border-yellow-300" : ""}
                    ${item.severity === "moderado" ? "text-orange-700 border-orange-300" : ""}
                    ${item.severity === "grave" ? "text-red-700 border-red-300" : ""}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={onMarkOk}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    OK sem avaria
                  </Button>

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
                <div className="bg-muted p-3 rounded-md space-y-3 border animate-in slide-in-from-top-2">
                  <h5 className="font-medium text-sm flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                    Registrar Avaria
                  </h5>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Tipo</label>
                      <Select value={damageType} onValueChange={setDamageType}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DAMAGE_TYPE_LABELS).map(
                            ([value, label]) => (
                              <SelectItem
                                key={value}
                                value={value}
                                className="text-xs"
                              >
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">Gravidade</label>
                      <Select value={severity} onValueChange={setSeverity}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SEVERITY_LABELS).map(
                            ([value, { label }]) => (
                              <SelectItem
                                key={value}
                                value={value}
                                className="text-xs"
                              >
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Observações (opcional)
                    </label>
                    <Textarea
                      placeholder="Descreva detalhes adicionais..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

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

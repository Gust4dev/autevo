"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  Loader2,
  Check,
  Clock,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
} from "@/components/ui";
import { trpc } from "@/lib/trpc/provider";
import { INSPECTION_TYPE_LABELS } from "@/lib/ChecklistDefinition";

interface PageProps {
  params: Promise<{ id: string }>;
}

type InspectionType = "entrada" | "intermediaria" | "final";

const INSPECTION_TYPES: InspectionType[] = [
  "entrada",
  "intermediaria",
  "final",
];

export default function InspectionIndexPage({ params }: PageProps) {
  const { id: orderId } = use(params);
  const router = useRouter();

  const inspectionsQuery = trpc.inspection.list.useQuery({ orderId });
  const orderQuery = trpc.order.getById.useQuery({ id: orderId });
  const { data: settings } = trpc.settings.get.useQuery();

  const inspectionRequired = (settings as any)?.inspectionRequired || "NONE";
  const isEntryRequired =
    inspectionRequired === "ENTRY" || inspectionRequired === "BOTH";
  const isExitRequired =
    inspectionRequired === "EXIT" || inspectionRequired === "BOTH";
  const noInspectionRequired = inspectionRequired === "NONE";

  const isTypeRequired = (type: InspectionType): boolean => {
    if (type === "entrada") return isEntryRequired;
    if (type === "final") return isExitRequired;
    return false;
  };

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
    return inspections.find((i: any) => i.type === type);
  };

  const getWarningMessage = () => {
    if (noInspectionRequired) {
      return {
        icon: Info,
        title: "Vistorias Opcionais",
        description:
          "Nenhuma vistoria é obrigatória. Você pode realizar vistorias para documentar o estado do veículo.",
        variant: "blue" as const,
      };
    }
    if (isEntryRequired && isExitRequired) {
      return {
        icon: AlertCircle,
        title: "Vistorias Obrigatórias",
        description:
          "As vistorias de Entrada e Saída são obrigatórias. A OS só pode ser concluída após finalizar a vistoria de saída.",
        variant: "amber" as const,
      };
    }
    if (isEntryRequired) {
      return {
        icon: AlertCircle,
        title: "Vistoria de Entrada Obrigatória",
        description:
          "A vistoria de Entrada é obrigatória antes de iniciar o serviço.",
        variant: "amber" as const,
      };
    }
    if (isExitRequired) {
      return {
        icon: AlertCircle,
        title: "Vistoria de Saída Obrigatória",
        description:
          "A vistoria de Saída é obrigatória. A OS só pode ser concluída após finalizá-la.",
        variant: "amber" as const,
      };
    }
    return null;
  };

  const warning = getWarningMessage();

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
        {warning && (
          <div
            className={`rounded-lg p-4 mb-6 ${
              warning.variant === "amber"
                ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <warning.icon
                className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  warning.variant === "amber"
                    ? "text-amber-600"
                    : "text-blue-600"
                }`}
              />
              <div>
                <p
                  className={`font-medium ${
                    warning.variant === "amber"
                      ? "text-amber-800 dark:text-amber-200"
                      : "text-blue-800 dark:text-blue-200"
                  }`}
                >
                  {warning.title}
                </p>
                <p
                  className={`text-sm ${
                    warning.variant === "amber"
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-blue-700 dark:text-blue-300"
                  }`}
                >
                  {warning.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inspection Types */}
        <div className="space-y-4">
          {INSPECTION_TYPES.map((type) => {
            const inspection = getInspectionForType(type);
            const typeInfo = INSPECTION_TYPE_LABELS[type];
            const isCompleted = inspection?.status === "concluida";
            const isInProgress = inspection?.status === "em_andamento";
            const progress = inspection?.progress || 0;
            const required = isTypeRequired(type);

            return (
              <Card
                key={type}
                className={`
                  ${isCompleted ? "border-green-300 dark:border-green-800" : ""}
                  ${isInProgress ? "border-primary" : ""}
                  ${
                    required && !isCompleted
                      ? "ring-1 ring-amber-300 dark:ring-amber-700"
                      : ""
                  }
                `}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{typeInfo.emoji}</span>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {typeInfo.label}
                          {required ? (
                            <Badge
                              variant="outline"
                              className="text-xs border-amber-400 text-amber-700 dark:text-amber-300"
                            >
                              Obrigatória
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              Opcional
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {typeInfo.description}
                        </CardDescription>
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
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isInProgress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progresso</span>
                        <span>
                          {inspection.completedItems} itens concluídos
                        </span>
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
                    variant={
                      isCompleted
                        ? "outline"
                        : required
                          ? "default"
                          : "secondary"
                    }
                    asChild
                  >
                    <Link
                      href={`/dashboard/orders/${orderId}/inspection/${type}`}
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      {isCompleted
                        ? "Ver Vistoria"
                        : isInProgress
                          ? "Continuar"
                          : "Iniciar"}
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

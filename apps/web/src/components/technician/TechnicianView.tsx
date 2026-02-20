"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  User,
  Clock,
  Calendar,
  ChevronRight,
  Wrench,
  CheckCircle2,
  PlayCircle,
  Eye,
  Phone,
  ClipboardCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc/provider";
import { StatusBadge } from "@/components/orders";
import { Button, Badge, Skeleton } from "@/components/ui";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { openWhatsApp } from "@/lib/whatsapp";

const STATUS_ACTIONS: Record<
  string,
  {
    label: string;
    nextStatus: string;
    icon: React.ElementType;
    variant: "default" | "outline" | "secondary";
  }
> = {
  AGENDADO: {
    label: "Iniciar Vistoria",
    nextStatus: "EM_VISTORIA",
    icon: PlayCircle,
    variant: "default",
  },
  EM_VISTORIA: {
    label: "Iniciar Execução",
    nextStatus: "EM_EXECUCAO",
    icon: Wrench,
    variant: "default",
  },
  EM_EXECUCAO: {
    label: "Aguardar Pagamento",
    nextStatus: "AGUARDANDO_PAGAMENTO",
    icon: CheckCircle2,
    variant: "default",
  },
};

function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

interface OrderCardProps {
  order: any;
  onStatusUpdate: (id: string, status: string) => void;
  isUpdating: boolean;
}

function OrderCard({ order, onStatusUpdate, isUpdating }: OrderCardProps) {
  const router = useRouter();
  const action = STATUS_ACTIONS[order.status];
  const services =
    order.items
      ?.map((i: any) => i.service?.name || i.customName)
      .filter(Boolean) ?? [];

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
      {/* Top bar with status color */}
      <div
        className={cn(
          "h-1.5 w-full",
          order.status === "AGENDADO" && "bg-secondary",
          order.status === "EM_VISTORIA" && "bg-blue-500",
          order.status === "EM_EXECUCAO" && "bg-amber-500",
          order.status === "AGUARDANDO_PAGAMENTO" && "bg-orange-500",
        )}
      />

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-base">
                {order.code}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              {formatTime(order.scheduledAt)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Vehicle & Customer */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">
              {order.vehicle.customer?.name || "Cliente desconhecido"}
            </span>
            {order.vehicle.customer?.phone && (
              <button
                onClick={() =>
                  openWhatsApp(
                    order.vehicle.customer.phone,
                    `Olá! Sobre a OS ${order.code}...`,
                  )
                }
                className="ml-auto text-green-600 hover:text-green-700 shrink-0"
                aria-label="WhatsApp"
              >
                <Phone className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {order.vehicle.brand} {order.vehicle.model}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] h-5 font-mono ml-auto"
            >
              {order.vehicle.plate}
            </Badge>
          </div>
        </div>

        {/* Services */}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {services.slice(0, 3).map((s: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
            {services.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{services.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {/* Inspection shortcut */}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-9"
            asChild
          >
            <Link href={`/dashboard/orders/${order.id}/inspection/entrada`}>
              <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
              Vistoria
            </Link>
          </Button>

          {/* Primary status action */}
          {action && (
            <Button
              size="sm"
              className="flex-1 text-xs h-9"
              variant={action.variant}
              disabled={isUpdating}
              onClick={() => onStatusUpdate(order.id, action.nextStatus)}
            >
              <action.icon className="h-3.5 w-3.5 mr-1.5" />
              {action.label}
            </Button>
          )}

          {!action && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-9"
              onClick={() => router.push(`/dashboard/orders/${order.id}`)}
            >
              Ver OS
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function TechnicianView() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.order.getMyTasks.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.order.getMyTasks.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar status"),
  });

  const handleStatusUpdate = (id: string, status: string) => {
    updateStatus.mutate({ id, status: status as any });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const todayOrders = data?.todayOrders ?? [];
  const upcomingOrders = data?.upcomingOrders ?? [];
  const totalActive = todayOrders.length + upcomingOrders.length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Wrench className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">
            {totalActive === 0
              ? "Nenhuma OS pendente"
              : `${totalActive} OS${totalActive > 1 ? "s" : ""} pendente${totalActive > 1 ? "s" : ""}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {todayOrders.length} para hoje · {upcomingOrders.length} nos
            próximos dias
          </p>
        </div>
      </div>

      {/* Today */}
      {todayOrders.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Hoje
            </h2>
            <Badge variant="secondary" className="text-xs">
              {todayOrders.length}
            </Badge>
          </div>
          {todayOrders.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
              isUpdating={updateStatus.isPending}
            />
          ))}
        </section>
      )}

      {/* Upcoming */}
      {upcomingOrders.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Próximos Dias
            </h2>
            <Badge variant="secondary" className="text-xs">
              {upcomingOrders.length}
            </Badge>
          </div>
          {upcomingOrders.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
              isUpdating={updateStatus.isPending}
            />
          ))}
        </section>
      )}

      {/* Empty state */}
      {totalActive === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="text-5xl">🎉</div>
          <p className="font-semibold">Tudo em dia!</p>
          <p className="text-sm text-muted-foreground">
            Nenhuma OS pendente para os próximos 7 dias.
          </p>
        </div>
      )}
    </div>
  );
}

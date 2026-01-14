"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, Car, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderInfo {
  id: string;
  code: string;
  status: string;
  scheduledAt: Date;
  carModel: string;
  plate: string;
  service: string;
}

interface DayCellProps {
  date: Date;
  orders: OrderInfo[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isLoading?: boolean;
}

const MAX_VISIBLE = 2;

function getStatusColor(
  status: string,
  scheduledAt: Date
): { bg: string; text: string; border: string; dot: string } {
  const today = startOfDay(new Date());
  const orderDate = startOfDay(new Date(scheduledAt));

  if (status === "CONCLUIDO") {
    return {
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-500/30",
      dot: "bg-green-500",
    };
  }

  if (status === "CANCELADO") {
    return {
      bg: "bg-muted/30",
      text: "text-muted-foreground line-through",
      border: "border-muted/40",
      dot: "bg-muted",
    };
  }

  if (isBefore(orderDate, today) && status !== "CONCLUIDO") {
    return {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/30",
      dot: "bg-red-500",
    };
  }

  if (
    status === "EM_VISTORIA" ||
    status === "EM_EXECUCAO" ||
    status === "AGUARDANDO_PAGAMENTO"
  ) {
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/30",
      dot: "bg-amber-500",
    };
  }

  return {
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/30",
    dot: "bg-slate-400",
  };
}

export function DayCell({
  date,
  orders,
  isCurrentMonth,
  isToday,
  isLoading,
}: DayCellProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const visibleOrders = orders.slice(0, MAX_VISIBLE);
  const extraCount = orders.length - MAX_VISIBLE;

  return (
    <>
      <div
        className={cn(
          "min-h-[100px] lg:min-h-[120px] p-2 transition-all relative group",
          "hover:bg-primary/5",
          !isCurrentMonth && "bg-muted/20 opacity-50",
          isToday && "bg-gradient-to-b from-primary/10 to-transparent"
        )}
      >
        {/* Day Number */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold transition-all",
              isToday
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
            )}
          >
            {format(date, "d")}
          </span>

          {orders.length > 0 && (
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
              {orders.length}
            </span>
          )}
        </div>

        {/* Orders List */}
        <div className="space-y-1">
          {isLoading ? (
            <div className="space-y-1">
              <div className="h-6 animate-pulse rounded-md bg-muted/50" />
              <div className="h-6 animate-pulse rounded-md bg-muted/30 w-3/4" />
            </div>
          ) : (
            <>
              {visibleOrders.map((order) => {
                const colors = getStatusColor(order.status, order.scheduledAt);
                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-all hover:shadow-sm hover:scale-[1.02]",
                      colors.bg,
                      colors.text,
                      "border",
                      colors.border
                    )}
                    title={`${order.carModel} - ${order.service}`}
                  >
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full flex-shrink-0",
                        colors.dot
                      )}
                    />
                    <span className="font-medium truncate">
                      {order.carModel}
                    </span>
                  </Link>
                );
              })}

              {extraCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-full px-2 text-[10px] text-muted-foreground hover:text-foreground font-medium"
                  onClick={() => setModalOpen(true)}
                >
                  <ChevronDown className="h-3 w-3 mr-1" />+{extraCount} mais
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Car className="h-5 w-5 text-primary" />
              {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum agendamento para este dia.
              </p>
            ) : (
              orders.map((order) => {
                const colors = getStatusColor(order.status, order.scheduledAt);
                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    onClick={() => setModalOpen(false)}
                    className={cn(
                      "block rounded-xl border p-4 transition-all hover:shadow-md",
                      colors.bg,
                      colors.border
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn("font-semibold", colors.text)}>
                          {order.carModel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.plate}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded-md">
                        {order.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(order.scheduledAt), "HH:mm")}
                      </span>
                      <span>{order.service}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import React, { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { DayCell } from "@/components/scheduling/DayCell";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAYS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function SchedulingPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const { data: orders = [], isLoading } = trpc.schedule.getByMonth.useQuery({
    month,
    year,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => null);

  const ordersByDay = React.useMemo(() => {
    const map = new Map<string, typeof orders>();
    orders.forEach((order) => {
      const key = format(new Date(order.scheduledAt), "yyyy-MM-dd");
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(order);
    });
    return map;
  }, [orders]);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedDateOrders = selectedDate
    ? ordersByDay.get(format(selectedDate, "yyyy-MM-dd")) || []
    : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Agendamentos
          </h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Visualize e gerencie os agendamentos do mês
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={goToToday}
              className="h-8 px-3 text-sm font-medium rounded-lg"
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-base sm:text-lg font-bold capitalize text-foreground">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Mobile: Horizontal day scroll + Selected day detail */}
      <div className="block sm:hidden">
        {/* Month mini-calendar as horizontal scroll */}
        <div className="bg-card rounded-2xl border shadow-sm p-4 space-y-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS_SHORT.map((day, i) => (
              <div
                key={i}
                className="text-center text-[10px] font-bold uppercase text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid - compact */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, index) => (
              <div key={`pad-${index}`} className="aspect-square" />
            ))}

            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayOrders = ordersByDay.get(dateKey) || [];
              const isTodayDate = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasOrders = dayOrders.length > 0;

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all
                    ${
                      isTodayDate && !isSelected
                        ? "bg-primary/10 text-primary font-bold"
                        : ""
                    }
                    ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-lg scale-110 z-10"
                        : "hover:bg-muted/50"
                    }
                    ${!isSelected && !isTodayDate ? "text-foreground" : ""}
                  `}
                >
                  <span
                    className={`text-sm font-semibold ${
                      isSelected ? "text-primary-foreground" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {hasOrders && !isSelected && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {dayOrders.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className="h-1 w-1 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                  )}
                  {hasOrders && isSelected && (
                    <span className="text-[9px] font-bold">
                      {dayOrders.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail */}
        <AnimatePresence mode="wait">
          {selectedDate && (
            <motion.div
              key={format(selectedDate, "yyyy-MM-dd")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold capitalize">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {selectedDateOrders.length} agendamentos
                </span>
              </div>

              {selectedDateOrders.length === 0 ? (
                <div className="bg-card rounded-xl border p-6 text-center">
                  <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum agendamento para este dia
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDateOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/dashboard/orders/${order.id}`}
                      className="block bg-card rounded-xl border p-4 hover:shadow-md transition-all hover:border-primary/30"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{order.carModel}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.plate}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                          {order.code}
                        </span>
                      </div>
                      <p className="text-sm text-primary mt-2">
                        {order.service}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: Full calendar grid */}
      <div className="hidden sm:block">
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold uppercase text-muted-foreground py-3 tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border/50">
            {paddingDays.map((_, index) => (
              <div
                key={`pad-${index}`}
                className="min-h-[100px] lg:min-h-[120px] bg-muted/5"
              />
            ))}

            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayOrders = ordersByDay.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <DayCell
                  key={dateKey}
                  date={day}
                  orders={dayOrders}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isTodayDate}
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted" />
            <span>Agendado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span>Em Andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span>Atrasado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Cake,
  Gift,
  Loader2,
  Clock,
} from "lucide-react";
import { ptBR } from "date-fns/locale";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui";
import { WhatsAppButton } from "@/components/whatsapp";
import { trpc } from "@/lib/trpc/provider";
import { DEFAULT_TEMPLATES, replaceTemplateVariables } from "@/lib/whatsapp";

// Helper para formatar data usando UTC (evita bug de timezone)
function formatBirthdayDate(date: Date): string {
  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const day = new Date(date).getUTCDate();
  const month = months[new Date(date).getUTCMonth()];
  return `${day} de ${month}`;
}

export function BirthdaySidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: birthdays, isLoading } = trpc.customer.getBirthdays.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();
  const tenantName = settings?.name || "Nossa Empresa";

  const getBirthdayMessage = (customerName: string) => {
    const template = DEFAULT_TEMPLATES.find((t) => t.key === "birthday");
    if (!template) return "";
    return replaceTemplateVariables(template.message, {
      nome: customerName.split(" ")[0],
      empresa: tenantName,
    });
  };

  // Separar por status
  const todayBirthdays = birthdays?.filter((b) => b.status === "today") || [];
  const upcomingBirthdays =
    birthdays?.filter((b) => b.status === "upcoming") || [];
  const passedBirthdays = birthdays?.filter((b) => b.status === "passed") || [];

  if (isCollapsed) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-l-lg rounded-r-none h-24 w-8 shadow-lg border-r-0"
          onClick={() => setIsCollapsed(false)}
        >
          <div className="flex flex-col items-center gap-1">
            <Cake className="h-4 w-4" />
            <ChevronLeft className="h-3 w-3" />
            {birthdays && birthdays.length > 0 && (
              <Badge
                variant="destructive"
                className="h-5 w-5 p-0 text-[10px] flex items-center justify-center"
              >
                {birthdays.length}
              </Badge>
            )}
          </div>
        </Button>
      </div>
    );
  }

  const renderBirthdayCard = (
    customer: NonNullable<typeof birthdays>[number],
  ) => {
    const statusStyles = {
      today:
        "bg-pink-50 border-pink-200 dark:bg-pink-950/20 dark:border-pink-900/50",
      upcoming: "bg-muted/50 border-transparent",
      passed:
        "bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-900/30",
    };

    return (
      <div
        key={customer.id}
        className={`flex items-center justify-between p-3 rounded-lg border ${statusStyles[customer.status]}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{customer.name}</p>
            {customer.status === "today" && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                HOJE!
              </Badge>
            )}
            {customer.status === "passed" && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300"
              >
                Passou
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatBirthdayDate(customer.birthDate)}
            {customer.status === "upcoming" &&
              customer.daysFromToday === 1 &&
              " (amanhã)"}
            {customer.status === "upcoming" &&
              customer.daysFromToday > 1 &&
              ` (em ${customer.daysFromToday} dias)`}
            {customer.status === "passed" &&
              customer.daysFromToday === -1 &&
              " (ontem)"}
            {customer.status === "passed" &&
              customer.daysFromToday < -1 &&
              ` (há ${Math.abs(customer.daysFromToday)} dias)`}
          </p>
        </div>
        <WhatsAppButton
          phone={customer.phone}
          message={getBirthdayMessage(customer.name)}
          whatsappOptIn={customer.whatsappOptIn}
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
        >
          <Gift className="h-4 w-4 text-green-600" />
        </WhatsAppButton>
      </div>
    );
  };

  return (
    <div className="fixed right-0 top-20 z-40 w-80 max-h-[calc(100vh-6rem)] overflow-hidden">
      <Card className="rounded-r-none border-r-0 shadow-xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-pink-500" />
            <CardTitle className="text-base">Aniversariantes</CardTitle>
            {birthdays && birthdays.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {birthdays.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="max-h-96 overflow-y-auto pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !birthdays || birthdays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Gift className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum aniversariante nos próximos 7 dias
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Aniversariantes de Hoje */}
              {todayBirthdays.length > 0 && (
                <div className="space-y-2">
                  {todayBirthdays.map(renderBirthdayCard)}
                </div>
              )}

              {/* Próximos Aniversariantes */}
              {upcomingBirthdays.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Próximos
                  </p>
                  {upcomingBirthdays.map(renderBirthdayCard)}
                </div>
              )}

              {/* Aniversários que passaram */}
              {passedBirthdays.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Últimos dias
                  </p>
                  {passedBirthdays.map(renderBirthdayCard)}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

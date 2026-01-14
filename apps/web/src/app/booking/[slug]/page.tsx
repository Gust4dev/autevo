"use client";

import { use, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Separator,
  Badge,
} from "@/components/ui";
import {
  Calendar as CalendarIcon,
  Car,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock,
  Loader2,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

type Step = "service" | "date" | "info" | "success";

export default function PublicBookingPage({ params }: BookingPageProps) {
  const { slug } = use(params);
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    plate: "",
    model: "",
    brand: "",
    color: "",
  });

  // Queries
  const { data: tenant, isLoading: loadingTenant } =
    trpc.schedule.getPublicTenant.useQuery({ slug });
  const { data: availableDates, isLoading: loadingDates } =
    trpc.schedule.getAvailableDates.useQuery(
      { tenantId: tenant?.id! },
      { enabled: !!tenant?.id }
    );

  // Mutation
  const bookingMutation = trpc.schedule.createPublicBooking.useMutation({
    onSuccess: () => {
      setStep("success");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao realizar agendamento");
    },
  });

  if (loadingTenant) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Oficina não encontrada</h1>
        <p className="text-muted-foreground">
          O link acessado pode estar incorreto.
        </p>
      </div>
    );
  }

  const primaryColor = tenant.primaryColor || "#000000";

  const handleNext = () => {
    if (step === "service" && selectedService) setStep("date");
    else if (step === "date" && selectedDate) setStep("info");
  };

  const handleBack = () => {
    if (step === "date") setStep("service");
    else if (step === "info") setStep("date");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate) return;

    bookingMutation.mutate({
      tenantId: tenant.id,
      serviceId: selectedService.id,
      scheduledAt: selectedDate,
      customer: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
      },
      vehicle: {
        plate: formData.plate,
        model: formData.model,
        brand: formData.brand,
        color: formData.color,
      },
    });
  };

  return (
    <div className="min-h-screen bg-muted/5 font-sans">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logo ? (
              <img
                src={tenant.logo}
                alt={tenant.name}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <div
                className="h-10 w-10 flex items-center justify-center rounded-lg font-bold text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {tenant.name.substring(0, 1)}
              </div>
            )}
            <h1 className="font-bold text-lg hidden sm:block">{tenant.name}</h1>
          </div>
          {step !== "success" && (
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    (i === 1 && step === "service") ||
                    (i === 2 && step === "date") ||
                    (i === 3 && step === "info")
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                  style={{
                    backgroundColor:
                      (i === 1 && step === "service") ||
                      (i === 2 && step === "date") ||
                      (i === 3 && step === "info")
                        ? primaryColor
                        : undefined,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === "service" && (
            <motion.div
              key="service"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                  O que vamos fazer hoje?
                </h2>
                <p className="text-muted-foreground">
                  Selecione o serviço que deseja realizar
                </p>
              </div>

              <div className="grid gap-4">
                {tenant.services.map((service) => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden ${
                      selectedService?.id === service.id
                        ? "ring-2 ring-primary border-primary"
                        : ""
                    }`}
                    style={
                      {
                        borderColor:
                          selectedService?.id === service.id
                            ? primaryColor
                            : undefined,
                        boxShadow:
                          selectedService?.id === service.id
                            ? `0 0 0 2px ${primaryColor}`
                            : undefined,
                      } as React.CSSProperties
                    }
                    onClick={() => setSelectedService(service)}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.estimatedTime
                              ? `${service.estimatedTime} min`
                              : "Tempo sob consulta"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className="font-bold text-lg"
                          style={{ color: primaryColor }}
                        >
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(service.basePrice))}
                        </p>
                        {selectedService?.id === service.id && (
                          <CheckCircle2
                            className="h-5 w-5 text-primary float-right mt-1"
                            style={{ color: primaryColor }}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="pt-4">
                <Button
                  className="w-full h-12 text-lg font-bold rounded-xl"
                  style={{ backgroundColor: primaryColor }}
                  disabled={!selectedService}
                  onClick={handleNext}
                >
                  Continuar
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "date" && (
            <motion.div
              key="date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Button variant="ghost" onClick={handleBack} className="-ml-2">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                  Quando podemos te receber?
                </h2>
                <p className="text-muted-foreground">
                  Selecione uma data disponível
                </p>
              </div>

              {loadingDates ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableDates?.map((item) => (
                    <button
                      key={item.date.toString()}
                      disabled={!item.available}
                      onClick={() => setSelectedDate(new Date(item.date))}
                      className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1 ${
                        !item.available
                          ? "opacity-40 cursor-not-allowed bg-muted"
                          : selectedDate &&
                            isSameDay(selectedDate, new Date(item.date))
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      style={{
                        borderColor:
                          selectedDate &&
                          isSameDay(selectedDate, new Date(item.date))
                            ? primaryColor
                            : undefined,
                        backgroundColor:
                          selectedDate &&
                          isSameDay(selectedDate, new Date(item.date))
                            ? `${primaryColor}10`
                            : undefined,
                      }}
                    >
                      <span className="text-xs font-bold uppercase text-muted-foreground">
                        {format(new Date(item.date), "EEE", { locale: ptBR })}
                      </span>
                      <span className="text-2xl font-bold">
                        {format(new Date(item.date), "dd")}
                      </span>
                      <span className="text-xs font-medium">
                        {format(new Date(item.date), "MMM", { locale: ptBR })}
                      </span>
                      {item.available ? (
                        <span className="text-[10px] text-green-600 font-bold mt-1">
                          Disponível
                        </span>
                      ) : (
                        <span className="text-[10px] text-destructive font-bold mt-1">
                          Lotado
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-4">
                <Button
                  className="w-full h-12 text-lg font-bold rounded-xl"
                  style={{ backgroundColor: primaryColor }}
                  disabled={!selectedDate}
                  onClick={handleNext}
                >
                  Continuar
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Button variant="ghost" onClick={handleBack} className="-ml-2">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Quase lá!</h2>
                <p className="text-muted-foreground">
                  Confirme seus dados e do seu veículo
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <User
                          className="h-4 w-4"
                          style={{ color: primaryColor }}
                        />
                        Seus Dados
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome Completo</Label>
                          <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                          <Input
                            id="phone"
                            required
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <Car
                          className="h-4 w-4"
                          style={{ color: primaryColor }}
                        />
                        Dados do Veículo
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="plate">Placa</Label>
                          <Input
                            id="plate"
                            required
                            className="uppercase font-mono"
                            placeholder="ABC1D23"
                            value={formData.plate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                plate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model">Modelo</Label>
                          <Input
                            id="model"
                            required
                            placeholder="Ex: Golf"
                            value={formData.model}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                model: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brand">Marca</Label>
                          <Input
                            id="brand"
                            required
                            placeholder="Ex: Volkswagen"
                            value={formData.brand}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                brand: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="color">Cor</Label>
                          <Input
                            id="color"
                            required
                            placeholder="Ex: Prata"
                            value={formData.color}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                color: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full h-12 text-lg font-bold rounded-xl"
                        style={{ backgroundColor: primaryColor }}
                        disabled={bookingMutation.isPending}
                      >
                        {bookingMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Agendando...
                          </>
                        ) : (
                          "Finalizar Agendamento"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-8 py-12"
            >
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-4xl font-bold tracking-tight">
                  Agendamento Realizado!
                </h2>
                <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                  Tudo certo, <strong>{formData.name}</strong>! Recebemos sua
                  solicitação para o dia{" "}
                  <strong>
                    {format(selectedDate!, "dd 'de' MMMM", { locale: ptBR })}
                  </strong>
                  .
                </p>
              </div>

              <Card className="max-w-sm mx-auto bg-primary/5 border-primary/20">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Serviço:</span>
                    <span className="font-bold">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Veículo:</span>
                    <span className="font-bold">
                      {formData.model} ({formData.plate.toUpperCase()})
                    </span>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">
                      Entraremos em contato via WhatsApp caso haja qualquer
                      alteração.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="pt-8">
                <Button
                  variant="outline"
                  className="rounded-full px-8"
                  onClick={() => (window.location.href = "/")}
                >
                  Voltar para o Início
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Business Hours */}
      {step !== "success" && (
        <div className="container max-w-2xl mx-auto px-4 pb-12 mt-8 text-center space-y-4">
          {tenant.businessHours && (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
              <Clock className="h-3 w-3" />
              {tenant.businessHours}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Desenvolvido por Autevo
          </p>
        </div>
      )}
    </div>
  );
}

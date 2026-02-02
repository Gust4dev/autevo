"use client";

import { use, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Separator,
  Badge,
  DateInput,
} from "@/components/ui";
import {
  Calendar as CalendarIcon,
  Car,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Star,
  CalendarDays,
  Menu,
  X,
  Smartphone,
  Info,
  UserCheck,
  UserPlus,
  Search,
  Sparkles,
} from "lucide-react";
import {
  format,
  addDays,
  startOfDay,
  isSameDay,
  parse,
  isValid,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import Image from "next/image";
import { isValidCPF, formatCPF, cleanCPF } from "@/lib/cpf-validator";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

type Step = "welcome" | "identify" | "service" | "date" | "info" | "success";

// Tipo para veículo do cliente existente
interface ExistingVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
}

// Tipo para cliente existente
interface ExistingCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthDate: Date | null;
  vehicles: ExistingVehicle[];
}

export default function PublicBookingPage({ params }: BookingPageProps) {
  const { slug } = use(params);
  const [step, setStep] = useState<Step>("welcome");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Estados para identificação
  const [isReturningCustomer, setIsReturningCustomer] = useState<
    boolean | null
  >(null);
  const [cpfInput, setCpfInput] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [existingCustomer, setExistingCustomer] =
    useState<ExistingCustomer | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [useNewVehicle, setUseNewVehicle] = useState(false);

  const [formData, setFormData] = useState({
    document: "",
    name: "",
    phone: "",
    email: "",
    birthDate: "",
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
      { enabled: !!tenant?.id },
    );

  // Lookup de cliente por CPF - usando refetch manual
  const lookupCustomerQuery = trpc.schedule.lookupCustomerByDocument.useQuery(
    { tenantId: tenant?.id!, document: cleanCPF(cpfInput) },
    {
      enabled: false, // Desabilitado por padrão, acionado manualmente
    },
  );

  // Handler para buscar cliente por CPF
  const handleCpfLookup = async () => {
    const cleanedCpf = cleanCPF(cpfInput);

    if (cleanedCpf.length !== 11) {
      setCpfError("CPF deve ter 11 dígitos");
      return;
    }

    if (!isValidCPF(cleanedCpf)) {
      setCpfError("CPF inválido. Verifique o número digitado.");
      return;
    }

    setCpfError("");

    try {
      const result = await lookupCustomerQuery.refetch();

      if (result.data) {
        // Cliente encontrado
        const customerData = result.data;
        setExistingCustomer(customerData);
        setFormData((prev) => ({
          ...prev,
          document: cleanedCpf,
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || "",
          birthDate: customerData.birthDate
            ? new Date(customerData.birthDate).toISOString().split("T")[0]
            : "",
        }));

        if (customerData.vehicles.length > 0) {
          setSelectedVehicleId(customerData.vehicles[0].id);
        }
      } else {
        // Cliente não encontrado - avança para cadastro
        setExistingCustomer(null);
        setFormData((prev) => ({ ...prev, document: cleanedCpf }));
      }

      setStep("service");
    } catch (error: any) {
      setCpfError(error.message || "Erro ao buscar cliente");
    }
  };

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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <div className="h-16 w-16 rounded-2xl bg-gray-200 animate-pulse" />
        </motion.div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center bg-gray-50">
        <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <X className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Oficina não encontrada
        </h1>
        <p className="text-gray-500 max-w-md">
          O endereço que você acessou não corresponde a nenhuma oficina ativa em
          nossa plataforma.
        </p>
      </div>
    );
  }

  const primaryColor = tenant.primaryColor || "#000000";
  // Create a lighter shade for backgrounds
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const primaryLight = hexToRgba(primaryColor, 0.05);

  const handleNext = () => {
    if (step === "service" && selectedService) {
      setStep("date");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (step === "date" && selectedDate) {
      setStep("info");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (step === "identify") {
      setStep("welcome");
      setIsReturningCustomer(null);
    } else if (step === "service") {
      // Se cliente é novo, volta pro welcome. Se é existente, volta pro identify
      if (isReturningCustomer) {
        setStep("identify");
      } else {
        setStep("welcome");
        setIsReturningCustomer(null);
      }
    } else if (step === "date") {
      setStep("service");
    } else if (step === "info") {
      setStep("date");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate) return;

    // Determinar se usa veículo existente ou novo
    const useExistingVehicle =
      existingCustomer && selectedVehicleId && !useNewVehicle;

    bookingMutation.mutate({
      tenantId: tenant.id,
      serviceId: selectedService.id,
      scheduledAt: selectedDate,
      existingVehicleId: useExistingVehicle ? selectedVehicleId : undefined,
      customer: {
        document: formData.document,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        birthDate: formData.birthDate || undefined,
      },
      vehicle: useExistingVehicle
        ? undefined
        : {
            plate: formData.plate,
            model: formData.model,
            brand: formData.brand,
            color: formData.color,
          },
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-primary/20">
      {/* Decorative Background Elements */}
      <div
        className="fixed top-0 left-0 w-full h-[50vh] opacity-30 pointer-events-none z-0"
        style={{
          background: `linear-gradient(to bottom, ${primaryLight}, transparent)`,
        }}
      />

      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col shadow-2xl bg-white sm:my-8 sm:rounded-[2.5rem] overflow-hidden border border-gray-100">
        {/* Header Section with Glass Effect */}
        <div className="relative bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100">
          <div className="px-6 py-6">
            <div className="flex flex-col items-center gap-4 text-center">
              {tenant.logo ? (
                <div className="relative h-20 w-20 shadow-xl rounded-2xl overflow-hidden ring-4 ring-white">
                  <img
                    src={tenant.logo}
                    alt={tenant.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="h-20 w-20 flex items-center justify-center rounded-2xl font-bold text-3xl text-white shadow-xl ring-4 ring-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {tenant.name.substring(0, 1)}
                </div>
              )}

              <div className="space-y-1">
                <h1 className="font-extrabold text-2xl tracking-tight text-gray-900 leading-tight">
                  {tenant.name}
                </h1>
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  <span className="bg-gray-100 px-2 py-1 rounded-md">
                    Agendamento Online
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Stepper - só mostra após identificação */}
            {step !== "success" &&
              step !== "welcome" &&
              step !== "identify" && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {[
                    { id: "service", label: "Serviço" },
                    { id: "date", label: "Data" },
                    { id: "info", label: "Dados" },
                  ].map((s, idx) => {
                    const stepOrder = ["service", "date", "info"];
                    const currentIdx = stepOrder.indexOf(step);
                    const isActive = s.id === step;
                    const isCompleted = idx < currentIdx;

                    return (
                      <div key={s.id} className="flex items-center">
                        <div
                          className={`
                                        h-2.5 w-8 rounded-full transition-all duration-500 
                                        ${
                                          isActive || isCompleted
                                            ? "scale-100"
                                            : "scale-75 opacity-30"
                                        }
                                    `}
                          style={{
                            backgroundColor:
                              isActive || isCompleted
                                ? primaryColor
                                : "#E5E7EB",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 px-6 py-8 bg-white relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* STEP WELCOME: Boas-vindas */}
            {step === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <Sparkles className="h-12 w-12 text-amber-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Bem-vindo(a)! 👋
                  </h2>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Estamos felizes em ter você aqui. Vamos agendar seu serviço
                    rapidamente!
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-center font-semibold text-gray-800">
                    Você já é cliente da {tenant.name}?
                  </p>

                  <div className="grid gap-4">
                    {/* Botão SIM */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsReturningCustomer(true);
                        setStep("identify");
                      }}
                      className="flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-md transition-all bg-white"
                    >
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <UserCheck className="h-6 w-6" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-bold text-gray-900">
                          Sim, já sou cliente
                        </h3>
                        <p className="text-sm text-gray-500">
                          Vou informar meu CPF para agilizar
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </motion.button>

                    {/* Botão NÃO */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsReturningCustomer(false);
                        setExistingCustomer(null);
                        setStep("service");
                      }}
                      className="flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-md transition-all bg-white"
                    >
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600">
                        <UserPlus className="h-6 w-6" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-bold text-gray-900">
                          Não, é minha primeira vez
                        </h3>
                        <p className="text-sm text-gray-500">
                          Vou criar meu cadastro agora
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP IDENTIFY: Verificação CPF */}
            {step === "identify" && (
              <motion.div
                key="identify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-2 -ml-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="sr-only">Voltar</span>
                  </Button>
                  <span className="text-sm font-medium text-gray-400">
                    Voltar
                  </span>
                </div>

                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <div
                      className="h-16 w-16 rounded-2xl flex items-center justify-center text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Search className="h-8 w-8" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Informe seu CPF
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Vamos buscar seu cadastro para agilizar o agendamento
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="cpf"
                      className="text-xs font-bold uppercase text-gray-500"
                    >
                      CPF
                    </Label>
                    <Input
                      id="cpf"
                      type="text"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={cpfInput}
                      onChange={(e) => {
                        // Formatar CPF enquanto digita
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 11) {
                          setCpfInput(formatCPF(value));
                          setCpfError("");
                        }
                      }}
                      className={`h-14 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all text-center text-xl font-mono tracking-wider ${cpfError ? "border-red-500" : ""}`}
                    />
                    {cpfError && (
                      <p className="text-sm text-red-500 text-center">
                        {cpfError}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-gray-200 hover:shadow-2xl hover:scale-[1.01] transition-all"
                    style={{ backgroundColor: primaryColor }}
                    disabled={
                      cleanCPF(cpfInput).length !== 11 ||
                      lookupCustomerQuery.isFetching
                    }
                    onClick={handleCpfLookup}
                  >
                    {lookupCustomerQuery.isFetching ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        Verificar
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP SERVICE SELECTION */}
            {step === "service" && (
              <motion.div
                key="service"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Saudação personalizada com botão voltar */}
                <div className="flex items-center gap-2 -ml-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="sr-only">Voltar</span>
                  </Button>
                  <span className="text-sm font-medium text-gray-400">
                    Voltar
                  </span>
                </div>

                {/* Card de cliente encontrado */}
                {existingCustomer && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl border-2 border-green-200 bg-green-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-green-800">
                          Olá, {existingCustomer.name}!
                        </p>
                        <p className="text-sm text-green-600">
                          Encontramos seu cadastro 🎉
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {existingCustomer ? "O que vamos fazer hoje?" : "Olá! 👋"}
                    <br />
                    {!existingCustomer && "O que seu carro precisa?"}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Escolha um dos nossos serviços premium abaixo
                  </p>
                </div>

                <div className="grid gap-4">
                  {tenant.services.map((service) => (
                    <motion.div
                      key={service.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className={`
                                cursor-pointer group relative overflow-hidden rounded-2xl border-2 transition-all duration-300
                                ${
                                  selectedService?.id === service.id
                                    ? "shadow-lg bg-gray-50"
                                    : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                                }
                            `}
                        style={{
                          borderColor:
                            selectedService?.id === service.id
                              ? primaryColor
                              : undefined,
                        }}
                        onClick={() => setSelectedService(service)}
                      >
                        <div className="p-5 flex items-start gap-4">
                          <div
                            className={`
                                        h-12 w-12 rounded-xl flex items-center justify-center transition-colors duration-300
                                        ${
                                          selectedService?.id === service.id
                                            ? "text-white"
                                            : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                                        }
                                    `}
                            style={{
                              backgroundColor:
                                selectedService?.id === service.id
                                  ? primaryColor
                                  : undefined,
                            }}
                          >
                            <Wrench className="h-6 w-6" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-gray-900">
                                {service.name}
                              </h3>
                              {selectedService?.id === service.id && (
                                <div
                                  className="h-6 w-6 rounded-full flex items-center justify-center animate-in zoom-in"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  <CheckCircle2 className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>
                            {service.description && (
                              <p className="text-sm text-gray-500 leading-relaxed max-w-[90%]">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                                <Clock className="h-3.5 w-3.5" />
                                {service.estimatedTime
                                  ? `${service.estimatedTime} min`
                                  : "Sob consulta"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4">
                  <Button
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-gray-200 hover:shadow-2xl hover:scale-[1.01] transition-all"
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

            {/* STEP 2: DATE SELECTION */}
            {step === "date" && (
              <motion.div
                key="date"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-2 -ml-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="sr-only">Voltar</span>
                  </Button>
                  <span className="text-sm font-medium text-gray-400">
                    Voltar para serviços
                  </span>
                </div>

                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Quando fica melhor?
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Encontramos estes horários para você
                  </p>
                </div>

                {loadingDates ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-gray-300" />
                    <p className="text-sm text-gray-400 animate-pulse">
                      Buscando disponibilidade...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                      {availableDates?.map((item, idx) => {
                        const isSelected =
                          selectedDate &&
                          isSameDay(selectedDate, new Date(item.date));
                        const isToday = isSameDay(
                          new Date(),
                          new Date(item.date),
                        );
                        const date = new Date(item.date);

                        return (
                          <motion.button
                            key={item.date.toString()}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            disabled={!item.available}
                            onClick={() => setSelectedDate(date)}
                            className={`
                                            relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 aspect-[4/5]
                                            ${
                                              !item.available
                                                ? "opacity-30 cursor-not-allowed bg-gray-50 border-transparent"
                                                : "hover:border-gray-300 bg-white shadow-sm"
                                            }
                                            ${
                                              isSelected
                                                ? "ring-2 bg-gray-50"
                                                : "border-gray-100"
                                            }
                                        `}
                            style={{
                              borderColor: isSelected
                                ? primaryColor
                                : undefined,
                              boxShadow: isSelected
                                ? `0 10px 30px -10px ${primaryColor}40`
                                : undefined,
                            }}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                              {format(date, "EEE", { locale: ptBR }).replace(
                                ".",
                                "",
                              )}
                            </span>
                            <span
                              className="text-2xl font-black text-gray-900 leading-none mb-2"
                              style={{
                                color: isSelected ? primaryColor : undefined,
                              }}
                            >
                              {format(date, "dd")}
                            </span>
                            {item.available ? (
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            ) : (
                              <div className="h-1.5 w-1.5 rounded-full bg-red-300" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Selection Summary */}
                    <div className="rounded-2xl bg-gray-50 p-6 border border-gray-100 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-500">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                            Data Selecionada
                          </p>
                          <p className="font-bold text-gray-900">
                            {selectedDate
                              ? format(selectedDate, "EEEE, d 'de' MMMM", {
                                  locale: ptBR,
                                })
                              : "Selecione uma data acima"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-500">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                            Serviço
                          </p>
                          <p className="font-bold text-gray-900 truncate">
                            {selectedService.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                            Valor
                          </p>
                          <p className="font-bold text-gray-900">
                            {formatCurrency(Number(selectedService.basePrice))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4">
                  <Button
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-gray-200 hover:shadow-2xl hover:scale-[1.01] transition-all"
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

            {/* STEP 3: INFORMATION */}
            {step === "info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 -ml-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="sr-only">Voltar</span>
                  </Button>
                  <span className="text-sm font-medium text-gray-400">
                    Voltar para data
                  </span>
                </div>

                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Vamos finalizar!
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Preencha seus dados para confirmarmos o agendamento
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* User Data Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <div className="p-1.5 rounded-lg bg-gray-100 text-gray-600">
                        <User className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-gray-900">Seus Dados</h3>
                      <span className="ml-auto text-xs text-gray-400">
                        <span className="text-red-500">*</span> Obrigatório
                      </span>
                    </div>

                    <div className="grid gap-4">
                      {/* Campo CPF */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="cpfForm"
                          className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1"
                        >
                          CPF <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="cpfForm"
                          required
                          inputMode="numeric"
                          className={`h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all ${existingCustomer ? "bg-gray-100 cursor-not-allowed" : ""}`}
                          placeholder="000.000.000-00"
                          value={formatCPF(formData.document)}
                          disabled={!!existingCustomer}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            if (value.length <= 11) {
                              setFormData({ ...formData, document: value });
                            }
                          }}
                        />
                        {existingCustomer && (
                          <p className="text-xs text-green-600">
                            CPF já verificado ✓
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1"
                        >
                          Nome Completo <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          required
                          className={`h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all ${existingCustomer ? "bg-gray-100" : ""}`}
                          placeholder="Digite seu nome"
                          value={formData.name}
                          readOnly={!!existingCustomer}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="birthDate"
                            className="text-xs font-bold uppercase text-gray-500"
                          >
                            Nascimento
                          </Label>
                          <DateInput
                            id="birthDate"
                            className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            value={formData.birthDate || ""}
                            onChange={(value) =>
                              setFormData({
                                ...formData,
                                birthDate: value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="phone"
                            className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1"
                          >
                            WhatsApp <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="phone"
                            required
                            className={`h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all ${existingCustomer ? "bg-gray-100" : ""}`}
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            readOnly={!!existingCustomer}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-xs font-bold uppercase text-gray-500"
                        >
                          E-mail (Opcional)
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Data Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <div className="p-1.5 rounded-lg bg-gray-100 text-gray-600">
                        <Car className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-gray-900">O Veículo</h3>
                      <span className="ml-auto text-xs text-gray-400">
                        <span className="text-red-500">*</span> Obrigatório
                      </span>
                    </div>

                    {/* Veículos Existentes */}
                    {existingCustomer &&
                      existingCustomer.vehicles.length > 0 &&
                      !useNewVehicle && (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">
                            Selecione um dos seus veículos:
                          </p>
                          <div className="grid gap-3">
                            {existingCustomer.vehicles.map((vehicle) => (
                              <motion.button
                                key={vehicle.id}
                                type="button"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedVehicleId(vehicle.id)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                                  selectedVehicleId === vehicle.id
                                    ? "bg-gray-50 shadow-md"
                                    : "border-gray-100 hover:border-gray-200"
                                }`}
                                style={{
                                  borderColor:
                                    selectedVehicleId === vehicle.id
                                      ? primaryColor
                                      : undefined,
                                }}
                              >
                                <div
                                  className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                                    selectedVehicleId === vehicle.id
                                      ? "text-white"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                  style={{
                                    backgroundColor:
                                      selectedVehicleId === vehicle.id
                                        ? primaryColor
                                        : undefined,
                                  }}
                                >
                                  <Car className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900 font-mono">
                                    {vehicle.plate}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {vehicle.brand} {vehicle.model} •{" "}
                                    {vehicle.color}
                                  </p>
                                </div>
                                {selectedVehicleId === vehicle.id && (
                                  <CheckCircle2
                                    className="h-5 w-5"
                                    style={{ color: primaryColor }}
                                  />
                                )}
                              </motion.button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setUseNewVehicle(true);
                              setSelectedVehicleId(null);
                            }}
                            className="w-full py-3 text-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            + Adicionar novo veículo
                          </button>
                        </div>
                      )}

                    {/* Formulário de Novo Veículo */}
                    {(!existingCustomer ||
                      existingCustomer.vehicles.length === 0 ||
                      useNewVehicle) && (
                      <>
                        {useNewVehicle && existingCustomer && (
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-gray-600">
                              Novo veículo
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setUseNewVehicle(false);
                                if (existingCustomer.vehicles.length > 0) {
                                  setSelectedVehicleId(
                                    existingCustomer.vehicles[0].id,
                                  );
                                }
                              }}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              ← Usar existente
                            </button>
                          </div>
                        )}

                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="plate"
                                className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1"
                              >
                                Placa <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="plate"
                                required
                                className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all font-mono uppercase"
                                placeholder="ABC-1234"
                                maxLength={7}
                                value={formData.plate}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    plate: e.target.value.toUpperCase(),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="color"
                                className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1"
                              >
                                Cor <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="color"
                                required
                                className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                placeholder="Prata"
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

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="brand"
                                className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1"
                              >
                                Marca <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="brand"
                                required
                                className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                placeholder="Toyota"
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
                              <Label
                                htmlFor="model"
                                className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1"
                              >
                                Modelo <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="model"
                                required
                                className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                placeholder="Corolla"
                                value={formData.model}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    model: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4">
                    <Button
                      type="submit"
                      className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-gray-200 hover:shadow-2xl hover:scale-[1.01] transition-all"
                      style={{ backgroundColor: primaryColor }}
                      disabled={bookingMutation.isPending}
                    >
                      {bookingMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Confirmando...
                        </>
                      ) : (
                        "Confirmar Agendamento"
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-8 py-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div
                      className="h-64 w-64 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                  <div className="relative h-24 w-24 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6 ring-8 ring-green-50 shadow-lg">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    Tudo Pronto! 🎉
                  </h2>
                  <p className="text-gray-500 text-lg max-w-sm mx-auto">
                    Seu agendamento foi realizado com sucesso. Aguardamos você!
                  </p>
                </div>

                <div className="bg-gray-50 rounded-3xl p-6 text-left border border-gray-100 shadow-sm relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 w-full h-1"
                    style={{ backgroundColor: primaryColor }}
                  />

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 text-gray-500 shadow-sm">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Quando
                        </p>
                        <p className="font-bold text-gray-900 text-lg">
                          {format(selectedDate!, "d 'de' MMMM", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 text-gray-500 shadow-sm">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Serviço
                        </p>
                        <p className="font-bold text-gray-900 text-lg">
                          {selectedService.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 text-gray-500 shadow-sm">
                        <Car className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Veículo
                        </p>
                        <p className="font-bold text-gray-900 text-lg uppercase">
                          {formData.model} • {formData.plate}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-400">
                  Enviamos uma confirmação para o seu WhatsApp.
                </p>

                <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-2 hover:bg-gray-50 font-bold"
                  onClick={() => window.location.reload()}
                >
                  Novo Agendamento
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Area with Contact Info */}
        {step !== "success" && (
          <div className="bg-gray-50 border-t border-gray-100 p-8 space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              {tenant.businessHours && (
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {tenant.businessHours}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
                {tenant.phone && (
                  <a
                    href={`tel:${tenant.phone}`}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {tenant.phone}
                  </a>
                )}
                {tenant.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="max-w-[200px] truncate">
                      {tenant.address}
                    </span>
                  </div>
                )}
              </div>

              {tenant.cnpj && (
                <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                  CNPJ: {tenant.cnpj}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 flex items-center justify-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Powered by
              </span>
              <span className="text-xs font-black tracking-tighter text-gray-900">
                AUTEVO
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper icons specifically for this file to avoid conflicts
function Wrench({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

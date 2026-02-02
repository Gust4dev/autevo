"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Save,
  Loader2,
  Settings,
  Palette,
  CreditCard,
  Upload,
  Link as LinkIcon,
  FileText,
  ShieldCheck,
  Download,
  Eye,
  LayoutGrid,
  Wrench,
  Globe,
  Database,
  Bell,
} from "lucide-react";
import { exportToExcel, formatFilenameDate } from "@/lib/export";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Separator,
} from "@/components/ui";
import { trpc } from "@/lib/trpc/provider";
import { toast } from "sonner";
import { convertFileToWebP } from "@/lib/image-conversion";
import { PushNotificationToggle } from "@/components/push-notification-toggle";

const settingsSchema = z.object({
  name: z.string().min(2, "Nome muito curto").optional(),
  logo: z.string().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  pixKey: z.string().optional(),
  paymentTerms: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  cnpj: z.string().optional(),
  contractTemplate: z.string().optional(),
  maxDailyCapacity: z
    .number()
    .min(1, "Mínimo 1 slot")
    .max(100, "Máximo 100 slots")
    .optional(),
  businessHours: z.string().optional().or(z.literal("")),
  slug: z
    .string()
    .min(3, "Link muito curto")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras, números e hífens"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [logoMode, setLogoMode] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);
  const [inspectionRequired, setInspectionRequired] = useState<
    "NONE" | "ENTRY" | "EXIT" | "BOTH"
  >("NONE");
  const [inspectionSignature, setInspectionSignature] = useState(true);

  const { data: settings, isLoading } = trpc.settings.get.useQuery();

  // Convert hex to HSL for CSS variable
  const hexToHSL = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
      l * 100,
    )}%`;
  };

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: (_, variables) => {
      toast.success("Configurações salvas com sucesso!");

      // Apply primary color immediately
      if (variables.primaryColor) {
        const primaryHSL = hexToHSL(variables.primaryColor);
        document.documentElement.style.setProperty("--primary", primaryHSL);
        document.documentElement.style.setProperty("--ring", primaryHSL);
      }

      // Apply secondary color immediately
      if (variables.secondaryColor) {
        const secondaryHSL = hexToHSL(variables.secondaryColor);
        document.documentElement.style.setProperty("--secondary", secondaryHSL);
      }

      // Invalidate cache to propagate changes globally
      utils.settings.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar configurações");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      logo: "",
      primaryColor: "#DC2626",
      secondaryColor: "#1F2937",
      pixKey: "",
      paymentTerms: "",
      phone: "",
      email: "",
      address: "",
      cnpj: "",
      contractTemplate: "",
      maxDailyCapacity: 10,
      businessHours: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name || "",
        logo: settings.logo || "",
        primaryColor: settings.primaryColor || "#DC2626",
        secondaryColor: settings.secondaryColor || "#1F2937",
        pixKey: settings.pixKey || "",
        paymentTerms: settings.paymentTerms || "",
        phone: settings.phone || "",
        email: settings.email || "",
        address: settings.address || "",
        cnpj: settings.cnpj || "",
        contractTemplate: settings.contractTemplate || "",
        maxDailyCapacity: settings.maxDailyCapacity || 10,
        businessHours: settings.businessHours || "",
        slug: settings.slug || "",
      });

      // Check if logo is a local upload to set initial mode
      if (settings.logo && settings.logo.startsWith("/uploads/")) {
        setLogoMode("upload");
      }

      setInspectionRequired((settings as any).inspectionRequired || "NONE");
      setInspectionSignature((settings as any).inspectionSignature ?? true);
    }
  }, [settings, reset]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    // Validate file type (allow any image, we will convert)
    if (!originalFile.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 50MB initial - conversion usually reduces it)
    if (originalFile.size > 50 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 50MB");
      return;
    }

    setIsUploading(true);

    try {
      // CONVERT TO WEBP ON CLIENT SIDE
      const file = await convertFileToWebP(originalFile);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      setValue("logo", data.url, { shouldDirty: true, shouldValidate: true });
      toast.success("Upload realizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data: SettingsFormData) => {
    updateMutation.mutate({
      name: data.name,
      logo: data.logo || null,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      pixKey: data.pixKey || null,
      paymentTerms: data.paymentTerms || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      cnpj: data.cnpj || null,
      contractTemplate: data.contractTemplate || null,
      maxDailyCapacity: data.maxDailyCapacity,
      businessHours: data.businessHours || null,
      slug: data.slug,
      inspectionRequired: inspectionRequired,
      inspectionSignature: inspectionSignature,
    } as any);
  };

  const primaryColor = watch("primaryColor");
  const logoUrl = watch("logo");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie todos os aspectos da sua oficina em um só lugar
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={updateMutation.isPending}
          size="lg"
          className="shadow-md"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Todas as Alterações
            </>
          )}
        </Button>
      </div>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl w-full sm:w-auto flex flex-wrap h-auto">
            <TabsTrigger
              value="geral"
              className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger
              value="financeiro"
              className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger
              value="operacional"
              className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Wrench className="mr-2 h-4 w-4" />
              Operacional
            </TabsTrigger>
            <TabsTrigger
              value="sistema"
              className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Database className="mr-2 h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* TAB GERAL: Identidade Visual e Contato */}
          <TabsContent
            value="geral"
            className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Identidade Visual */}
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Identidade Visual
                  </CardTitle>
                  <CardDescription>
                    Personalize a aparência do sistema e da página de
                    agendamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Nome da Empresa */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Minha Empresa Ltda"
                      {...register("name")}
                      error={errors.name?.message}
                    />
                  </div>

                  {/* Link da Oficina (Slug) */}
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Link da Oficina (URL)
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground hidden sm:inline bg-muted px-2 py-2 rounded-l-md border border-r-0">
                        autevo.com.br/booking/
                      </span>
                      <Input
                        id="slug"
                        placeholder="nome-da-sua-oficina"
                        {...register("slug")}
                        error={errors.slug?.message}
                        className="sm:rounded-l-none"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Este é o link que você enviará para seus clientes fazerem
                      agendamentos.
                    </p>
                  </div>

                  {/* Logo */}
                  <div className="space-y-4 pt-2">
                    <Label>Logo do Sistema</Label>

                    {logoUrl && (
                      <div className="flex items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 p-6 min-h-[120px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoUrl}
                          alt="Logo Preview"
                          className="h-20 w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}

                    <Tabs
                      value={logoMode}
                      onValueChange={(val) =>
                        setLogoMode(val as "url" | "upload")
                      }
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="url">URL Externa</TabsTrigger>
                        <TabsTrigger value="upload">
                          Upload de Arquivo
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="url" className="mt-4 space-y-2">
                        <Input
                          id="logo"
                          placeholder="https://exemplo.com/logo.png"
                          {...register("logo")}
                          error={errors.logo?.message}
                        />
                      </TabsContent>

                      <TabsContent value="upload" className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="cursor-pointer file:text-primary file:font-bold"
                          />
                          {isUploading && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Colors */}
                  <div className="grid gap-4 sm:grid-cols-2 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Cor Primária</Label>
                      <div className="flex gap-2">
                        <div
                          className="h-10 w-12 rounded-lg border shadow-sm"
                          style={{ backgroundColor: primaryColor || "#DC2626" }}
                        />
                        <input
                          type="color"
                          id="primaryColor"
                          className="sr-only"
                          value={primaryColor || "#DC2626"}
                          onChange={(e) =>
                            setValue("primaryColor", e.target.value, {
                              shouldDirty: true,
                            })
                          }
                        />
                        <Input
                          {...register("primaryColor")}
                          placeholder="#DC2626"
                          className="flex-1 font-mono uppercase"
                          error={errors.primaryColor?.message}
                          onClick={() =>
                            document.getElementById("primaryColor")?.click()
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <div
                          className="h-10 w-12 rounded-lg border shadow-sm"
                          style={{
                            backgroundColor:
                              watch("secondaryColor") || "#1F2937",
                          }}
                        />
                        <input
                          type="color"
                          id="secondaryColor"
                          className="sr-only"
                          value={watch("secondaryColor") || "#1F2937"}
                          onChange={(e) =>
                            setValue("secondaryColor", e.target.value, {
                              shouldDirty: true,
                            })
                          }
                        />
                        <Input
                          {...register("secondaryColor")}
                          placeholder="#1F2937"
                          className="flex-1 font-mono uppercase"
                          error={errors.secondaryColor?.message}
                          onClick={() =>
                            document.getElementById("secondaryColor")?.click()
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contato e Endereço */}
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Informações de Contato
                  </CardTitle>
                  <CardDescription>
                    Dados visíveis para seus clientes e no rodapé do site
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Contato</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@empresa.com"
                      {...register("email")}
                      error={errors.email?.message}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      {...register("phone")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input
                      id="address"
                      placeholder="Rua, número, bairro, cidade - Estado"
                      {...register("address")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessHours">
                      Horário de Funcionamento
                    </Label>
                    <Input
                      id="businessHours"
                      placeholder="Seg a Sex: 08h às 18h"
                      {...register("businessHours")}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB FINANCEIRO: Pix, Termos, CNPJ */}
          <TabsContent
            value="financeiro"
            className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Dados Financeiros
                </CardTitle>
                <CardDescription>
                  Configure informações para pagamentos, chaves Pix e notas
                  fiscais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ da Empresa</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      {...register("cnpj")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pixKey">Chave Pix Padrão</Label>
                    <Input
                      id="pixKey"
                      placeholder="CPF, CNPJ, Email, Telefone ou Aleatória"
                      {...register("pixKey")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Será exibida nas ordens de serviço para facilitar o
                      pagamento.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">
                    Termos e Condições de Pagamento
                  </Label>
                  <textarea
                    id="paymentTerms"
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Ex: Pagamento à vista com 5% de desconto. Parcelamos em até 3x no cartão. Garantia de 30 dias para serviços..."
                    {...register("paymentTerms")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este texto pode aparecer nos orçamentos e recibos gerados
                    pelo sistema.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB OPERACIONAL: Vistorias e Contrato */}
          <TabsContent
            value="operacional"
            className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Vistorias */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Configuração de Vistorias
                  </CardTitle>
                  <CardDescription>
                    Defina as regras para checklist de entrada e saída
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Vistoria Obrigatória</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={inspectionRequired}
                        onChange={(e) =>
                          setInspectionRequired(e.target.value as any)
                        }
                      >
                        <option value="NONE">Nenhuma (Opcional)</option>
                        <option value="ENTRY">Somente Entrada</option>
                        <option value="EXIT">Somente Saída</option>
                        <option value="BOTH">Entrada e Saída</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Define quais vistorias devem ser concluídas antes de
                        finalizar a OS.
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                      <div className="space-y-0.5">
                        <Label>Exigir assinatura do cliente</Label>
                        <p className="text-xs text-muted-foreground">
                          O cliente poderá assinar digitalmente pelo celular.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={inspectionSignature}
                        onClick={() =>
                          setInspectionSignature(!inspectionSignature)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          inspectionSignature ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            inspectionSignature
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Capacidade */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Agendamento Online
                  </CardTitle>
                  <CardDescription>
                    Regras para a página pública de agendamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="maxDailyCapacity">
                      Capacidade Diária de Atendimentos
                    </Label>
                    <Input
                      id="maxDailyCapacity"
                      type="number"
                      {...register("maxDailyCapacity", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantos carros sua oficina pode receber por dia através do
                      agendamento online.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Modelo de Contrato */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Modelo de Contrato e Recibo
                  </CardTitle>
                  <CardDescription>
                    Personalize o documento gerado para impressão.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-muted/50 p-4 border">
                    <p className="text-sm font-bold mb-2">
                      Variáveis disponíveis:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "{{cliente}}",
                        "{{telefone}}",
                        "{{veiculo}}",
                        "{{placa}}",
                        "{{cor}}",
                        "{{servicos}}",
                        "{{total}}",
                        "{{data}}",
                        "{{empresa}}",
                        "{{cnpj}}",
                      ].map((variable) => (
                        <code
                          key={variable}
                          className="rounded bg-background px-2 py-1 text-xs font-mono border shadow-sm"
                        >
                          {variable}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractTemplate">HTML do Contrato</Label>
                    <textarea
                      id="contractTemplate"
                      className="flex min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      placeholder="<h1>RECIBO DE SERVIÇOS</h1>..."
                      {...register("contractTemplate")}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB SISTEMA: Notificações, Privacidade e Backup */}
          <TabsContent
            value="sistema"
            className="space-y-6 animate-in fade-in-50 slide-in-from-left-2 duration-300"
          >
            {/* Notificações Push */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notificações Push
                </CardTitle>
                <CardDescription>
                  Receba alertas em tempo real sobre novas ordens e atualizações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-background p-4">
                  <PushNotificationToggle />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Privacidade e LGPD
                </CardTitle>
                <CardDescription>
                  Gerencie seus dados e exporte backups completos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-background p-6 shadow-sm">
                  <div>
                    <p className="font-bold text-lg mb-1">
                      Backup Completo de Dados
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Baixe um arquivo contendo todos os clientes, veículos,
                      ordens de serviço e histórico financeiro.
                    </p>
                  </div>
                  <BackupButton />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <InfoIcon className="h-4 w-4" />
                  <span>
                    O arquivamento de dados é uma obrigação legal. Recomendamos
                    realizar backups mensais.
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function BackupButton() {
  const { refetch, isFetching } = trpc.backup.exportAllData.useQuery(
    undefined,
    { enabled: false },
  );

  const handleBackup = async () => {
    try {
      const { data } = await refetch();
      if (!data) return;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Backup_Autevo_${formatFilenameDate()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Backup gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar backup");
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleBackup}
      disabled={isFetching}
      className="h-12 px-6 border-2"
    >
      {isFetching ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Baixar Backup (JSON)
    </Button>
  );
}

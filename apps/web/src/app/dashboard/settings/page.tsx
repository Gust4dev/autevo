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
} from "lucide-react";
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
} from "@/components/ui";
import { trpc } from "@/lib/trpc/provider";
import { toast } from "sonner";
import { convertFileToWebP } from "@/lib/image-conversion";

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
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [logoMode, setLogoMode] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);

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
      l * 100
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
      });

      // Check if logo is a local upload to set initial mode
      if (settings.logo && settings.logo.startsWith("/uploads/")) {
        setLogoMode("upload");
      }
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
      console.error("Upload Error:", error);
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
    });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">Personalize sua empresa</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-6 lg:grid-cols-2"
      >
        {/* Identidade Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Identidade Visual
            </CardTitle>
            <CardDescription>
              Personalize a aparência do sistema
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

            {/* Logo */}
            <div className="space-y-4">
              <Label>Logo do Sistema</Label>

              {logoUrl && (
                <div className="mb-4 flex items-center justify-center rounded-lg border bg-muted/50 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo Preview"
                    className="h-20 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              <Tabs
                value={logoMode}
                onValueChange={(val) => setLogoMode(val as "url" | "upload")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    URL Externa
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload de Arquivo
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="mt-4 space-y-2">
                  <Label htmlFor="logo">URL da Imagem</Label>
                  <Input
                    id="logo"
                    placeholder="https://exemplo.com/logo.png"
                    {...register("logo")}
                    error={errors.logo?.message}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole o link direto da sua imagem hospedada
                  </p>
                </TabsContent>

                <TabsContent value="upload" className="mt-4 space-y-2">
                  <Label htmlFor="file-upload">Selecionar Arquivo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                    {isUploading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recomendado: PNG ou SVG, max 2MB. Arquivos locais são salvos
                    em public/uploads.
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Colors */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    className="h-10 w-14 cursor-pointer rounded border p-1"
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
                    className="flex-1 font-mono"
                    error={errors.primaryColor?.message}
                  />
                </div>
                {primaryColor && (
                  <div
                    className="h-2 w-full rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    className="h-10 w-14 cursor-pointer rounded border p-1"
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
                    className="flex-1 font-mono"
                    error={errors.secondaryColor?.message}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Financeiros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Dados Financeiros
            </CardTitle>
            <CardDescription>
              Configure informações para pagamentos e notas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PIX Key */}
            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave Pix</Label>
              <Input
                id="pixKey"
                placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                {...register("pixKey")}
              />
              <p className="text-xs text-muted-foreground">
                Será exibida nas ordens de serviço
              </p>
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Termos de Pagamento</Label>
              <textarea
                id="paymentTerms"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ex: Pagamento à vista. Garantia de 30 dias para serviços..."
                {...register("paymentTerms")}
              />
            </div>

            {/* CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                {...register("cnpj")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informações de Contato
            </CardTitle>
            <CardDescription>
              Dados que aparecerão nas comunicações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  {...register("phone")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contato@empresa.com"
                  {...register("email")}
                  error={errors.email?.message}
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade"
                  {...register("address")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modelo de Contrato */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Modelo de Contrato
            </CardTitle>
            <CardDescription>
              Template HTML que será usado na impressão do contrato. Use as
              variáveis abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">Variáveis disponíveis:</p>
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
                    className="rounded bg-background px-2 py-1 text-xs font-mono border"
                  >
                    {variable}
                  </code>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractTemplate">Template do Contrato</Label>
              <textarea
                id="contractTemplate"
                className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                placeholder="<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>

<p>Contratante: {{cliente}}</p>
<p>Telefone: {{telefone}}</p>

<p>Veículo: {{veiculo}} - {{placa}} - {{cor}}</p>

<p>Serviços contratados:</p>
{{servicos}}

<p>Valor total: {{total}}</p>

<p>Data: {{data}}</p>

<p>{{empresa}} - CNPJ: {{cnpj}}</p>"
                {...register("contractTemplate")}
              />
              <p className="text-xs text-muted-foreground">
                Use HTML básico para formatar. As variáveis serão substituídas
                pelos dados da OS.
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

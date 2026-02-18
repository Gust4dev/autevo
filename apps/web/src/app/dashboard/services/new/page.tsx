"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Search,
  Plus,
  Trash2,
  Package,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Badge,
  Separator,
} from "@/components/ui";
import { trpc } from "@/lib/trpc/provider";
import { toast } from "sonner";
import { useState } from "react";

// Form validation schema
const serviceFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  basePrice: z.string().min(1, "Preço obrigatório"),
  estimatedTime: z.string().optional(),
  returnDays: z.string().optional(),
  defaultCommissionPercent: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

export default function NewServicePage() {
  const router = useRouter();

  const productsQuery = trpc.product.list.useQuery({ limit: 100 });
  const [selectedTemplates, setSelectedTemplates] = useState<
    { productId: string; name: string; quantity: number }[]
  >([]);
  const [productSearch, setProductSearch] = useState("");

  const createMutation = trpc.service.create.useMutation({
    onSuccess: () => {
      toast.success("Serviço cadastrado com sucesso");
      router.push("/dashboard/services");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      basePrice: "",
      estimatedTime: "",
      returnDays: "",
      defaultCommissionPercent: "",
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  const onSubmit = (data: ServiceFormData) => {
    createMutation.mutate({
      name: data.name,
      description: data.description || undefined,
      basePrice: parseFloat(
        data.basePrice.replace(/[^\d,]/g, "").replace(",", "."),
      ),
      estimatedTime: data.estimatedTime
        ? parseInt(data.estimatedTime)
        : undefined,
      returnDays: data.returnDays ? parseInt(data.returnDays) : undefined,
      defaultCommissionPercent: data.defaultCommissionPercent
        ? parseFloat(data.defaultCommissionPercent)
        : undefined,
      isActive: data.isActive,
      productTemplates: selectedTemplates.map((t) => ({
        productId: t.productId,
        quantity: t.quantity,
      })),
    });
  };

  const handleAddTemplate = (product: any) => {
    if (selectedTemplates.some((t) => t.productId === product.id)) return;
    setSelectedTemplates([
      ...selectedTemplates,
      {
        productId: product.id,
        name: product.name,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveTemplate = (productId: string) => {
    setSelectedTemplates(
      selectedTemplates.filter((t) => t.productId !== productId),
    );
  };

  const handleUpdateTemplateQuantity = (
    productId: string,
    quantity: number,
  ) => {
    setSelectedTemplates(
      selectedTemplates.map((t) =>
        t.productId === productId
          ? { ...t, quantity: Math.max(1, quantity) }
          : t,
      ),
    );
  };

  const filteredProducts =
    productsQuery.data?.products.filter(
      (p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
        !selectedTemplates.some((t) => t.productId === p.id),
    ) || [];

  // Format currency as user types
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/services">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Serviço</h1>
          <p className="text-muted-foreground">
            Cadastre um novo serviço no catálogo
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Serviço</CardTitle>
            <CardDescription>
              Campos marcados com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" required>
                Nome do Serviço
              </Label>
              <Input
                id="name"
                data-tutorial-id="service-name-input"
                placeholder="Ex: PPF Frontal"
                {...register("name")}
                error={errors.name?.message}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Descrição detalhada do serviço..."
                {...register("description")}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="basePrice" required>
                Preço Base
              </Label>
              <Input
                id="basePrice"
                data-tutorial-id="service-price-input"
                placeholder="R$ 0,00"
                {...register("basePrice", {
                  onChange: (e) => {
                    e.target.value = formatCurrency(e.target.value);
                  },
                })}
                error={errors.basePrice?.message}
              />
            </div>

            {/* Time and Return */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Tempo Estimado (minutos)</Label>
                <Input
                  id="estimatedTime"
                  data-tutorial-id="service-time-input"
                  type="number"
                  placeholder="Ex: 480"
                  min="0"
                  {...register("estimatedTime")}
                  error={errors.estimatedTime?.message}
                />
                <p className="text-xs text-muted-foreground">
                  480 min = 8 horas
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnDays">Retorno (dias)</Label>
                <Input
                  id="returnDays"
                  type="number"
                  placeholder="Ex: 365"
                  min="0"
                  {...register("returnDays")}
                  error={errors.returnDays?.message}
                />
                <p className="text-xs text-muted-foreground">
                  Prazo para retorno do cliente
                </p>
              </div>
            </div>

            {/* Commission */}
            <div className="space-y-2">
              <Label htmlFor="defaultCommissionPercent">
                Comissão Padrão (%)
              </Label>
              <Input
                id="defaultCommissionPercent"
                type="number"
                placeholder="Ex: 10"
                min="0"
                max="100"
                step="0.1"
                {...register("defaultCommissionPercent")}
                error={errors.defaultCommissionPercent?.message}
              />
            </div>

            <Separator />

            {/* 📦 PRODUCT TEMPLATES SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">
                  Produtos Utilizados (Template)
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Defina quais produtos são gastos automaticamente quando este
                serviço é realizado.
              </p>

              {/* Product Search & Selector */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto para adicionar..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {productSearch && filteredProducts.length > 0 && (
                  <Card className="max-h-48 overflow-y-auto">
                    <CardContent className="p-2 space-y-1">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleAddTemplate(product)}
                          className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-md text-sm text-left"
                        >
                          <span>{product.name}</span>
                          <Plus className="h-4 w-4 text-primary" />
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Selected List */}
              <div className="space-y-3">
                {selectedTemplates.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                      Nenhum produto vinculado a este serviço.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {selectedTemplates.map((template) => (
                      <div
                        key={template.productId}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card"
                      >
                        <div className="flex-1 font-medium">
                          {template.name}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Qtd:</Label>
                            <Input
                              type="number"
                              min="1"
                              className="w-20 h-8"
                              value={template.quantity}
                              onChange={(e) =>
                                handleUpdateTemplateQuantity(
                                  template.productId,
                                  parseInt(e.target.value),
                                )
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() =>
                              handleRemoveTemplate(template.productId)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Active */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setValue("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Serviço ativo (disponível para novas OS)
              </Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/services">Cancelar</Link>
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                id="service-save-button"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Serviço
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

"use client";

import { use, useState, useEffect } from "react";
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
  Skeleton,
  Badge,
  Separator,
} from "@/components/ui";
import { trpc } from "@/lib/trpc/provider";
import { toast } from "sonner";

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditServicePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Queries
  const serviceQuery = trpc.service.getById.useQuery({ id });
  const productsQuery = trpc.product.list.useQuery({ limit: 100 });
  const utils = trpc.useUtils();

  const [selectedTemplates, setSelectedTemplates] = useState<
    { productId: string; name: string; quantity: number }[]
  >([]);
  const [productSearch, setProductSearch] = useState("");

  // Mutation
  const updateService = trpc.service.update.useMutation({
    onSuccess: () => {
      toast.success("Serviço atualizado com sucesso");
      utils.service.getById.invalidate({ id });
      utils.service.list.invalidate(); // Refresh lists
      router.push(`/dashboard/services`);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar serviço");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
  });

  const isActive = watch("isActive");

  // Load data into form
  useEffect(() => {
    if (serviceQuery.data) {
      const service = serviceQuery.data;
      reset({
        name: service.name,
        description: service.description || "",
        basePrice: Number(service.basePrice).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        estimatedTime: service.estimatedTime?.toString() || "",
        returnDays: service.returnDays?.toString() || "",
        defaultCommissionPercent:
          service.defaultCommissionPercent?.toString() || "",
        isActive: service.isActive,
      });

      if (service.productTemplates && selectedTemplates.length === 0) {
        setSelectedTemplates(
          service.productTemplates.map((t: any) => ({
            productId: t.productId,
            name: t.product.name,
            quantity: t.quantity,
          })),
        );
      }
    }
  }, [serviceQuery.data, reset, selectedTemplates.length]);

  const onSubmit = async (data: ServiceFormData) => {
    // Convert formatted string back to number
    const basePrice = parseFloat(data.basePrice.replace(/\D/g, "")) / 100;

    updateService.mutate({
      id,
      data: {
        name: data.name,
        description: data.description,
        basePrice,
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
      },
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

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (serviceQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="space-y-6 pt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (serviceQuery.isError || !serviceQuery.data) {
    return (
      <div className="mx-auto max-w-2xl text-center py-12">
        <h3 className="text-lg font-semibold text-destructive">
          Erro ao carregar serviço
        </h3>
        <p className="text-muted-foreground mb-4">
          {serviceQuery.error?.message || "Serviço não encontrado"}
        </p>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/services`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Serviço</h1>
          <p className="text-muted-foreground">
            Atualize as informações do serviço
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Serviço</CardTitle>
            <CardDescription>
              Campos marcados com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Serviço *</Label>
              <Input
                id="name"
                {...register("name")}
                error={errors.name?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                rows={3}
                {...register("description")}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="basePrice">Preço Base *</Label>
              <Input
                id="basePrice"
                {...register("basePrice", {
                  onChange: (e) => {
                    e.target.value = formatCurrency(e.target.value);
                  },
                })}
                error={errors.basePrice?.message}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Tempo Estimado (minutos)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  min="0"
                  {...register("estimatedTime")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnDays">Retorno (dias)</Label>
                <Input
                  id="returnDays"
                  type="number"
                  min="0"
                  {...register("returnDays")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultCommissionPercent">
                Comissão Padrão (%)
              </Label>
              <Input
                id="defaultCommissionPercent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                {...register("defaultCommissionPercent")}
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

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/services`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={updateService.isPending}>
                {updateService.isPending ? (
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
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Car,
  Plus,
  Trash,
  GripVertical,
  AlertCircle,
} from "lucide-react";
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
} from "@/components/ui";
import { StatusBadge } from "@/components/orders";
import { trpc } from "@/lib/trpc/provider";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/formatters";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface OrderItemState {
  serviceId?: string;
  customName?: string;
  price: number;
  quantity: number;
  notes?: string;
}

export default function EditOrderPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<OrderItemState[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  // Queries
  const orderQuery = trpc.order.getById.useQuery({ id });
  const usersQuery = trpc.user.listForSelect.useQuery();
  const servicesQuery = trpc.service.listActive.useQuery();
  const utils = trpc.useUtils();

  // Mutation
  const updateOrder = trpc.order.update.useMutation({
    onSuccess: () => {
      toast.success("Ordem atualizada com sucesso");
      utils.order.getById.invalidate({ id });
      utils.order.list.invalidate();
      router.push(`/dashboard/orders/${id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const [formData, setFormData] = useState({
    scheduledAt: "",
    scheduledTime: "",
    assignedToId: "",
    discountType: "" as "" | "PERCENTAGE" | "FIXED",
    discountValue: "",
  });

  useEffect(() => {
    if (orderQuery.data) {
      const order = orderQuery.data;
      const date = new Date(order.scheduledAt);

      setFormData({
        scheduledAt: date.toISOString().split("T")[0],
        scheduledTime: date.toTimeString().slice(0, 5),
        assignedToId: order.assignedToId,
        discountType: (order.discountType as "" | "PERCENTAGE" | "FIXED") || "",
        discountValue: order.discountValue?.toString() || "",
      });

      // Load items
      setItems(
        order.items.map((item: any) => ({
          serviceId: item.serviceId || undefined,
          customName: item.customName || undefined,
          price: Number(item.price),
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      );
    }
  }, [orderQuery.data]);

  const handleAddService = () => {
    if (!selectedServiceId) return;

    const service = servicesQuery.data?.find(
      (s: any) => s.id === selectedServiceId,
    );
    if (!service) return;

    setItems((prev) => [
      ...prev,
      {
        serviceId: service.id,
        customName: service.name,
        price: Number(service.basePrice),
        quantity: 1,
      },
    ]);
    setSelectedServiceId("");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_: any, i: number) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof OrderItemState,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item: any, i: number) => {
        if (i !== index) return item;
        return { ...item, [field]: value };
      }),
    );
  };

  // Calculate totals for preview
  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    let discount = 0;

    if (formData.discountType && formData.discountValue) {
      const val = Number(formData.discountValue);
      discount =
        formData.discountType === "PERCENTAGE" ? subtotal * (val / 100) : val;
    }

    return {
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
    };
  };

  const { subtotal, discount, total } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Adicione pelo menos um serviço");
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledDateTime = new Date(
        `${formData.scheduledAt}T${formData.scheduledTime}`,
      );

      await updateOrder.mutateAsync({
        id,
        data: {
          scheduledAt: scheduledDateTime,
          assignedToId: formData.assignedToId,
          discountType: formData.discountType
            ? formData.discountType
            : undefined,
          discountValue: formData.discountValue
            ? Number(formData.discountValue)
            : undefined,
          items: items,
        },
      });
    } catch (error) {
      // Error is handled by onError callback
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  if (orderQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mt-20" />
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="mx-auto max-w-2xl text-center py-12">
        <h3 className="text-lg font-semibold text-destructive">
          Erro ao carregar ordem
        </h3>
        <p className="text-muted-foreground mb-4">
          {orderQuery.error?.message || "Ordem não encontrada"}
        </p>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  const order = orderQuery.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/orders/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              {order.code}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-muted-foreground">Editar informações e valores</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Services & Items */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços e Valores</CardTitle>
            <CardDescription>
              Adicione ou remova serviços e ajuste os preços negociados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Service */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço para adicionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {servicesQuery.data?.map((service: any) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} -{" "}
                        {formatCurrency(Number(service.basePrice))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={handleAddService}
                disabled={!selectedServiceId}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>

            {/* Items List */}
            <div className="rounded-lg border">
              {items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum serviço adicionado.
                </div>
              ) : (
                <div className="divide-y">
                  {items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{item.customName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <Label className="text-xs text-muted-foreground">
                            Qtd
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                parseInt(e.target.value),
                              )
                            }
                          />
                        </div>
                        <div className="w-32">
                          <Label className="text-xs text-muted-foreground">
                            Preço Un.
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "price",
                                parseFloat(e.target.value),
                              )
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-4 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals Preview */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount Edit in Context */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Desconto</span>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountType: e.target.value as
                          | ""
                          | "PERCENTAGE"
                          | "FIXED",
                      }))
                    }
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="">Nenhum</option>
                    <option value="PERCENTAGE">%</option>
                    <option value="FIXED">R$</option>
                  </select>
                </div>
                {formData.discountType && (
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountValue: e.target.value,
                      }))
                    }
                    className="h-8 w-24 text-right"
                    placeholder="0"
                    min="0"
                  />
                )}
              </div>

              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Staff */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Data</Label>
                <Input
                  id="scheduledAt"
                  type="date"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      scheduledAt: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Horário</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      scheduledTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Responsável Técnico</Label>
              {usersQuery.isLoading ? (
                <div className="flex justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-3">
                  {usersQuery.data?.map((user: any) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          assignedToId: user.id,
                        }))
                      }
                      className={`rounded-lg border p-3 text-center transition-colors text-sm ${
                        formData.assignedToId === user.id
                          ? "border-primary bg-primary/5 font-medium text-primary"
                          : "border-input hover:bg-muted/50"
                      }`}
                    >
                      {user.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sticky Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/dashboard/orders/${id}`}>Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || updateOrder.isPending}
            size="lg"
          >
            {isSubmitting || updateOrder.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando Alterações...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

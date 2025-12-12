'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
} from '@/components/ui';
import { trpc } from '@/lib/trpc/provider';
import { toast } from 'sonner';

const productFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().min(1, 'Unidade obrigatória'),
  costPrice: z.string().optional(),
  salePrice: z.string().optional(),
  stock: z.string(),
  minStock: z.string(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: product, isLoading } = trpc.product.getById.useQuery({ id });

  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      toast.success('Produto atualizado com sucesso');
      router.push('/dashboard/products');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        unit: product.unit,
        costPrice: product.costPrice 
          ? Number(product.costPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
          : '',
        salePrice: product.salePrice 
          ? Number(product.salePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
          : '',
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
      });
    }
  }, [product, reset]);

  const onSubmit = (data: ProductFormData) => {
    updateMutation.mutate({
      id,
      data: {
        name: data.name,
        description: data.description || undefined,
        sku: data.sku || undefined,
        unit: data.unit,
        costPrice: data.costPrice ? parseFloat(data.costPrice.replace(/[^\d,]/g, '').replace(',', '.')) : undefined,
        salePrice: data.salePrice ? parseFloat(data.salePrice.replace(/[^\d,]/g, '').replace(',', '.')) : undefined,
        stock: parseInt(data.stock) || 0,
        minStock: parseInt(data.minStock) || 5,
      },
    });
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (isLoading) {
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

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Produto não encontrado</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/products">Voltar para Produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Produto</h1>
          <p className="text-muted-foreground">Atualize as informações do produto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
            <CardDescription>Campos marcados com * são obrigatórios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" required>Nome do Produto</Label>
              <Input id="name" {...register('name')} error={errors.name?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                rows={2}
                {...register('description')}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Código</Label>
                <Input id="sku" {...register('sku')} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit" required>Unidade</Label>
                <Input id="unit" {...register('unit')} error={errors.unit?.message} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Preço de Custo</Label>
                <Input
                  id="costPrice"
                  {...register('costPrice', {
                    onChange: (e) => { e.target.value = formatCurrency(e.target.value); },
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Preço de Venda</Label>
                <Input
                  id="salePrice"
                  {...register('salePrice', {
                    onChange: (e) => { e.target.value = formatCurrency(e.target.value); },
                  })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stock">Estoque Atual</Label>
                <Input id="stock" type="number" min="0" {...register('stock')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Estoque Mínimo</Label>
                <Input id="minStock" type="number" min="0" {...register('minStock')} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/products">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />Salvar Alterações</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

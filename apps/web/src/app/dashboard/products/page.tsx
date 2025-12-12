'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, MoreHorizontal, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';
import { 
  Button, 
  DataTable, 
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/components/ui';
import type { Column } from '@/components/ui';
import { trpc } from '@/lib/trpc/provider';
import { toast } from 'sonner';

export default function ProductsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string; } | null>(null);

  const { data, isLoading, refetch } = trpc.product.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    lowStock: showLowStock || undefined,
  });

  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      toast.success('Produto excluído com sucesso');
      refetch();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  const handleDelete = (product: (typeof products)[number]) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate({ id: productToDelete.id });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const columns: Column<(typeof products)[number]>[] = [
    {
      key: 'name',
      header: 'Produto',
      render: (product) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-medium">{product.name}</span>
            {product.sku && (
              <p className="text-xs text-muted-foreground font-mono">
                {product.sku}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'salePrice',
      header: 'Preço',
      render: (product) => (
        <span className="font-medium">{formatCurrency(Number(product.salePrice ?? 0))}</span>
      ),
    },
    {
      key: 'stock',
      header: 'Estoque',
      render: (product) => {
        const isLowStock = product.stock <= product.minStock;
        return (
          <div className="flex items-center gap-2">
            {isLowStock && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            <span className={isLowStock ? 'text-destructive font-medium' : ''}>
              {product.stock} {product.unit}
            </span>
          </div>
        );
      },
    },
    {
      key: 'minStock',
      header: 'Mín.',
      render: (product) => (
        <span className="text-muted-foreground">{product.minStock}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o estoque de produtos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showLowStock ? 'destructive' : 'outline'}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {showLowStock ? 'Mostrar Todos' : 'Estoque Baixo'}
          </Button>
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Link>
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        page={page}
        totalPages={pagination?.totalPages || 1}
        total={pagination?.total || 0}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou SKU..."
        onRowClick={(product) => router.push(`/dashboard/products/${product.id}/edit`)}
        getRowKey={(product) => product.id}
        emptyTitle="Nenhum produto encontrado"
        emptyDescription="Comece cadastrando seu primeiro produto."
        emptyAction={
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Produto
            </Link>
          </Button>
        }
        renderActions={(product) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/products/${product.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(product)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto{' '}
              <strong>{productToDelete?.name}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

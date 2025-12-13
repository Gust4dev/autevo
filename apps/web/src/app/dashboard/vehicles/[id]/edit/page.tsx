'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, User, Search, X } from 'lucide-react';
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

// Form validation schema
const vehicleFormSchema = z.object({
  plate: z.string().min(7, 'Placa inválida').max(8),
  brand: z.string().min(2, 'Marca obrigatória'),
  model: z.string().min(1, 'Modelo obrigatório'),
  color: z.string().min(2, 'Cor obrigatória'),
  year: z.string().optional(),
  customerId: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleFormSchema>;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditVehiclePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  
  // State for customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [isChangingCustomer, setIsChangingCustomer] = useState(false);

  // Queries
  const vehicleQuery = trpc.vehicle.getById.useQuery({ id });
  const customersQuery = trpc.customer.list.useQuery(
    { search: customerSearch, limit: 5 },
    { enabled: isChangingCustomer || !vehicleQuery.data?.customer, placeholderData: (prev) => prev }
  );
  
  const utils = trpc.useUtils();

  // Mutation
  const updateVehicle = trpc.vehicle.update.useMutation({
    onSuccess: () => {
      toast.success('Veículo atualizado com sucesso');
      utils.vehicle.getById.invalidate({ id });
      utils.vehicle.list.invalidate(); // Refresh lists
      router.push(`/dashboard/vehicles/${id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar veículo');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
  });

  const selectedCustomerId = watch('customerId');
  const filteredCustomers = customersQuery.data?.customers || [];

  // Load data into form
  useEffect(() => {
    if (vehicleQuery.data) {
      const vehicle = vehicleQuery.data;
      reset({
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        year: vehicle.year?.toString() || '',
        customerId: vehicle.customerId || '',
      });
      // If no customer, we default to showing the search
      if (!vehicle.customerId) {
          setIsChangingCustomer(true);
      }
    }
  }, [vehicleQuery.data, reset]);

  const onSubmit = async (data: VehicleFormData) => {
    updateVehicle.mutate({
      id,
      data: {
        ...data,
        year: data.year ? parseInt(data.year) : undefined,
      },
    });
  };

  const formatPlate = (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length <= 3) return clean;
    if (clean.length <= 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
  };

  // Find selected customer name for display
  const getSelectedCustomerName = () => {
      if (!selectedCustomerId) return null;
      // Try to find in query or existing vehicle
      const fromQuery = filteredCustomers.find(c => c.id === selectedCustomerId);
      if (fromQuery) return fromQuery;
      
      if (vehicleQuery.data?.customer?.id === selectedCustomerId) {
          return vehicleQuery.data.customer;
      }
      return null;
  };

  const selectedCustomerDisplay = getSelectedCustomerName();


  if (vehicleQuery.isLoading) {
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
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
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

  if (vehicleQuery.isError || !vehicleQuery.data) {
    return (
      <div className="mx-auto max-w-2xl text-center py-12">
        <h3 className="text-lg font-semibold text-destructive">Erro ao carregar veículo</h3>
        <p className="text-muted-foreground mb-4">{vehicleQuery.error?.message || 'Veículo não encontrado'}</p>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/vehicles/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Veículo</h1>
          <p className="text-muted-foreground">
            Atualize as informações do veículo
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Veículo</CardTitle>
            <CardDescription>
              Campos marcados com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Owner Section */}
            <div className="space-y-2">
              <Label>Proprietário</Label>
              
              {!isChangingCustomer ? (
                  /* Display Current Owner */
                  <div className="flex items-center justify-between rounded-lg border border-input bg-muted/50 p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                        <p className="font-medium">{selectedCustomerDisplay?.name || 'Sem proprietário'}</p>
                        <p className="text-sm text-muted-foreground">{selectedCustomerDisplay?.phone || '-'}</p>
                        </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsChangingCustomer(true)}>
                        Alterar
                    </Button>
                  </div>
              ) : (
                  /* Customer Search */
                  <div className="space-y-3 rounded-lg border border-input p-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                         <Label className="text-xs font-semibold uppercase text-muted-foreground">Buscar Cliente</Label>
                         {selectedCustomerDisplay && (
                             <Button type="button" variant="ghost" size="sm" onClick={() => setIsChangingCustomer(false)}>
                                 <X className="h-4 w-4 mr-1" /> Cancelar
                             </Button>
                         )}
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Nome ou telefone..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-10 bg-background"
                      />
                    </div>

                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-background p-1">
                      {customersQuery.isLoading && (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      
                      {!customersQuery.isLoading && filteredCustomers.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-2">
                          Nenhum cliente encontrado.
                        </p>
                      )}

                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => {
                              setValue('customerId', customer.id);
                              setIsChangingCustomer(false);
                          }}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                              selectedCustomerId === customer.id ? 'bg-accent text-accent-foreground' : ''
                          }`}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-muted-foreground">{customer.phone}</div>
                        </button>
                      ))}
                    </div>
                  </div>
              )}
            </div>

            {/* Plate */}
            <div className="space-y-2">
              <Label htmlFor="plate">Placa *</Label>
              <Input
                id="plate"
                placeholder="ABC-1234"
                {...register('plate', {
                  onChange: (e) => {
                    setValue('plate', formatPlate(e.target.value));
                  },
                })}
                error={errors.plate?.message}
                className="uppercase font-mono"
              />
            </div>

            {/* Brand & Model */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  placeholder="Ex: BMW"
                  {...register('brand')}
                  error={errors.brand?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  placeholder="Ex: X5"
                  {...register('model')}
                  error={errors.model?.message}
                />
              </div>
            </div>

            {/* Color & Year */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="color">Cor *</Label>
                <Input
                  id="color"
                  placeholder="Ex: Preta"
                  {...register('color')}
                  error={errors.color?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="Ex: 2024"
                  min="1900"
                  max="2030"
                  {...register('year')}
                  error={errors.year?.message}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/vehicles/${id}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={updateVehicle.isPending}>
                {updateVehicle.isPending ? (
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

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Search, User } from 'lucide-react';
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
  customerId: z.string().min(1, 'Selecione um cliente'),
});

type VehicleFormData = z.infer<typeof vehicleFormSchema>;

export default function NewVehiclePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);

  const { data: customers = [] } = trpc.customer.search.useQuery(
    { query: customerSearch || '' },
    { enabled: customerSearch.length >= 2 }
  );

  // Load preselected customer
  const { data: preloadedCustomer } = trpc.customer.getById.useQuery(
    { id: preselectedCustomerId! },
    { enabled: !!preselectedCustomerId && !selectedCustomer }
  );

  // Set selected customer from preloaded
  if (preloadedCustomer && !selectedCustomer) {
    setSelectedCustomer({
      id: preloadedCustomer.id,
      name: preloadedCustomer.name,
      phone: preloadedCustomer.phone,
    });
  }

  const createMutation = trpc.vehicle.create.useMutation({
    onSuccess: () => {
      toast.success('Veículo cadastrado com sucesso');
      if (preselectedCustomerId) {
        router.push(`/dashboard/customers/${preselectedCustomerId}`);
      } else {
        router.push('/dashboard/vehicles');
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      plate: '',
      brand: '',
      model: '',
      color: '',
      year: '',
      customerId: preselectedCustomerId || '',
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    createMutation.mutate({
      plate: data.plate.replace('-', ''),
      brand: data.brand,
      model: data.model,
      color: data.color,
      year: data.year ? parseInt(data.year) : undefined,
      customerId: data.customerId,
    });
  };

  // Format plate as user types
  const formatPlate = (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length <= 3) return clean;
    if (clean.length <= 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
  };

  const selectCustomer = (customer: { id: string; name: string; phone: string }) => {
    setSelectedCustomer(customer);
    setValue('customerId', customer.id);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={preselectedCustomerId ? `/dashboard/customers/${preselectedCustomerId}` : '/dashboard/vehicles'}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Veículo</h1>
          <p className="text-muted-foreground">
            Cadastre um novo veículo no sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Veículo</CardTitle>
            <CardDescription>
              Preencha os dados do veículo. Campos marcados com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label required>Proprietário</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between rounded-lg border border-input bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedCustomer.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setValue('customerId', '');
                    }}
                  >
                    Alterar
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente por nome ou telefone..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="pl-10"
                    error={errors.customerId?.message}
                  />
                  {showCustomerDropdown && customerSearch.length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
                      {customers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Nenhum cliente encontrado
                        </div>
                      ) : (
                        customers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 first:rounded-t-lg last:rounded-b-lg"
                            onClick={() => selectCustomer(customer)}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">{customer.phone}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Plate */}
            <div className="space-y-2">
              <Label htmlFor="plate" required>Placa</Label>
              <Input
                id="plate"
                placeholder="ABC-1234"
                {...register('plate', {
                  onChange: (e) => {
                    e.target.value = formatPlate(e.target.value);
                  },
                })}
                error={errors.plate?.message}
                className="uppercase"
              />
            </div>

            {/* Brand & Model */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand" required>Marca</Label>
                <Input
                  id="brand"
                  placeholder="Ex: BMW"
                  {...register('brand')}
                  error={errors.brand?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model" required>Modelo</Label>
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
                <Label htmlFor="color" required>Cor</Label>
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
                <Link href={preselectedCustomerId ? `/dashboard/customers/${preselectedCustomerId}` : '/dashboard/vehicles'}>
                  Cancelar
                </Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Veículo
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

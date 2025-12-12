'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Settings, Palette, CreditCard } from 'lucide-react';
import Link from 'next/link';
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
} from '@/components/ui';
import { trpc } from '@/lib/trpc/provider';
import { toast } from 'sonner';

const settingsSchema = z.object({
  logo: z.string().url('URL inválida').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  pixKey: z.string().optional(),
  paymentTerms: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  cnpj: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

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

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: (_, variables) => {
      toast.success('Configurações salvas com sucesso!');
      
      // Apply primary color immediately
      if (variables.primaryColor) {
        const primaryHSL = hexToHSL(variables.primaryColor);
        document.documentElement.style.setProperty('--primary', primaryHSL);
        document.documentElement.style.setProperty('--ring', primaryHSL);
      }
      
      // Apply secondary color immediately
      if (variables.secondaryColor) {
        const secondaryHSL = hexToHSL(variables.secondaryColor);
        document.documentElement.style.setProperty('--secondary', secondaryHSL);
      }
      
      // Invalidate cache to propagate changes globally
      utils.settings.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao salvar configurações');
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
      logo: '',
      primaryColor: '#DC2626',
      secondaryColor: '#1F2937',
      pixKey: '',
      paymentTerms: '',
      phone: '',
      email: '',
      address: '',
      cnpj: '',
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        logo: settings.logo || '',
        primaryColor: settings.primaryColor || '#DC2626',
        secondaryColor: settings.secondaryColor || '#1F2937',
        pixKey: settings.pixKey || '',
        paymentTerms: settings.paymentTerms || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        cnpj: settings.cnpj || '',
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: SettingsFormData) => {
    updateMutation.mutate({
      logo: data.logo || null,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      pixKey: data.pixKey || null,
      paymentTerms: data.paymentTerms || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      cnpj: data.cnpj || null,
    });
  };

  const primaryColor = watch('primaryColor');

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
            <p className="text-muted-foreground">
              Personalize sua empresa
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={!isDirty || updateMutation.isPending}
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

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-2">
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
            {/* Logo */}
            <div className="space-y-2">
              <Label htmlFor="logo">URL do Logo</Label>
              <Input
                id="logo"
                placeholder="https://exemplo.com/logo.png"
                {...register('logo')}
                error={errors.logo?.message}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 200x200px, formato PNG ou SVG
              </p>
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
                    value={primaryColor || '#DC2626'}
                    onChange={(e) => setValue('primaryColor', e.target.value, { shouldDirty: true })}
                  />
                  <Input
                    {...register('primaryColor')}
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
                    value={watch('secondaryColor') || '#1F2937'}
                    onChange={(e) => setValue('secondaryColor', e.target.value, { shouldDirty: true })}
                  />
                  <Input
                    {...register('secondaryColor')}
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
                {...register('pixKey')}
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
                {...register('paymentTerms')}
              />
            </div>

            {/* CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                {...register('cnpj')}
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
                  {...register('phone')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contato@empresa.com"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade"
                  {...register('address')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

'use client';

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
} from '@/components/ui';
import { trpc } from '@/lib/trpc/provider';
import { toast } from 'sonner';

// Form validation schema
const customerFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  document: z.string().optional(),
  notes: z.string().optional(),
  whatsappOptIn: z.boolean().default(true),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

export default function NewCustomerPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      document: '',
      notes: '',
      whatsappOptIn: true,
    },
  });

  const whatsappOptIn = watch('whatsappOptIn');

  const createMutation = trpc.customer.create.useMutation({
    onSuccess: () => {
      toast.success('Cliente cadastrado com sucesso');
      router.push('/dashboard/customers');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    createMutation.mutate({
      name: data.name,
      phone: data.phone.replace(/\D/g, ''),
      email: data.email || undefined,
      document: data.document || undefined,
      notes: data.notes || undefined,
      whatsappOptIn: data.whatsappOptIn,
    });
  };

  // Format phone number as user types
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Format CPF/CNPJ as user types
  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    } else {
      // CNPJ
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
      if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/customers">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-muted-foreground">
            Cadastre um novo cliente no sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
            <CardDescription>
              Preencha os dados do cliente. Campos marcados com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" required>Nome Completo</Label>
              <Input
                id="name"
                placeholder="Ex: João da Silva"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" required>Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                {...register('phone', {
                  onChange: (e) => {
                    e.target.value = formatPhone(e.target.value);
                  },
                })}
                error={errors.phone?.message}
              />
            </div>

            {/* WhatsApp Opt-in */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="whatsappOptIn"
                checked={whatsappOptIn}
                onChange={(e) => setValue('whatsappOptIn', e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="whatsappOptIn" className="cursor-pointer">
                Cliente aceita receber mensagens via WhatsApp
              </Label>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            {/* Document (CPF/CNPJ) */}
            <div className="space-y-2">
              <Label htmlFor="document">CPF / CNPJ</Label>
              <Input
                id="document"
                placeholder="000.000.000-00"
                {...register('document', {
                  onChange: (e) => {
                    e.target.value = formatDocument(e.target.value);
                  },
                })}
                error={errors.document?.message}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Informações adicionais sobre o cliente..."
                {...register('notes')}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/customers">Cancelar</Link>
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
                    Salvar Cliente
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

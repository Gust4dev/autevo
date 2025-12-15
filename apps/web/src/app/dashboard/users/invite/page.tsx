'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
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

const inviteFormSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.enum(['OWNER', 'MANAGER', 'MEMBER']),
  defaultCommissionPercent: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteFormSchema>;

const roleOptions = [
  { 
    value: 'OWNER', 
    label: 'Dono / Estrategista', 
    description: 'Acesso total: Financeiro, Configurações e Equipe.',
  },
  { 
    value: 'MANAGER', 
    label: 'Gerente', 
    description: 'Gerencia OS, Clientes e Equipe. Sem acesso a configurações sensíveis.',
  },
  { 
    value: 'MEMBER', 
    label: 'Funcionário', 
    description: 'Executa serviços e atualiza status de OS.',
  },
];

export default function InviteUserPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      role: 'MEMBER',
      defaultCommissionPercent: '',
    },
  });

  const selectedRole = watch('role');

  const inviteMutation = trpc.user.invite.useMutation({
    onSuccess: (data) => {
      toast.success(`Convite enviado para ${data.email}`);
      router.push('/dashboard/users');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate({
      email: data.email,
      name: data.name,
      role: data.role,
      defaultCommissionPercent: data.defaultCommissionPercent 
        ? parseFloat(data.defaultCommissionPercent) 
        : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Convidar Usuário</h1>
          <p className="text-muted-foreground">
            Envie um convite por email para adicionar um novo membro à equipe
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Convidado</CardTitle>
            <CardDescription>
              O usuário receberá um email para criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" required>Nome Completo</Label>
              <Input
                id="name"
                placeholder="Ex: João Silva"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" required>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: joao@empresa.com"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            {/* Role */}
            <div className="space-y-3">
              <Label required>Cargo</Label>
              <div className="grid gap-3">
                {roleOptions.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setValue('role', role.value as 'OWNER' | 'MANAGER' | 'MEMBER')}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      selectedRole === role.value
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:bg-muted/50'
                    }`}
                  >
                    <p className="font-medium">{role.label}</p>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Commission */}
            <div className="space-y-2">
              <Label htmlFor="defaultCommissionPercent">Comissão Padrão (%)</Label>
              <Input
                id="defaultCommissionPercent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Ex: 10"
                {...register('defaultCommissionPercent')}
              />
              <p className="text-xs text-muted-foreground">
                Percentual de comissão padrão para serviços executados
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/users">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Convite
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
        <CardContent className="pt-6">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            Como funciona o convite?
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>• O usuário recebe um email com link de cadastro</li>
            <li>• Ele cria sua própria senha no primeiro acesso</li>
            <li>• Após o cadastro, terá acesso imediato ao sistema</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

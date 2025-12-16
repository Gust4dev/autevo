'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { trpc } from '@/lib/trpc/provider';
import { toast } from 'sonner';

const inviteSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.enum(['MANAGER', 'MEMBER']),
  // HR Fields
  jobTitle: z.string().optional(),
  salary: z.coerce.number().min(0, 'Salário deve ser maior ou igual a 0').optional(),
  defaultCommissionPercent: z.coerce.number().min(0).max(100, 'Comissão deve ser entre 0 e 100').optional(),
  pixKey: z.string().optional(),
  admissionDate: z.string().optional(), // We'll parse this to Date on submit
});

type InviteFormData = z.infer<typeof inviteSchema>;

export function InviteMemberModal() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const inviteMutation = trpc.user.invite.useMutation({
    onSuccess: () => {
      toast.success('Convite enviado com sucesso!');
      utils.user.list.invalidate();
      setOpen(false);
      reset();
      setErrorMessage(null);
    },
    onError: (error) => {
      const msg = error.message || 'Erro ao enviar convite';
      setErrorMessage(msg);
      toast.error(msg);
      console.error('Invite Error:', error);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'MEMBER',
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate({
      ...data,
      admissionDate: data.admissionDate ? new Date(data.admissionDate) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Convidar Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl"> {/* Increased width slightly */}
        <DialogHeader>
          <DialogTitle>Convidar Novo Membro</DialogTitle>
          <DialogDescription>
            Envie um convite por email e configure os dados do funcionário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {errorMessage && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
              <p className="font-semibold">Erro ao processar convite:</p>
              <p>{errorMessage}</p>
            </div>
          )}
          
          {/* Dados Pessoais */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Funcionário</Label>
            <Input
              id="name"
              placeholder="Ex: João da Silva"
              {...register('name')}
            />
            {errors.name && (
              <span className="text-sm text-destructive">{errors.name.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="joao@exemplo.com"
              {...register('email')}
            />
            {errors.email && (
              <span className="text-sm text-destructive">{errors.email.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Cargo / Função</Label>
              <Input id="jobTitle" placeholder="Ex: Mecânico Chefe" {...register('jobTitle')} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admissionDate">Data de Admissão</Label>
              <Input id="admissionDate" type="date" {...register('admissionDate')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="salary">Salário Base (R$)</Label>
              <Input 
                id="salary" 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                {...register('salary')} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultCommissionPercent">Comissão Padrão (%)</Label>
              <Input 
                id="defaultCommissionPercent" 
                type="number" 
                step="0.1" 
                placeholder="0" 
                {...register('defaultCommissionPercent')} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
             <Label htmlFor="pixKey">Chave Pix (Para Comissões)</Label>
             <Input id="pixKey" placeholder="CPF, Email, ou Telefone" {...register('pixKey')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Nível de Acesso (Sistema)</Label>
            <Select
              onValueChange={(val) => setValue('role', val as 'MANAGER' | 'MEMBER')}
              defaultValue={watch('role')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">
                  <div className="flex flex-col">
                    <span className="font-medium">Membro / Técnico</span>
                    <span className="text-xs text-muted-foreground">Vê apenas suas próprias ordens</span>
                  </div>
                </SelectItem>
                <SelectItem value="MANAGER">
                  <div className="flex flex-col">
                    <span className="font-medium">Gerente / Admin</span>
                    <span className="text-xs text-muted-foreground">Acesso total</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

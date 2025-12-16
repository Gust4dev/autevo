'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Mail, Shield, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { trpc } from '@/lib/trpc/provider';
import { toast } from 'sonner';
import { InviteMemberModal } from '@/components/settings/invite-member-modal';

export default function TeamSettingsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: users, isLoading } = trpc.user.list.useQuery();
  const deactivateMutation = trpc.user.deactivate.useMutation({
    onSuccess: () => {
      toast.success('Usuário desativado com sucesso');
      utils.user.list.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao desativar usuário');
    },
  });

  const reactivateMutation = trpc.user.reactivate.useMutation({
    onSuccess: () => {
      toast.success('Usuário reativado com sucesso');
      utils.user.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao reativar usuário');
    },
  });

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      setDeleteId(id);
    } else {
      reactivateMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gerenciar Equipe</h1>
            <p className="text-muted-foreground">
              Convide e gerencie os membros da sua equipe
            </p>
          </div>
        </div>
        <InviteMemberModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros ({users?.length || 0})</CardTitle>
          <CardDescription>
            Lista de todos os usuários com acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entrou em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback>
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        {user.jobTitle && (
                          <span className="text-xs text-muted-foreground font-medium text-primary/80">
                            {user.jobTitle}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'OWNER' ? 'default' : 'secondary'}>
                      {user.role === 'OWNER' && <Shield className="mr-1 h-3 w-3" />}
                      {user.role === 'MANAGER' && <User className="mr-1 h-3 w-3" />}
                      {user.role === 'MEMBER' ? 'Membro' : user.role === 'OWNER' ? 'Dono' : 'Gerente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.status === 'INVITED' ? (
                      <Badge variant="warning" className="bg-yellow-500/15 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/25">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Pendente
                      </Badge>
                    ) : (
                      <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "d 'de' MMMM, yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role !== 'OWNER' && (
                      <Button
                        variant={user.isActive ? 'ghost' : 'outline'}
                        size="sm"
                        className={user.isActive ? 'text-destructive hover:text-destructive' : ''}
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                      >
                        {user.isActive ? (
                          <Trash2 className="h-4 w-4" />
                        ) : (
                          'Reativar'
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum membro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Deactivation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar este usuário? Ele perderá o acesso ao sistema imediatamente, mas seus dados históricos serão mantidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteId && deactivateMutation.mutate({ id: deleteId })}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? 'Desativando...' : 'Confirmar Desativação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

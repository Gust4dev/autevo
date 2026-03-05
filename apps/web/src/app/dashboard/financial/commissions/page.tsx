"use client";

import { useState } from "react";
import {
  Users,
  DollarSign,
  Calendar,
  Search,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/provider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Input,
  Label,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CommissionsPage() {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PIX");

  const utils = trpc.useUtils();
  const meQuery = trpc.user.me.useQuery();
  const usersQuery = trpc.user.list.useQuery(undefined, {
    enabled: meQuery.data?.role !== "MEMBER",
  });

  const commissionsQuery = trpc.order.getPendingCommissions.useQuery({
    userId: selectedUser || undefined,
  });

  const createSettlement = trpc.order.createSettlement.useMutation({
    onSuccess: () => {
      toast.success("Acerto realizado com sucesso");
      setSettlementDialogOpen(false);
      setSelectedCommissions([]);
      utils.order.getPendingCommissions.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao realizar acerto");
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calculateTotalToPay = () => {
    return (commissionsQuery.data || [])
      .filter((c) => selectedCommissions.includes(c.id))
      .reduce((acc, c) => acc + Number(c.commissionValue), 0);
  };

  const handleSelectAll = () => {
    if (selectedCommissions.length === commissionsQuery.data?.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(commissionsQuery.data?.map((c) => c.id) || []);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedCommissions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  if (meQuery.isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Acertos de Comissões
          </h1>
          <p className="text-muted-foreground">
            Gerencie e realize o pagamento de comissões para a equipe.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/financial">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meQuery.data?.role !== "MEMBER" && (
              <div className="space-y-2">
                <Label>Técnico</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    setSelectedCommissions([]);
                  }}
                >
                  <option value="">Todos os Técnicos</option>
                  {usersQuery.data?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-2">
              <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Total Pendente
                </p>
                <p className="text-2xl font-black text-primary">
                  {formatCurrency(
                    commissionsQuery.data?.reduce(
                      (acc, c) => acc + Number(c.commissionValue),
                      0,
                    ) || 0,
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {commissionsQuery.data?.length || 0} itens aguardando acerto
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Comissões Pendentes</CardTitle>
              <CardDescription>
                Selecione as comissões para realizar o fechamento.
              </CardDescription>
            </div>
            {selectedCommissions.length > 0 &&
              meQuery.data?.role !== "MEMBER" && (
                <Button
                  onClick={() => setSettlementDialogOpen(true)}
                  className="shadow-lg animate-in fade-in slide-in-from-right-4"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Fechar Acerto ({selectedCommissions.length})
                </Button>
              )}
          </CardHeader>
          <CardContent>
            {commissionsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : commissionsQuery.data?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Tudo limpo! Nenhuma comissão pendente encontrada.
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {meQuery.data?.role !== "MEMBER" && (
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={
                              selectedCommissions.length ===
                              commissionsQuery.data?.length
                            }
                            onChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>Data</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionsQuery.data?.map((c: any) => (
                      <TableRow key={c.id}>
                        {meQuery.data?.role !== "MEMBER" && (
                          <TableCell>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                              checked={selectedCommissions.includes(c.id)}
                              onChange={() => toggleSelection(c.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="text-xs">
                          {format(new Date(c.calculatedAt), "dd/MM/yy HH:mm")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {c.user.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            #{c.orderItem.order.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm">
                          {c.orderItem.customName || c.orderItem.service?.name}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {formatCurrency(Number(c.commissionValue))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settlement Confirmation Dialog */}
      <Dialog
        open={settlementDialogOpen}
        onOpenChange={setSettlementDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Acerto de Comissões</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Técnico:</span>
                <span className="font-bold">
                  {usersQuery.data?.find((u) => u.id === selectedUser)?.name ||
                    "Múltiplos"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Itens Selecionados:</span>
                <span className="font-bold">{selectedCommissions.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg pt-1">
                <span className="font-medium">Total a Pagar:</span>
                <span className="font-black text-primary">
                  {formatCurrency(calculateTotalToPay())}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="PIX">PIX</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="TRANSFERENCIA">Transferência Bancária</option>
              </select>
            </div>

            <p className="text-[10px] text-muted-foreground italic">
              * Ao confirmar, esses itens serão marcados como pagos e não
              aparecerão mais nesta lista.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettlementDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Determine target user (if multiple selected, we should probably handle it, but for now we filter by user)
                if (!selectedUser && meQuery.data?.role !== "MEMBER") {
                  toast.error(
                    "Por favor, selecione um técnico específico para realizar o acerto.",
                  );
                  return;
                }

                createSettlement.mutate({
                  userId: selectedUser,
                  commissionIds: selectedCommissions,
                  paymentMethod,
                  periodStart: new Date(),
                  periodEnd: new Date(),
                });
              }}
              disabled={createSettlement.isPending}
            >
              {createSettlement.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Receipt className="mr-2 h-4 w-4" />
              )}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
